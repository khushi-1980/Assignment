"""
Tool 3: Get HCP History
Retrieves full interaction history for a given HCP.
"""
from langchain_core.tools import tool
from typing import Optional


@tool
def get_hcp_history(
    hcp_id: Optional[int] = None,
    hcp_name: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """
    Retrieve the full interaction history for a specific HCP.

    This tool:
    1. Looks up the HCP by ID or name
    2. Returns a timeline of past interactions with summaries
    3. Includes sentiment trends, shared materials, and outstanding follow-ups

    Args:
        hcp_id: Database ID of the HCP (preferred)
        hcp_name: Name of the HCP (used if ID not provided)
        limit: Maximum number of interactions to return (default 10)

    Returns:
        dict: HCP profile + interaction history with sentiment trend
    """
    if not hcp_id and not hcp_name:
        return {
            "tool": "get_hcp_history",
            "status": "error",
            "message": "Either hcp_id or hcp_name must be provided.",
        }

    return {
        "tool": "get_hcp_history",
        "status": "query_ready",
        "query_params": {
            "hcp_id": hcp_id,
            "hcp_name": hcp_name,
            "limit": limit,
            "include_fields": [
                "interaction_type",
                "interaction_date",
                "ai_summary",
                "sentiment",
                "materials_shared",
                "samples_distributed",
                "ai_suggested_followups",
                "outcomes",
            ],
        },
        "compute_sentiment_trend": True,
    }


"""
Tool 4: Suggest Follow-up
Analyzes current interaction + HCP history to generate actionable follow-up recommendations.
"""


@tool
def suggest_followup(
    interaction_id: Optional[int] = None,
    topics_discussed: Optional[str] = None,
    outcomes: Optional[str] = None,
    hcp_specialty: Optional[str] = None,
    products_mentioned: Optional[str] = None,
    last_interaction_summary: Optional[str] = None,
) -> dict:
    """
    Generate intelligent follow-up action suggestions based on the interaction context.

    This tool uses llama-3.3-70b-versatile (via Groq) to analyze:
    - Topics discussed and outcomes of the current interaction
    - HCP specialty and typical engagement patterns
    - Products or studies mentioned
    - Previous interaction context

    It returns 3–5 concrete, actionable follow-up recommendations.

    Args:
        interaction_id: ID of the current interaction (if already logged)
        topics_discussed: What was discussed in the interaction
        outcomes: Outcomes or agreements from the interaction
        hcp_specialty: Medical specialty of the HCP (e.g., Oncology)
        products_mentioned: Comma-separated products or drugs discussed
        last_interaction_summary: Summary of the previous interaction (for context continuity)

    Returns:
        dict: List of suggested follow-up actions with priorities and timelines
    """
    context = {
        "topics_discussed": topics_discussed or "",
        "outcomes": outcomes or "",
        "hcp_specialty": hcp_specialty or "",
        "products_mentioned": products_mentioned or "",
        "last_interaction_summary": last_interaction_summary or "",
    }

    # Build the LLM prompt for follow-up suggestion
    prompt = f"""You are an expert life science CRM assistant for field medical representatives.
    
Based on the following HCP interaction context, generate 3–5 specific, actionable follow-up recommendations.
Each recommendation should include:
- The action to take
- A suggested timeline (e.g., "within 2 days", "next week", "in 30 days")  
- The business rationale

Interaction Context:
- Topics Discussed: {context['topics_discussed']}
- Outcomes/Agreements: {context['outcomes']}
- HCP Specialty: {context['hcp_specialty']}
- Products Mentioned: {context['products_mentioned']}
- Previous Interaction: {context['last_interaction_summary']}

Return follow-ups as a JSON array of objects with keys: action, timeline, rationale."""

    return {
        "tool": "suggest_followup",
        "status": "llm_prompt_ready",
        "interaction_id": interaction_id,
        "llm_model": "llama-3.3-70b-versatile",
        "prompt": prompt,
        "context": context,
    }


"""
Tool 5: Analyze Sentiment
Runs NLP sentiment analysis on interaction text fields.
"""


@tool
def analyze_sentiment(
    topics_discussed: str,
    outcomes: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
) -> dict:
    """
    Analyze the sentiment and emotional tone of an HCP interaction.

    This tool uses the Groq LLM (gemma2-9b-it) to:
    1. Classify overall sentiment: Positive / Neutral / Negative
    2. Detect objection patterns (pricing, competitor mentions, skepticism)
    3. Identify positive signals (interest, agreement, enthusiasm)
    4. Return a confidence score (0.0 – 1.0)
    5. Provide a brief sentiment rationale for the rep

    Args:
        topics_discussed: The main discussion content from the interaction
        outcomes: Outcomes or agreements from the meeting
        follow_up_actions: Planned follow-up actions (signals engagement level)

    Returns:
        dict: Sentiment classification, score, signals, and objection flags
    """
    combined_text = " ".join(filter(None, [
        topics_discussed,
        outcomes or "",
        follow_up_actions or "",
    ]))

    prompt = f"""You are a sentiment analysis expert for pharmaceutical sales interactions.

Analyze the following HCP interaction text and return a JSON response with:
- sentiment: "positive", "neutral", or "negative"
- confidence: float between 0.0 and 1.0
- positive_signals: list of positive phrases/indicators found
- objections_detected: list of any concerns, objections, or negative indicators
- rationale: one-sentence explanation of the sentiment classification

Interaction Text:
"{combined_text}"

Return ONLY a valid JSON object, no explanation."""

    return {
        "tool": "analyze_sentiment",
        "status": "llm_prompt_ready",
        "llm_model": "gemma2-9b-it",
        "prompt": prompt,
        "text_analyzed": combined_text[:500],  # Truncate for response
    }
