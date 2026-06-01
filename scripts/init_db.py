#!/usr/bin/env python3
"""Database initialization script."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import engine, Base
from app.models import User, Team, TeamMember, Customer, Invitation, ActivityLog, SMSVerification


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()
