import React from 'react';
import { Provider } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import store from './store';
import Header from './components/Header';
import LogInteractionForm from './components/LogInteractionForm';
import ChatInterface from './components/ChatInterface';
import InteractionList from './components/InteractionList';
import { setActiveView } from './store/interactionSlice';
import { MessageSquare, ClipboardList, History, Sparkles } from 'lucide-react';
import './styles/global.css';

function AppContent() {
  const dispatch = useDispatch();
  const { activeView, hcpHistory } = useSelector((s) => s.interactions);

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {/* ── Page Title ── */}
        <div className="page-title-bar">
          <div>
            <h1 className="page-title">Log HCP Interaction</h1>
            <p className="page-subtitle">
              Capture field interactions with AI-powered enrichment
            </p>
          </div>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${activeView === 'form' ? 'mode-btn-active' : ''}`}
              onClick={() => dispatch(setActiveView('form'))}
            >
              <ClipboardList size={15} />
              Structured Form
            </button>
            <button
              className={`mode-btn ${activeView === 'chat' ? 'mode-btn-active' : ''}`}
              onClick={() => dispatch(setActiveView('chat'))}
            >
              <MessageSquare size={15} />
              AI Chat
            </button>
          </div>
        </div>

        {/* ── Layout ── */}
        <div className="content-layout">
          {/* Left: Form or Chat */}
          <div className="left-panel">
            <div className="panel-card">
              <div className="panel-card-header">
                <div className="panel-card-title">
                  {activeView === 'form' ? (
                    <>
                      <ClipboardList size={16} />
                      Interaction Details
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      AI Assistant
                    </>
                  )}
                </div>
              </div>
              <div className="panel-card-body">
                {activeView === 'form' ? <LogInteractionForm /> : <ChatInterface />}
              </div>
            </div>
          </div>

          {/* Right: History Panel */}
          <div className="right-panel">
            <div className="panel-card panel-card-secondary">
              <div className="panel-card-header">
                <div className="panel-card-title">
                  <History size={16} />
                  Recent Interactions
                  {hcpHistory.length > 0 && (
                    <span className="count-badge">{hcpHistory.length}</span>
                  )}
                </div>
              </div>
              <div className="panel-card-body">
                <InteractionList />
              </div>
            </div>

            {/* AI Info Card */}
            <div className="ai-info-card">
              <div className="ai-info-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="ai-info-title">AI-Powered Logging</p>
                <p className="ai-info-desc">
                  Powered by Groq <strong>gemma2-9b-it</strong> via LangGraph. 
                  Auto-summarizes topics, detects sentiment, and suggests follow-ups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
