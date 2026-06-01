from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
    # Ensure data directory exists for SQLite
    if "sqlite" in settings.DATABASE_URL:
        import os
        from pathlib import Path
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        if not db_path.startswith("/"):
            db_path = str(Path(__file__).parent.parent / db_path)
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)


# Auto-initialize on import
init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
