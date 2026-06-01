from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional, List, Tuple
import json
from app.models import Customer, User, ActivityLog, TeamMember
from app.schemas import CustomerCreate, CustomerUpdate


def create_customer(db: Session, data: CustomerCreate, user: User) -> Tuple[Customer, Optional[Customer]]:
    duplicates = _find_duplicates(db, data, user.id, data.team_id)

    tags_json = json.dumps(data.tags) if data.tags else None

    customer = Customer(
        name=data.name,
        company=data.company,
        phone=data.phone,
        email=data.email,
        tags=tags_json,
        notes=data.notes,
        address=data.address,
        website=data.website,
        owner_id=user.id,
        team_id=data.team_id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    create_fields = {}
    for field in ["name", "company", "phone", "email", "tags", "notes", "address", "website"]:
        val = getattr(data, field, None)
        if val:
            if field == "tags" and isinstance(val, list):
                create_fields[field] = ", ".join(val)
            else:
                create_fields[field] = str(val)
    details = json.dumps({"fields": create_fields}) if create_fields else None
    _log_activity(db, user.id, data.team_id, "created", "customer", customer.id, details)

    return customer, duplicates[0] if duplicates else None


def list_customers(
    db: Session,
    user: User,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    team_id: Optional[int] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
) -> Tuple[List[Customer], int]:
    query = db.query(Customer)

    user_team_ids = [m.team_id for m in db.query(TeamMember.team_id).filter(TeamMember.user_id == user.id).all()]

    if team_id:
        query = query.filter(Customer.team_id == team_id)
    else:
        conditions = [Customer.owner_id == user.id, Customer.team_id.is_(None)]
        if user_team_ids:
            conditions.append(Customer.team_id.in_(user_team_ids))
        query = query.filter(or_(*conditions))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.company.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
            )
        )

    if tag:
        query = query.filter(Customer.tags.ilike(f'%"{tag}"%'))

    sort_column = getattr(Customer, sort_by, Customer.updated_at)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    total = query.count()
    customers = query.options(joinedload(Customer.owner)).offset((page - 1) * per_page).limit(per_page).all()

    return customers, total


def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    return db.query(Customer).options(joinedload(Customer.owner)).filter(Customer.id == customer_id).first()


def update_customer(
    db: Session, customer_id: int, data: CustomerUpdate, user: User
) -> Tuple[Customer, Optional[Customer]]:
    customer = get_customer(db, customer_id)
    if customer is None:
        return None, None

    update_data = data.model_dump(exclude_unset=True)

    if "tags" in update_data and update_data["tags"] is not None:
        update_data["tags"] = json.dumps(update_data["tags"])

    old_values = {
        key: getattr(customer, key) for key in update_data.keys()
    }

    for key, value in update_data.items():
        setattr(customer, key, value)

    duplicates = None
    if data.name or data.phone or data.email:
        check_data = CustomerCreate(
            name=data.name or customer.name,
            company=data.company or customer.company,
            phone=data.phone or customer.phone,
            email=data.email or customer.email,
            team_id=data.team_id or customer.team_id,
        )
        duplicates = _find_duplicates(db, check_data, user.id, customer.team_id, exclude_id=customer_id)

    db.commit()
    db.refresh(customer)

    changes = {}
    for k, v in update_data.items():
        old_val = old_values.get(k)
        new_val = v
        if k == "tags":
            if isinstance(old_val, str):
                try:
                    old_val = ", ".join(json.loads(old_val))
                except (json.JSONDecodeError, TypeError):
                    pass
            if isinstance(new_val, list):
                new_val = ", ".join(new_val)
            elif isinstance(new_val, str):
                try:
                    parsed = json.loads(new_val)
                    if isinstance(parsed, list):
                        new_val = ", ".join(parsed)
                except (json.JSONDecodeError, TypeError):
                    pass
        if str(old_val) != str(new_val):
            changes[k] = {"old": str(old_val), "new": str(new_val)}
    details = json.dumps({"changes": changes})
    _log_activity(db, user.id, customer.team_id, "updated", "customer", customer_id, details)

    return customer, duplicates[0] if duplicates else None


def delete_customer(db: Session, customer_id: int, user: User) -> bool:
    customer = get_customer(db, customer_id)
    if customer is None:
        return False

    team_id = customer.team_id
    db.delete(customer)
    db.commit()

    _log_activity(db, user.id, team_id, "deleted", "customer", customer_id)
    return True


def get_tags(db: Session, team_id: Optional[int] = None) -> Tuple[List[str], dict]:
    query = db.query(Customer.tags).filter(Customer.tags.isnot(None))
    if team_id:
        query = query.filter(Customer.team_id == team_id)

    all_tags = query.all()
    tag_counts = {}
    for (tags_json,) in all_tags:
        try:
            tags = json.loads(tags_json)
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        except (json.JSONDecodeError, TypeError):
            continue

    return list(tag_counts.keys()), tag_counts


def get_search_suggestions(db: Session, query: str, limit: int = 10) -> List[str]:
    pattern = f"%{query}%"
    results = (
        db.query(Customer.name)
        .filter(Customer.name.ilike(pattern))
        .distinct()
        .limit(limit)
        .all()
    )
    return [name for (name,) in results]


def _find_duplicates(
    db: Session, data: CustomerCreate, owner_id: int, team_id: Optional[int], exclude_id: Optional[int] = None
) -> List[Customer]:
    conditions = []
    if data.name and data.phone:
        conditions.append(and_(Customer.name == data.name, Customer.phone == data.phone))
    if data.name and data.email:
        conditions.append(and_(Customer.name == data.name, Customer.email == data.email))

    if not conditions:
        return []

    query = db.query(Customer).filter(
        and_(
            or_(*conditions),
            Customer.owner_id == owner_id,
        )
    )

    if team_id:
        query = query.filter(Customer.team_id == team_id)

    if exclude_id:
        query = query.filter(Customer.id != exclude_id)

    return query.all()


def _log_activity(
    db: Session, user_id: int, team_id: Optional[int], action: str, entity_type: str, entity_id: int, details: Optional[str] = None
):
    log = ActivityLog(
        user_id=user_id,
        team_id=team_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(log)
    db.commit()
