from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserResponse, UserUpdate
from app.security import create_access_token
from app.dependencies import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(tags=["auth"])


class PhoneLogin(BaseModel):
    phone: str = Field(..., min_length=7, max_length=20)
    name: str = Field(None, max_length=100)


@router.post("/auth/login", response_model=TokenResponse)
def phone_login(request: PhoneLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == request.phone).first()
    is_new_user = False

    if user is None:
        user = User(phone=request.phone, name=request.name)
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    elif user.status == "suspended":
        raise HTTPException(status_code=403, detail="账号已被停用")
    else:
        if request.name and not user.name:
            user.name = request.name
            db.commit()

    token = create_access_token(data={"sub": user.id})

    return TokenResponse(
        token=token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user,
    )


@router.get("/auth/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.put("/auth/me", response_model=UserResponse)
def update_me(
    update: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update.name is not None:
        user.name = update.name
    if update.avatar_url is not None:
        user.avatar_url = update.avatar_url
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/auth/logout")
def logout():
    return {"message": "退出登录成功"}
