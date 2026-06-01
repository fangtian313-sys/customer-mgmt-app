import secrets
import string
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.config import get_settings

settings = get_settings()


def generate_sms_code() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=settings.JWT_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        if sub and sub.isdigit():
            payload["sub"] = int(sub)
        return payload
    except JWTError:
        return None


def generate_invite_code() -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(8))
