#!/usr/bin/env python3
"""Initialize the database by creating all tables."""
from app.database import engine, Base
from app import models

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database initialized successfully!")
