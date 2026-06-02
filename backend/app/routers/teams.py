from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, Team, TeamMember
from app.schemas import (
    TeamCreate, TeamResponse, TeamDetail, TeamMemberResponse,
)
from app.dependencies import get_current_user
from app.services import team_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/", response_model=TeamResponse)
@router.post("", response_model=TeamResponse)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    team = team_service.create_team(db, data.name, data.description, user)
    return TeamResponse.model_validate(team)


@router.get("/", response_model=list[TeamResponse])
@router.get("", response_model=list[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    teams = team_service.get_user_teams(db, user.id)
    return [TeamResponse.model_validate(t) for t in teams]


@router.get("/{team_id}", response_model=TeamDetail)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not team_service.check_permission(db, team_id, user.id, "viewer"):
        raise HTTPException(status_code=403, detail="无权访问")

    team = team_service.get_team(db, team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="团队不存在")

    member_count = len(team_service.get_team_members(db, team_id))
    detail = TeamDetail.model_validate(team)
    detail.member_count = member_count
    return detail


@router.get("/{team_id}/members/", response_model=list[TeamMemberResponse])
@router.get("/{team_id}/members", response_model=list[TeamMemberResponse])
def list_members(
    team_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not team_service.check_permission(db, team_id, user.id, "viewer"):
        raise HTTPException(status_code=403, detail="无权访问")

    members = team_service.get_team_members(db, team_id)
    result = []
    for m in members:
        resp = TeamMemberResponse.model_validate(m)
        resp.user_name = m.user.name
        resp.user_phone = m.user.phone[:3] + "****" + m.user.phone[-4:] if m.user.phone else None
        result.append(resp)
    return result


@router.put("/{team_id}/members/{user_id}", response_model=TeamMemberResponse)
def update_member_role(
    team_id: int,
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not team_service.check_permission(db, team_id, user.id, "owner"):
        raise HTTPException(status_code=403, detail="只有团队拥有者可以修改角色")

    new_role = data.get("role", "viewer")
    if new_role == "owner":
        raise HTTPException(status_code=400, detail="无法通过此接口转移拥有者权限")

    membership = team_service.update_member_role(db, team_id, user_id, new_role)
    if membership is None:
        raise HTTPException(status_code=404, detail="成员不存在")

    resp = TeamMemberResponse.model_validate(membership)
    resp.user_name = membership.user.name
    resp.user_phone = membership.user.phone[:3] + "****" + membership.user.phone[-4:] if membership.user.phone else None
    return resp


@router.delete("/{team_id}/members/{user_id}")
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    is_owner = team_service.check_permission(db, team_id, user.id, "owner")
    is_self = user_id == user.id

    if not is_owner and not is_self:
        raise HTTPException(status_code=403, detail="只有团队拥有者或本人可以移除成员")

    success = team_service.remove_member(db, team_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="成员不存在或无法移除拥有者")

    return {"message": "成员已移除"}
