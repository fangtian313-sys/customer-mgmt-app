from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TeamMember
from app.security import decode_access_token
from typing import Optional

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录或登录已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="令牌无效")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
    return user


def require_team_member(team_id: int, min_role: str = "viewer"):
    def _check(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> TeamMember:
        role_priority = {"viewer": 0, "editor": 1, "owner": 2}
        min_level = role_priority.get(min_role, 0)

        membership = (
            db.query(TeamMember)
            .filter(TeamMember.team_id == team_id, TeamMember.user_id == user.id)
            .first()
        )
        if membership is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="不是团队成员")

        if role_priority.get(membership.role, 0) < min_level:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")

        return membership

    return _check


def require_customer_access(customer_id: int, min_role: str = "viewer"):
    def _check(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> bool:
        from app.models import Customer

        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if customer is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客户不存在")

        if customer.owner_id == user.id:
            return True

        if customer.team_id:
            membership = (
                db.query(TeamMember)
                .filter(TeamMember.team_id == customer.team_id, TeamMember.user_id == user.id)
                .first()
            )
            if membership is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问")

            role_priority = {"viewer": 0, "editor": 1, "owner": 2}
            if role_priority.get(membership.role, 0) < role_priority.get(min_role, 0):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
            return True

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问")

    return _check
