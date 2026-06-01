from pydantic import BaseModel, EmailStr, Field, validator, model_validator
from typing import Optional, List
from datetime import datetime
import json


# ========== User Schemas ==========

class UserBase(BaseModel):
    phone: str = Field(..., min_length=7, max_length=20)
    name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


# ========== Auth Schemas ==========

class SMSRequest(BaseModel):
    phone: str = Field(..., min_length=7, max_length=20)


class SMSVerify(BaseModel):
    phone: str = Field(..., min_length=7, max_length=20)
    code: str = Field(..., min_length=6, max_length=6)


class TokenResponse(BaseModel):
    token: str
    user: UserResponse
    is_new_user: bool


# ========== Team Schemas ==========

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TeamDetail(TeamResponse):
    member_count: int = 0


class TeamMemberBase(BaseModel):
    role: str = Field(..., pattern="^(owner|editor|viewer)$")


class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


# ========== Customer Schemas ==========

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=200)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    team_id: Optional[int] = None

    @validator("email")
    def validate_email(cls, v):
        if v and "@" not in v:
            raise ValueError("邮箱格式不正确")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=200)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    team_id: Optional[int] = None
    last_contacted: Optional[datetime] = None


class CustomerResponse(CustomerBase):
    id: int
    owner_id: int
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_contacted: Optional[datetime] = None

    @validator("tags", pre=True)
    def parse_tags(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v

    @model_validator(mode="before")
    @classmethod
    def populate_owner_name(cls, data):
        if not isinstance(data, dict) and hasattr(data, "owner"):
            try:
                owner = data.owner
                if owner is not None:
                    return {
                        "id": data.id, "name": data.name, "company": data.company,
                        "phone": data.phone, "email": data.email, "tags": data.tags,
                        "notes": data.notes, "address": data.address, "website": data.website,
                        "team_id": data.team_id, "owner_id": data.owner_id,
                        "owner_name": owner.name,
                        "created_at": data.created_at, "updated_at": data.updated_at,
                        "last_contacted": data.last_contacted,
                    }
            except Exception:
                pass
        return data

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    per_page: int


class SearchSuggestionResponse(BaseModel):
    suggestions: List[str]


class TagStatsResponse(BaseModel):
    tags: List[str]
    counts: dict = {}


# ========== Customer Relation Schemas ==========

class RelationCreate(BaseModel):
    source_id: int
    target_id: int
    relation_type: str = Field(..., min_length=1, max_length=50)
    strength: int = Field(3, ge=1, le=5)


class RelationResponse(BaseModel):
    id: int
    source_id: int
    target_id: int
    source_name: Optional[str] = None
    target_name: Optional[str] = None
    relation_type: str
    strength: int
    created_at: datetime

    class Config:
        from_attributes = True


class RelationListResponse(BaseModel):
    items: List[RelationResponse]
    total: int


# ========== Invitation Schemas ==========

class InvitationCreate(BaseModel):
    team_id: int
    role: str = Field("viewer", pattern="^(editor|viewer)$")
    expires_in_hours: int = Field(168, ge=1, le=720)  # default 7 days


class InvitationResponse(BaseModel):
    id: int
    code: str
    team_id: int
    role: str
    expires_at: datetime
    status: str
    created_at: datetime
    invite_link: Optional[str] = None

    class Config:
        from_attributes = True


class InvitationInfo(BaseModel):
    team_name: str
    role: str
    inviter_name: Optional[str] = None


class InvitationAcceptResponse(BaseModel):
    message: str
    team: TeamResponse


# ========== Activity Schemas ==========

class ActivityResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    team_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: int
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    items: List[ActivityResponse]
    total: int
