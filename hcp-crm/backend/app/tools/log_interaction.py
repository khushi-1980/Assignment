"""
Tool 1: Log Interaction
Captures and persists HCP interaction data.
Uses the LLM to summarize, extract entities, and suggest follow-ups.
"""
from langchain_core.tools import tool
from typing import Optional, List
import json


@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    interaction_date: str,
    topics_discussed: str,
    attendees: Optional[str] = None,
    materials_shared: Optional[str] = None,
    samples_distributed: Optional[str] = None,
    outcomes: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
    raw_chat_input: Optional[str] = None,
) -> dict:
    """
    Log a new interaction with an HCP (Healthcare Professional).
    
    This tool:
    1. Validates and structures the interaction data
    2. Prepares it for LLM enrichment (summarization, entity extraction)
    3. Returns a structured payload ready for database persistence
    
    Args:
        hcp_name: Full name of the HCP (e.g., "Dr. Priya Sharma")
        interaction_type: Type of interaction (Meeting, Call, Email, Conference, etc.)
        interaction_date: Date of interaction in ISO format (YYYY-MM-DD)
        topics_discussed: Free-text description of topics covered in the interaction
        attendees: Comma-separated list of attendees besides the rep and HCP
        materials_shared: JSON string of materials shared (brochures, studies, etc.)
        samples_distributed: JSON string of drug samples distributed
        outcomes: Key outcomes or agreements reached during the interaction
        follow_up_actions: Planned follow-up tasks or steps
        raw_chat_input: Original natural language input from the rep (if via chat)
    
    Returns:
        dict: Structured interaction payload with extracted metadata
    """
    # Parse materials/samples if provided as strings
    try:
        materials = json.loads(materials_shared) if materials_shared else []
    except (json.JSONDecodeError, TypeError):
        materials = [materials_shared] if materials_shared else []
    
    try:
        samples = json.loads(samples_distributed) if samples_distributed else []
    except (json.JSONDecodeError, TypeError):
        samples = [samples_distributed] if samples_distributed else []

    # Build structured payload
    interaction_payload = {
        "tool": "log_interaction",
        "status": "ready_to_persist",
        "data": {
            "hcp_name": hcp_name,
            "interaction_type": interaction_type,
            "interaction_date": interaction_date,
            "attendees": attendees or "",
            "topics_discussed": topics_discussed,
            "materials_shared": materials,
            "samples_distributed": samples,
            "outcomes": outcomes or "",
            "follow_up_actions": follow_up_actions or "",
            "raw_chat_input": raw_chat_input or "",
        },
        "llm_enrichment_needed": True,
        "enrichment_tasks": [
            "summarize_topics",
            "extract_entities",
            "classify_sentiment",
            "suggest_followups",
        ],
    }

    return interaction_payload
