import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Send, Loader2, Bot, User, Sparkles, Trash2,
  CheckCircle2, CornerDownRight, Zap
} from 'lucide-react';
import { sendChatMessage, clearChat } from '../store/chatSlice';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const renderContent = (content) => {
    // Convert markdown-style bold and bullets to JSX
    return content.split('\n').map((line, i) => {
      if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('+ ')) {
        return <li key={i}>{line.slice(2)}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i}>{line.slice(2, -2)}</strong>;
      }
      if (line === '') return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className={`message-row ${isUser ? 'message-user' : 'message-agent'}`}>
      {!isUser && (
        <div className="avatar avatar-agent">
          <Bot size={14} />
        </div>
      )}
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-agent'} ${message.isError ? 'bubble-error' : ''}`}>
        <div className="bubble-content">
          {renderContent(message.content)}
        </div>

        {message.action_taken && (
          <div className="bubble-action">
            <Zap size={11} />
            Tool used: <strong>{message.action_taken}</strong>
          </div>
        )}

        {message.suggested_followups?.length > 0 && (
          <div className="bubble-followups">
            <p><Sparkles size={11} /> Suggested Follow-ups:</p>
            <ul>
              {message.suggested_followups.map((f, i) => (
                <li key={i}><CornerDownRight size={10} /> {f}</li>
              ))}
            </ul>
          </div>
        )}

        {message.interaction_logged && (
          <div className="bubble-logged">
            <CheckCircle2 size={12} />
            Interaction #{message.interaction_logged.id} logged
          </div>
        )}

        <span className="bubble-time">{formatTimestamp(message.timestamp)}</span>
      </div>
      {isUser && (
        <div className="avatar avatar-user">
          <User size={14} />
        </div>
      )}
    </div>
  );
}

const QUICK_PROMPTS = [
  'Met Dr. Sharma today, discussed OncoBoost efficacy and Phase III data.',
  'Called Dr. Patel – he had concerns about pricing but seemed open to samples.',
  'Get interaction history for Dr. Ananya Singh',
  'Suggest follow-ups for my last meeting with Dr. Kapoor',
];

export default function ChatInterface() {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((s) => s.chat);
  const { formData } = useSelector((s) => s.interactions);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    dispatch(sendChatMessage({
      message: trimmed,
      history,
      hcp_id: formData.hcp_id || null,
    }));
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <Bot size={16} />
          </div>
          <div>
            <p className="chat-title">AI Assistant</p>
            <p className="chat-subtitle">Log interaction via chat</p>
          </div>
        </div>
        <button className="icon-btn" onClick={() => dispatch(clearChat())} title="Clear chat">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="message-row message-agent">
            <div className="avatar avatar-agent">
              <Bot size={14} />
            </div>
            <div className="bubble bubble-agent bubble-loading">
              <Loader2 size={14} className="spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="quick-prompts">
        <p className="quick-prompts-label">Try:</p>
        <div className="quick-prompts-list">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              className="quick-prompt-btn"
              onClick={() => setInput(p)}
              disabled={loading}
            >
              {p.length > 42 ? p.slice(0, 42) + '…' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder='Describe interaction... (e.g. "Met Dr. Smith, discussed Product X...")'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          Log
        </button>
      </div>
    </div>
  );
}
