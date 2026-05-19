"""
LangGraph HCP Interaction Agent
Orchestrates the 5 tools using a ReAct-style agent graph.
"""
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import TypedDict, Annotated, Sequence
import operator
import json

from app.tools.log_interaction import log_interaction
from app.tools.edit_interaction import edit_interaction
from app.tools.hcp_tools import get_hcp_history, suggest_followup, analyze_sentiment
from app.config import settings


# ─── Agent State ────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[Sequence[dict], operator.add]
    current_tool_result: dict
    interaction_data: dict
    hcp_context: dict


# ─── LLM Setup ──────────────────────────────────────────────────────────────

def get_llm(model: str = "gemma2-9b-it"):
    """Return a ChatGroq LLM instance."""
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=model,
        temperature=0.1,
        max_tokens=1024,
    )


TOOLS = [
    log_interaction,
    edit_interaction,
    get_hcp_history,
    suggest_followup,
    analyze_sentiment,
]

SYSTEM_PROMPT = """You are an AI assistant for pharmaceutical field representatives, embedded in an HCP CRM system.

You help reps log interactions with Healthcare Professionals (HCPs), edit existing logs, retrieve interaction history, suggest follow-ups, and analyze sentiment.

Available tools:
1. log_interaction — Log a new HCP interaction (meeting, call, email, etc.)
2. edit_interaction — Edit/update an existing interaction by ID
3. get_hcp_history — Retrieve past interactions for an HCP
4. suggest_followup — Generate intelligent follow-up action recommendations
5. analyze_sentiment — Analyze the sentiment and detect objection patterns

Guidelines:
- Always extract HCP name, interaction type, date, and topics from the user message before logging
- If a date is not mentioned, assume today's date
- Be concise and professional in your responses
- When logging an interaction, always also run analyze_sentiment and suggest_followup
- Format suggested follow-ups as a bullet list
- If information is missing, ask for clarification before logging

You represent a life science company. Be precise, compliant, and helpful."""


# ─── Agent Node ─────────────────────────────────────────────────────────────

def should_continue(state: AgentState) -> str:
    """Decide whether to call a tool or end."""
    messages = state["messages"]
    last_message = messages[-1]
    
    # If the last message has tool_calls, route to tools
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


def call_model(state: AgentState) -> dict:
    """Call the LLM with the current state."""
    llm = get_llm("gemma2-9b-it")
    llm_with_tools = llm.bind_tools(TOOLS)
    
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    
    return {"messages": [response]}


# ─── Build Graph ─────────────────────────────────────────────────────────────

def build_hcp_agent():
    """Construct and compile the LangGraph agent."""
    tool_node = ToolNode(TOOLS)
    
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", tool_node)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {"tools": "tools", END: END},
    )
    
    # After tools, always return to agent
    workflow.add_edge("tools", "agent")
    
    return workflow.compile()


# ─── Enrichment Helpers (called after tool results) ─────────────────────────

async def enrich_interaction_with_llm(interaction_data: dict) -> dict:
    """
    Use the LLM to enrich raw interaction data with:
    - AI summary of topics discussed
    - Sentiment classification
    - Suggested follow-up actions
    """
    llm = get_llm("gemma2-9b-it")
    
    topics = interaction_data.get("topics_discussed", "")
    outcomes = interaction_data.get("outcomes", "")
    
    enrichment_prompt = f"""Analyze this HCP interaction and return a JSON object with exactly these keys:
- "summary": A 2-3 sentence professional summary of the interaction
- "sentiment": one of "positive", "neutral", "negative"
- "sentiment_score": float 0.0-1.0 (confidence)
- "suggested_followups": array of 3 specific follow-up action strings

Topics Discussed: {topics}
Outcomes: {outcomes}
HCP: {interaction_data.get('hcp_name', 'Unknown')}
Type: {interaction_data.get('interaction_type', 'Meeting')}

Return ONLY valid JSON, no markdown, no explanation."""

    try:
        response = await llm.ainvoke([HumanMessage(content=enrichment_prompt)])
        raw = response.content.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        enriched = json.loads(raw.strip())
        return enriched
    except Exception as e:
        return {
            "summary": f"Interaction logged with {interaction_data.get('hcp_name', 'HCP')}.",
            "sentiment": "neutral",
            "sentiment_score": 0.5,
            "suggested_followups": [
                "Schedule a follow-up meeting",
                "Send product literature",
                "Update CRM notes",
            ],
        }


# ─── Main Agent Runner ───────────────────────────────────────────────────────

async def run_hcp_agent(user_message: str, conversation_history: list = None) -> dict:
    """
    Run the HCP agent with a user message.
    
    Args:
        user_message: Natural language input from the rep
        conversation_history: Previous messages in the conversation
    
    Returns:
        dict: Agent response with reply text and any tool results
    """
    agent = build_hcp_agent()
    
    messages = []
    if conversation_history:
        for msg in conversation_history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    
    messages.append(HumanMessage(content=user_message))
    
    initial_state = {
        "messages": messages,
        "current_tool_result": {},
        "interaction_data": {},
        "hcp_context": {},
    }
    
    result = await agent.ainvoke(initial_state)
    
    # Extract the final assistant message
    final_messages = result["messages"]
    final_reply = ""
    tool_results = []
    
    for msg in reversed(final_messages):
        if hasattr(msg, "content") and isinstance(msg.content, str) and msg.content:
            final_reply = msg.content
            break
    
    # Collect any tool results
    for msg in final_messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                tool_results.append({
                    "tool_name": tc.get("name"),
                    "args": tc.get("args", {}),
                })
    
    return {
        "reply": final_reply,
        "tool_results": tool_results,
        "messages": [
            {"role": "assistant" if hasattr(m, "tool_calls") or isinstance(m, AIMessage) else "user",
             "content": m.content if hasattr(m, "content") else ""}
            for m in final_messages
        ],
    }
