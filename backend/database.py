"""
This module sets up the SQLAlchemy database engine, session, and base class for model definitions.
It supports two configurations:
  - Testing mode: Uses an in-memory SQLite database for fast, ephemeral tests.
  - Production (or default) mode: Uses a file-based SQLite database (app.db) stored locally.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Determine whether the application is running in testing mode.
# The environment variable "TESTING" is expected to be set to "true" (case-insensitive) for testing.
TESTING = os.environ.get("TESTING", "false").lower() == "true"

if TESTING:
    # In testing mode, use an in-memory SQLite database.
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        # SQLite restricts connections to the same thread by default.
        # For in-memory databases in tests, we disable this check.
        connect_args={"check_same_thread": False},
        # Use a StaticPool to ensure that the same in-memory database is used across connections.
        poolclass=StaticPool
    )
else:
    # In production mode, use a file-based SQLite database.
    SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        # Disable the same thread check to allow multiple threads to use the connection.
        connect_args={"check_same_thread": False}
    )

# Create a session local class. Instances of SessionLocal will be used to interact with the database.
# - autocommit=False: Explicitly commit transactions.
# - autoflush=False: Disable automatic flushing of changes to the database.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for our SQLAlchemy models.
# All models should inherit from this Base.
Base = declarative_base()
