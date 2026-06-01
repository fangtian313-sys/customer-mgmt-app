from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Team, TeamMember, User


def create_team(db: Session, name: str, description: Optional[str], owner: User) -> Team:
    team = Team(name=name, description=description, owner_id=owner.id)
    db.add(team)
    db.flush()

    membership = TeamMember(team_id=team.id, user_id=owner.id, role="owner")
    db.add(membership)
    db.commit()
    db.refresh(team)
    return team


def get_user_teams(db: Session, user_id: int) -> List[Team]:
    return (
        db.query(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .filter(TeamMember.user_id == user_id)
        .all()
    )


def get_team(db: Session, team_id: int) -> Optional[Team]:
    return db.query(Team).filter(Team.id == team_id).first()


def get_team_members(db: Session, team_id: int) -> List[TeamMember]:
    return (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id)
        .all()
    )


def add_member(db: Session, team_id: int, user_id: int, role: str = "viewer") -> Optional[TeamMember]:
    existing = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        .first()
    )
    if existing:
        return existing

    membership = TeamMember(team_id=team_id, user_id=user_id, role=role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def update_member_role(db: Session, team_id: int, user_id: int, new_role: str) -> Optional[TeamMember]:
    membership = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        .first()
    )
    if membership is None:
        return None

    membership.role = new_role
    db.commit()
    db.refresh(membership)
    return membership


def remove_member(db: Session, team_id: int, user_id: int) -> bool:
    membership = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        .first()
    )
    if membership is None:
        return False

    if membership.role == "owner":
        return False

    db.delete(membership)
    db.commit()
    return True


def is_team_member(db: Session, team_id: int, user_id: int) -> Optional[TeamMember]:
    return (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        .first()
    )


def check_permission(db: Session, team_id: int, user_id: int, min_role: str = "viewer") -> bool:
    role_priority = {"viewer": 0, "editor": 1, "owner": 2}
    min_level = role_priority.get(min_role, 0)

    membership = is_team_member(db, team_id, user_id)
    if membership is None:
        return False

    return role_priority.get(membership.role, 0) >= min_level
