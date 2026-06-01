from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BACKEND_DIR / "customer_mgmt.db"


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_EXPIRE_HOURS: int = 72
    SMS_PROVIDER: str = "mock"
    ALIYUN_ACCESS_KEY_ID: str = ""
    ALIYUN_ACCESS_KEY_SECRET: str = ""
    ALIYUN_SMS_SIGN_NAME: str = ""
    ALIYUN_SMS_TEMPLATE_CODE: str = ""
    APP_NAME: str = "客户管理系统"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
