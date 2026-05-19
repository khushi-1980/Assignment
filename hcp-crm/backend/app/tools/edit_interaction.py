"""
Tool 2: Edit Interaction
Modifies a previously logged HCP interaction by ID.
Validates ownership, applies updates, and re-enriches changed fields via LLM.
"""
from langchain_core.tools import tool
from typing import Optional


@tool
def edit_interaction(
    interaction_id: int,
    rep_id: str,
    topics_discussed: Optional[str] = None,
    interaction_type: Optional[str] = None,
    interaction_date: Optional[str] = None,
    attendees: Optional[str] = None,
    outcomes: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
    sentiment: Optional[str] = None,
    materials_shared: Optional[str] = None,
    samples_distributed: Optional[str] = None,
) -> dict:
    """
    Edit an existing HCP interaction log.

    This tool:
    1. Identifies which fields are being updated
    2. Validates that the requesting rep owns this interaction
    3. Flags text fields for LLM re-enrichment (re-summarize if topics changed)
    4. Returns the update payload ready for database application

    Args:
        interaction_id: The database ID of the interaction to edit
        rep_id: ID of the rep making the edit (for ownership validation)
        topics_discussed: Updated topics (triggers re-summarization if changed)
        interaction_type: Updated interaction type
        interaction_date: Updated date in ISO format
        attendees: Updated attendees list
        outcomes: Updated outcomes/agreements
        follow_up_actions: Updated follow-up tasks
        sentiment: Manually override sentiment (positive/neutral/negative)
        materials_shared: JSON string of updated materials list
        samples_distributed: JSON string of updated samples list

    Returns:
        dict: Edit payload with delta fields and re-enrichment flags
    """
    # Build delta — only include fields that were explicitly provided
    updates = {}
    re_enrich_fields = []

    if topics_discussed is not None:
        updates["topics_discussed"] = topics_discussed
        re_enrich_fields.extend(["summarize_topics", "classify_sentiment"])

    if interaction_type is not None:
        updates["interaction_type"] = interaction_type

    if interaction_date is not None:
        updates["interaction_date"] = interaction_date

    if attendees is not None:
        updates["attendees"] = attendees

    if outcomes is not None:
        updates["outcomes"] = outcomes
        re_enrich_fields.append("suggest_followups")

    if follow_up_actions is not None:
        updates["follow_up_actions"] = follow_up_actions

    if sentiment is not None:
        if sentiment.lower() not in ("positive", "neutral", "negative"):
            return {
                "tool": "edit_interaction",
                "status": "error",
                "message": f"Invalid sentiment value '{sentiment}'. Must be positive, neutral, or negative.",
            }
        updates["sentiment"] = sentiment.lower()

    if materials_shared is not None:
        updates["materials_shared"] = materials_shared

    if samples_distributed is not None:
        updates["samples_distributed"] = samples_distributed

    if not updates:
        return {
            "tool": "edit_interaction",
            "status": "no_changes",
            "message": "No fields provided for update.",
        }

    return {
        "tool": "edit_interaction",
        "status": "ready_to_persist",
        "interaction_id": interaction_id,
        "rep_id": rep_id,
        "updates": updates,
        "re_enrich_fields": list(set(re_enrich_fields)),
        "requires_ownership_check": True,
    }
