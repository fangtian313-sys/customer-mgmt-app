from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.database import get_db
from app.models import User
from app.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    CustomerListResponse, SearchSuggestionResponse, TagStatsResponse,
)
from app.dependencies import get_current_user
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/", response_model=CustomerListResponse)
@router.get("", response_model=CustomerListResponse)
def list_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tag: Optional[str] = None,
    team_id: Optional[int] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customers, total = customer_service.list_customers(
        db, user, page, per_page, search, tag, team_id, sort_by, sort_order
    )
    return CustomerListResponse(
        items=[CustomerResponse.model_validate(c) for c in customers],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/", response_model=CustomerResponse)
@router.post("", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customer, duplicate = customer_service.create_customer(db, data, user)

    response = CustomerResponse.model_validate(customer)
    if duplicate:
        response.notes = (response.notes or "") + f"\n[Warning: Possible duplicate of customer #{duplicate.id}]"
    return response


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customer = customer_service.get_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="客户不存在")
    return CustomerResponse.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customer, duplicate = customer_service.update_customer(db, customer_id, data, user)
    if customer is None:
        raise HTTPException(status_code=404, detail="客户不存在")
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    success = customer_service.delete_customer(db, customer_id, user)
    if not success:
        raise HTTPException(status_code=404, detail="客户不存在")
    return {"message": "客户删除成功"}


@router.get("/search/suggest", response_model=SearchSuggestionResponse)
def search_suggestions(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    suggestions = customer_service.get_search_suggestions(db, q)
    return SearchSuggestionResponse(suggestions=suggestions)


@router.get("/tags", response_model=TagStatsResponse)
def get_tags(
    team_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tags, counts = customer_service.get_tags(db, team_id)
    return TagStatsResponse(tags=tags, counts=counts)
