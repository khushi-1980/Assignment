# AI-First CRM – HCP Module (Log Interaction Screen)

A full-stack AI-first CRM system for Healthcare Professional (HCP) interaction logging, built for life science field representatives.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Redux Toolkit |
| Backend | Python 3.11 + FastAPI |
| AI Agent | LangGraph |
| LLM | Groq (gemma2-9b-it / llama-3.3-70b-versatile) |
| Database | PostgreSQL |
| Font | Google Inter |

---

## Project Structure

```
hcp-crm/
├── frontend/                 # React + Redux UI
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── LogInteractionForm.jsx    # Structured form view
│   │   │   ├── ChatInterface.jsx         # Conversational AI chat
│   │   │   ├── InteractionList.jsx       # Past interactions
│   │   │   └── Header.jsx
│   │   ├── store/
│   │   │   ├── index.js                  # Redux store
│   │   │   ├── interactionSlice.js       # Interaction state
│   │   │   └── chatSlice.js              # Chat state
│   │   ├── api/
│   │   │   └── apiClient.js              # Axios API client
│   │   └── App.jsx
│   └── package.json
│
├── backend/                  # FastAPI + LangGraph
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── api/
│   │   │   ├── interactions.py   # Interaction CRUD endpoints
│   │   │   └── chat.py           # Chat/AI endpoints
│   │   ├── agents/
│   │   │   └── hcp_agent.py      # LangGraph agent definition
│   │   ├── tools/
│   │   │   ├── log_interaction.py
│   │   │   ├── edit_interaction.py
│   │   │   ├── get_hcp_history.py
│   │   │   ├── suggest_followup.py
│   │   │   └── analyze_sentiment.py
│   │   ├── models/
│   │   │   └── database.py       # SQLAlchemy models
│   │   └── schemas/
│   │       └── interaction.py    # Pydantic schemas
│   ├── requirements.txt
│   └── .env.example
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

### 1. Clone & Configure

```bash
git clone <repo-url>
cd hcp-crm
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
#   GROQ_API_KEY=your_groq_api_key
#   DATABASE_URL=postgresql://user:password@localhost:5432/hcp_crm

# Create database
psql -U postgres -c "CREATE DATABASE hcp_crm;"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

npm install
# Create .env
echo "REACT_APP_API_URL=http://localhost:8000" > .env

npm start
```

App runs at **http://localhost:3000**

---

## LangGraph Agent & Tools

The LangGraph agent acts as an intelligent orchestrator for field representative workflows. It processes both structured form submissions and natural language chat inputs.

### Agent Role
The HCP Interaction Agent manages the full lifecycle of rep–HCP interactions. Given a user message or form payload, it:
1. Determines the intent (log, edit, retrieve, analyze, suggest)
2. Routes to the appropriate tool(s)
3. Uses the Groq LLM (gemma2-9b-it) to enrich data with summarization and entity extraction
4. Returns a structured response back to the frontend

### Tool Definitions

#### 1. `log_interaction` *(Required)*
Captures and persists a new HCP interaction. Accepts raw conversational text OR structured form fields. The LLM:
- Extracts entities: HCP name, date, attendees, products discussed
- Classifies sentiment: Positive / Neutral / Negative
- Generates a concise summary of topics discussed
- Suggests follow-up actions based on context

#### 2. `edit_interaction` *(Required)*
Modifies a previously logged interaction by ID. Accepts a partial update payload. The LLM re-processes updated fields (e.g., re-summarizes if topics changed). Validates that the interaction belongs to the current rep before allowing edits.

#### 3. `get_hcp_history`
Retrieves the full interaction history for a given HCP. Returns a timeline of past meetings, sentiment trends, shared materials, and outstanding follow-ups. Used by the agent to provide context before logging a new interaction.

#### 4. `suggest_followup`
Analyzes the current interaction and prior HCP history to generate intelligent follow-up recommendations (e.g., "Schedule a follow-up call in 2 weeks," "Share Phase III trial data"). Uses llama-3.3-70b-versatile for richer reasoning.

#### 5. `analyze_sentiment`
Runs sentiment analysis on the free-text "Topics Discussed" and "Outcomes" fields. Returns a sentiment label and confidence score. Also detects objection patterns (e.g., pricing concerns, competitor mentions) and flags them for the rep.

---

## Key Features

- **Dual Input Mode**: Toggle between structured form and AI chat interface
- **Voice Note Summarization**: (with consent) transcribes and summarizes voice notes
- **AI-Suggested Follow-ups**: Automatically generated after each interaction log
- **HCP Sentiment Tracking**: Tracks sentiment trend over time per HCP
- **Materials & Samples Tracking**: Log distributed materials and drug samples per interaction
- **Real-time Chat**: Streaming AI responses via Server-Sent Events

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/interactions` | Log new interaction |
| GET | `/api/interactions/{id}` | Get interaction by ID |
| PUT | `/api/interactions/{id}` | Edit interaction |
| GET | `/api/interactions/hcp/{hcp_id}` | Get HCP history |
| POST | `/api/chat/message` | Send chat message to AI agent |
| GET | `/api/hcps` | Search HCPs |

---

## Submission

GitHub Repo: [to be filled after upload]  
Submission Form: https://forms.gle/mkgZPhtkFtnvLJCz7
