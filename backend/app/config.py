from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import os

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'customer_mgmt.db'}"
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Resolve relative SQLite paths to absolute
        if self.DATABASE_URL.startswith("sqlite:///") and not self.DATABASE_URL.startswith("sqlite:////"):
            rel_path = self.DATABASE_URL.replace("sqlite:///", "")
            if not os.path.isabs(rel_path):
                abs_path = (BACKEND_DIR / rel_path).resolve()
                self.DATABASE_URL = f"sqlite:///{abs_path}"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
