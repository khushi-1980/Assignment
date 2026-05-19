import React from 'react';
import { useSelector } from 'react-redux';
import { Calendar, TrendingUp, TrendingDown, Minus, Sparkles, CornerDownRight } from 'lucide-react';

function SentimentIcon({ sentiment }) {
  if (sentiment === 'positive') return <TrendingUp size={12} />;
  if (sentiment === 'negative') return <TrendingDown size={12} />;
  return <Minus size={12} />;
}

export default function InteractionList() {
  const { hcpHistory } = useSelector((s) => s.interactions);

  if (hcpHistory.length === 0) {
    return (
      <div className="history-empty">
        <p>No recent interactions.</p>
        <p className="history-empty-sub">Log an interaction to see history here.</p>
      </div>
    );
  }

  return (
    <div className="history-list">
      {hcpHistory.map((interaction) => (
        <div key={interaction.id} className="history-card">
          <div className="history-card-header">
            <div className="history-card-left">
              <span className="history-type-badge">{interaction.interaction_type}</span>
              <span className={`sentiment-pill sentiment-${interaction.sentiment}`}>
                <SentimentIcon sentiment={interaction.sentiment} />
                {interaction.sentiment}
              </span>
            </div>
            <div className="history-date">
              <Calendar size={11} />
              {new Date(interaction.interaction_date).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </div>
          </div>

          {interaction.ai_summary && (
            <div className="history-summary">
              <Sparkles size={11} />
              <p>{interaction.ai_summary}</p>
            </div>
          )}

          {interaction.ai_suggested_followups?.length > 0 && (
            <div className="history-followups">
              {interaction.ai_suggested_followups.slice(0, 2).map((f, i) => (
                <span key={i} className="followup-chip">
                  <CornerDownRight size={10} />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
