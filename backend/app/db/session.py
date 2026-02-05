from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Temporary local SQLite database (no configuration needed)
DATABASE_URL = "sqlite:///./merasaya.db"

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our ORM models
Base = declarative_base()
