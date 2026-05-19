from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class SentimentEnum(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    institution: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None


class HCPCreate(HCPBase):
    pass


class HCPResponse(HCPBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InteractionCreate(BaseModel):
    hcp_id: int
    interaction_type: str = "Meeting"
    interaction_date: datetime
    interaction_time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[Any]] = []
    samples_distributed: Optional[List[Any]] = []
    sentiment: Optional[SentimentEnum] = SentimentEnum.neutral
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    raw_chat_input: Optional[str] = None


class InteractionUpdate(BaseModel):
    interaction_type: Optional[str] = None
    interaction_date: Optional[datetime] = None
    interaction_time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[Any]] = None
    samples_distributed: Optional[List[Any]] = None
    sentiment: Optional[SentimentEnum] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class InteractionResponse(BaseModel):
    id: int
    hcp_id: int
    rep_id: str
    interaction_type: str
    interaction_date: datetime
    interaction_time: Optional[str]
    attendees: Optional[str]
    topics_discussed: Optional[str]
    ai_summary: Optional[str]
    materials_shared: Optional[List[Any]]
    samples_distributed: Optional[List[Any]]
    sentiment: Optional[str]
    sentiment_score: Optional[float]
    outcomes: Optional[str]
    follow_up_actions: Optional[str]
    ai_suggested_followups: Optional[List[Any]]
    raw_chat_input: Optional[str]
    created_at: datetime
    updated_at: datetime
    hcp: Optional[HCPResponse] = None

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []
    hcp_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    interaction_logged: Optional[InteractionResponse] = None
    suggested_followups: Optional[List[str]] = []
    action_taken: Optional[str] = None
