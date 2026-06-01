from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100))
    avatar_url = Column(String(500))
    status = Column(String(20), default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owned_teams = relationship("Team", back_populates="owner", foreign_keys="Team.owner_id")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="owner", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="owned_teams", foreign_keys=[owner_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="team", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="team", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (
        Index("idx_team_members_team_user", "team_id", "user_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False, default="viewer")  # owner, editor, viewer
    joined_at = Column(DateTime, server_default=func.now())

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    company = Column(String(200), index=True)
    phone = Column(String(50), index=True)
    email = Column(String(200), index=True)
    tags = Column(Text)  # JSON array stored as text
    notes = Column(Text)
    address = Column(String(500))
    website = Column(String(500))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_contacted = Column(DateTime)

    owner = relationship("User", back_populates="customers")
    team = relationship("Team", back_populates="customers")

    __table_args__ = (
        Index("idx_customers_name", "name"),
        Index("idx_customers_company", "company"),
        Index("idx_customers_team", "team_id"),
        Index("idx_customers_owner", "owner_id"),
    )


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    role = Column(String(20), default="viewer")
    expires_at = Column(DateTime)
    used_by = Column(Integer, ForeignKey("users.id"))
    used_at = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, used, expired
    created_at = Column(DateTime, server_default=func.now())

    team = relationship("Team", back_populates="invitations")
    creator = relationship("User", foreign_keys=[created_by])
    user = relationship("User", foreign_keys=[used_by])


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), index=True)
    action = Column(String(50), nullable=False)  # created, updated, deleted, shared
    entity_type = Column(String(50), nullable=False)  # customer, team, invitation
    entity_id = Column(Integer)
    details = Column(Text)  # JSON
    ip_address = Column(String(45))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activity_logs")
    team = relationship("Team", back_populates="activity_logs")

    __table_args__ = (
        Index("idx_activity_team", "team_id"),
        Index("idx_activity_entity", "entity_type", "entity_id"),
    )


class CustomerRelation(Base):
    __tablename__ = "customer_relations"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    relation_type = Column(String(50), nullable=False)
    strength = Column(Integer, default=3)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    source = relationship("Customer", foreign_keys=[source_id])
    target = relationship("Customer", foreign_keys=[target_id])

    __table_args__ = (
        Index("idx_relation_source_target", "source_id", "target_id", unique=True),
    )


class SMSVerification(Base):
    __tablename__ = "sms_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_sms_phone", "phone"),
    )
