from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import User, Customer, CustomerRelation
from app.schemas import RelationCreate, RelationResponse, RelationListResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/relations", tags=["relations"])


@router.get("/", response_model=RelationListResponse)
@router.get("", response_model=RelationListResponse)
def list_relations(
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(CustomerRelation)

    if customer_id:
        query = query.filter(
            or_(
                CustomerRelation.source_id == customer_id,
                CustomerRelation.target_id == customer_id,
            )
        )

    relations = query.all()

    items = []
    for r in relations:
        source = db.query(Customer).filter(Customer.id == r.source_id).first()
        target = db.query(Customer).filter(Customer.id == r.target_id).first()
        items.append(RelationResponse(
            id=r.id,
            source_id=r.source_id,
            target_id=r.target_id,
            source_name=source.name if source else None,
            target_name=target.name if target else None,
            relation_type=r.relation_type,
            strength=r.strength,
            created_at=r.created_at,
        ))

    return RelationListResponse(items=items, total=len(items))


@router.post("/", response_model=RelationResponse)
@router.post("", response_model=RelationResponse)
def create_relation(
    data: RelationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if data.source_id == data.target_id:
        raise HTTPException(status_code=400, detail="不能添加自身关系")

    source = db.query(Customer).filter(Customer.id == data.source_id).first()
    target = db.query(Customer).filter(Customer.id == data.target_id).first()
    if not source or not target:
        raise HTTPException(status_code=404, detail="客户不存在")

    existing = db.query(CustomerRelation).filter(
        or_(
            (CustomerRelation.source_id == data.source_id) & (CustomerRelation.target_id == data.target_id),
            (CustomerRelation.source_id == data.target_id) & (CustomerRelation.target_id == data.source_id),
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该关系已存在")

    relation = CustomerRelation(
        source_id=data.source_id,
        target_id=data.target_id,
        relation_type=data.relation_type,
        strength=data.strength,
        created_by=user.id,
    )
    db.add(relation)
    db.commit()
    db.refresh(relation)

    return RelationResponse(
        id=relation.id,
        source_id=relation.source_id,
        target_id=relation.target_id,
        source_name=source.name,
        target_name=target.name,
        relation_type=relation.relation_type,
        strength=relation.strength,
        created_at=relation.created_at,
    )


@router.delete("/{relation_id}")
def delete_relation(
    relation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    relation = db.query(CustomerRelation).filter(CustomerRelation.id == relation_id).first()
    if not relation:
        raise HTTPException(status_code=404, detail="关系不存在")
    db.delete(relation)
    db.commit()
    return {"ok": True}
