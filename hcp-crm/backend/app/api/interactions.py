from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.models.database import get_db, Interaction, HCP
from app.schemas.interaction import (
    InteractionCreate, InteractionUpdate, InteractionResponse,
    HCPCreate, HCPResponse
)
from app.agents.hcp_agent import enrich_interaction_with_llm

router = APIRouter()


# ─── HCP Endpoints ───────────────────────────────────────────────────────────

@router.get("/hcps", response_model=List[HCPResponse])
def search_hcps(q: str = "", db: Session = Depends(get_db)):
    """Search HCPs by name."""
    query = db.query(HCP)
    if q:
        query = query.filter(HCP.name.ilike(f"%{q}%"))
    return query.limit(20).all()


@router.post("/hcps", response_model=HCPResponse)
def create_hcp(hcp: HCPCreate, db: Session = Depends(get_db)):
    """Create a new HCP record."""
    db_hcp = HCP(**hcp.model_dump())
    db.add(db_hcp)
    db.commit()
    db.refresh(db_hcp)
    return db_hcp


# ─── Interaction Endpoints ────────────────────────────────────────────────────

@router.post("/interactions", response_model=InteractionResponse)
async def create_interaction(
    interaction: InteractionCreate,
    db: Session = Depends(get_db)
):
    """Log a new HCP interaction with LLM enrichment."""
    # Verify HCP exists
    hcp = db.query(HCP).filter(HCP.id == interaction.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    # Enrich with LLM
    enrichment = await enrich_interaction_with_llm({
        "hcp_name": hcp.name,
        "interaction_type": interaction.interaction_type,
        "topics_discussed": interaction.topics_discussed or "",
        "outcomes": interaction.outcomes or "",
    })

    db_interaction = Interaction(
        hcp_id=interaction.hcp_id,
        rep_id="rep_001",
        interaction_type=interaction.interaction_type,
        interaction_date=interaction.interaction_date,
        interaction_time=interaction.interaction_time,
        attendees=interaction.attendees,
        topics_discussed=interaction.topics_discussed,
        ai_summary=enrichment.get("summary", ""),
        materials_shared=interaction.materials_shared or [],
        samples_distributed=interaction.samples_distributed or [],
        sentiment=enrichment.get("sentiment", "neutral"),
        sentiment_score=enrichment.get("sentiment_score", 0.5),
        outcomes=interaction.outcomes,
        follow_up_actions=interaction.follow_up_actions,
        ai_suggested_followups=enrichment.get("suggested_followups", []),
        raw_chat_input=interaction.raw_chat_input,
    )

    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


@router.get("/interactions/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Get a single interaction by ID."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.put("/interactions/{interaction_id}", response_model=InteractionResponse)
async def update_interaction(
    interaction_id: int,
    updates: InteractionUpdate,
    db: Session = Depends(get_db),
):
    """Edit an existing interaction with optional LLM re-enrichment."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    update_data = updates.model_dump(exclude_unset=True)
    
    # Re-enrich if topics or outcomes changed
    needs_re_enrichment = "topics_discussed" in update_data or "outcomes" in update_data
    
    for key, value in update_data.items():
        setattr(interaction, key, value)

    if needs_re_enrichment:
        hcp = db.query(HCP).filter(HCP.id == interaction.hcp_id).first()
        enrichment = await enrich_interaction_with_llm({
            "hcp_name": hcp.name if hcp else "Unknown",
            "interaction_type": interaction.interaction_type,
            "topics_discussed": interaction.topics_discussed or "",
            "outcomes": interaction.outcomes or "",
        })
        interaction.ai_summary = enrichment.get("summary", interaction.ai_summary)
        interaction.sentiment = enrichment.get("sentiment", interaction.sentiment)
        interaction.sentiment_score = enrichment.get("sentiment_score", interaction.sentiment_score)
        interaction.ai_suggested_followups = enrichment.get(
            "suggested_followups", interaction.ai_suggested_followups
        )

    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)
    return interaction


@router.get("/interactions/hcp/{hcp_id}", response_model=List[InteractionResponse])
def get_hcp_interactions(hcp_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get all interactions for a specific HCP."""
    return (
        db.query(Interaction)
        .filter(Interaction.hcp_id == hcp_id)
        .order_by(Interaction.interaction_date.desc())
        .limit(limit)
        .all()
    )


@router.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Delete an interaction."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Interaction deleted successfully"}
