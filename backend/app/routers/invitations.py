from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Invitation
from app.schemas import (
    InvitationCreate, InvitationResponse, InvitationInfo, InvitationAcceptResponse, TeamResponse,
)
from app.dependencies import get_current_user
from app.services import team_service
from app.security import generate_invite_code
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("/", response_model=InvitationResponse)
@router.post("", response_model=InvitationResponse)
def create_invitation(
    data: InvitationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not team_service.check_permission(db, data.team_id, user.id, "editor"):
        raise HTTPException(status_code=403, detail="权限不足，无法邀请")

    team = team_service.get_team(db, data.team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="团队不存在")

    code = generate_invite_code()
    expires_at = datetime.utcnow() + timedelta(hours=data.expires_in_hours)

    invitation = Invitation(
        code=code,
        team_id=data.team_id,
        created_by=user.id,
        role=data.role,
        expires_at=expires_at,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    invite_link = f"/invite/{code}"

    response = InvitationResponse.model_validate(invitation)
    response.invite_link = invite_link
    return response


@router.get("/team/{team_id}", response_model=list[InvitationResponse])
def list_team_invitations(
    team_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not team_service.check_permission(db, team_id, user.id, "editor"):
        raise HTTPException(status_code=403, detail="权限不足")

    invitations = (
        db.query(Invitation)
        .filter(Invitation.team_id == team_id)
        .order_by(Invitation.created_at.desc())
        .all()
    )

    result = []
    for inv in invitations:
        resp = InvitationResponse.model_validate(inv)
        resp.invite_link = f"/invite/{inv.code}"
        result.append(resp)
    return result


@router.get("/{code}", response_model=InvitationInfo)
def get_invitation_info(
    code: str,
    db: Session = Depends(get_db),
):
    invitation = (
        db.query(Invitation)
        .filter(Invitation.code == code)
        .first()
    )

    if invitation is None:
        raise HTTPException(status_code=404, detail="邀请不存在")

    if invitation.status == "used":
        raise HTTPException(status_code=400, detail="邀请已被使用")

    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="邀请已过期")

    team = team_service.get_team(db, invitation.team_id)
    inviter = db.query(User).filter(User.id == invitation.created_by).first()

    return InvitationInfo(
        team_name=team.name,
        role=invitation.role,
        inviter_name=inviter.name if inviter else None,
    )


@router.post("/{code}/accept", response_model=InvitationAcceptResponse)
def accept_invitation(
    code: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    invitation = (
        db.query(Invitation)
        .filter(Invitation.code == code)
        .first()
    )

    if invitation is None:
        raise HTTPException(status_code=404, detail="邀请不存在")

    if invitation.status == "used":
        raise HTTPException(status_code=400, detail="邀请已被使用")

    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="邀请已过期")

    existing = team_service.is_team_member(db, invitation.team_id, user.id)
    if existing:
        team = team_service.get_team(db, invitation.team_id)
        return InvitationAcceptResponse(
            message="已经是团队成员",
            team=TeamResponse.model_validate(team),
        )

    team_service.add_member(db, invitation.team_id, user.id, invitation.role)

    invitation.used_by = user.id
    invitation.used_at = datetime.utcnow()
    invitation.status = "used"
    db.commit()

    team = team_service.get_team(db, invitation.team_id)
    return InvitationAcceptResponse(
        message="成功加入团队",
        team=TeamResponse.model_validate(team),
    )


@router.delete("/{invitation_id}")
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if invitation is None:
        raise HTTPException(status_code=404, detail="邀请不存在")

    if not team_service.check_permission(db, invitation.team_id, user.id, "editor"):
        raise HTTPException(status_code=403, detail="权限不足")

    invitation.status = "expired"
    db.commit()

    return {"message": "邀请已撤销"}
