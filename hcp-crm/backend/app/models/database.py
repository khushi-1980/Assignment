from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON, Float
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from sqlalchemy import create_engine
from datetime import datetime
import enum
from app.config import settings

Base = declarative_base()


class SentimentEnum(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(100))
    institution = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    territory = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="hcp")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False)
    rep_id = Column(String(100), nullable=False, default="rep_001")  # auth user in prod
    interaction_type = Column(String(50), default="Meeting")
    interaction_date = Column(DateTime, nullable=False)
    interaction_time = Column(String(10))
    attendees = Column(Text)
    topics_discussed = Column(Text)
    ai_summary = Column(Text)
    materials_shared = Column(JSON, default=list)
    samples_distributed = Column(JSON, default=list)
    sentiment = Column(Enum(SentimentEnum), default=SentimentEnum.neutral)
    sentiment_score = Column(Float)
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    ai_suggested_followups = Column(JSON, default=list)
    raw_chat_input = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")


engine = create_engine(settings.DATABASE_URL)


def get_db():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
