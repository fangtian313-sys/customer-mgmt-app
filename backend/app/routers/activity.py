from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, ActivityLog
from app.schemas import ActivityResponse, ActivityListResponse
from app.dependencies import get_current_user
from app.services import team_service

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/", response_model=ActivityListResponse)
@router.get("", response_model=ActivityListResponse)
def list_activity(
    team_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(ActivityLog)

    if team_id:
        if not team_service.check_permission(db, team_id, user.id, "viewer"):
            raise HTTPException(status_code=403, detail="无权访问")
        query = query.filter(ActivityLog.team_id == team_id)
    elif not entity_id:
        query = query.filter(ActivityLog.user_id == user.id)

    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(ActivityLog.entity_id == entity_id)

    total = query.count()
    logs = query.order_by(ActivityLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for log in logs:
        resp = ActivityResponse.model_validate(log)
        resp.user_name = log.user.name if log.user else None
        items.append(resp)

    return ActivityListResponse(items=items, total=total)
