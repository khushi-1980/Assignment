from fastapi import APIRouter
from app.schemas.interaction import ChatMessage, ChatResponse
from app.agents.hcp_agent import run_hcp_agent

router = APIRouter()


@router.post("/chat/message", response_model=ChatResponse)
async def chat_with_agent(message: ChatMessage):
    """
    Send a natural language message to the HCP LangGraph agent.
    The agent will determine intent and call the appropriate tool(s).
    
    Example inputs:
    - "Log a meeting with Dr. Sharma today. We discussed Product X efficacy."
    - "Edit interaction 5 — the sentiment should be positive"
    - "What's the history with Dr. Patel?"
    - "Suggest follow-ups for my last meeting with Dr. Chen"
    """
    result = await run_hcp_agent(
        user_message=message.message,
        conversation_history=message.conversation_history,
    )

    # Extract tool actions taken
    action_taken = None
    if result.get("tool_results"):
        tool_names = [t["tool_name"] for t in result["tool_results"] if t.get("tool_name")]
        if tool_names:
            action_taken = ", ".join(tool_names)

    return ChatResponse(
        reply=result.get("reply", "I processed your request."),
        action_taken=action_taken,
    )
