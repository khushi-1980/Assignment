import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search, Plus, Trash2, ChevronDown, Mic, Loader2,
  CheckCircle2, AlertCircle, Sparkles, Calendar, Clock,
  Package, Flask, Users, FileText, Target, CornerDownRight
} from 'lucide-react';
import {
  fetchHCPs, logInteraction, updateFormData,
  resetForm, addMaterial, removeMaterial, addSample, removeSample,
} from '../store/interactionSlice';

const INTERACTION_TYPES = ['Meeting', 'Phone Call', 'Email', 'Conference', 'Webinar', 'Site Visit'];
const SAMPLE_DRUGS = ['OncoBoost 10mg', 'CardioMax 5mg', 'NeuroShield 20mg', 'DiabeCare 15mg'];
const SAMPLE_MATERIALS = ['OncoBoost Brochure', 'Phase III Trial Data', 'Prescribing Guide', 'Patient Leaflet'];

export default function LogInteractionForm() {
  const dispatch = useDispatch();
  const { hcps, formData, loading, success, error, submittedInteraction } = useSelector(
    (s) => s.interactions
  );

  const [hcpQuery, setHcpQuery] = useState('');
  const [showHcpDropdown, setShowHcpDropdown] = useState(false);
  const [materialInput, setMaterialInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false);
  const [showSampleSuggestions, setShowSampleSuggestions] = useState(false);
  const hcpRef = useRef(null);

  // Fetch HCPs when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchHCPs(hcpQuery));
    }, 300);
    return () => clearTimeout(timer);
  }, [hcpQuery, dispatch]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClick = (e) => {
      if (hcpRef.current && !hcpRef.current.contains(e.target)) {
        setShowHcpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectHCP = (hcp) => {
    dispatch(updateFormData({ hcp_id: hcp.id, hcp_name: hcp.name }));
    setHcpQuery(hcp.name);
    setShowHcpDropdown(false);
  };

  const handleChange = (field, value) => {
    dispatch(updateFormData({ [field]: value }));
  };

  const handleAddMaterial = (mat) => {
    if (mat.trim()) {
      dispatch(addMaterial(mat.trim()));
      setMaterialInput('');
      setShowMaterialSuggestions(false);
    }
  };

  const handleAddSample = (sample) => {
    if (sample.trim()) {
      dispatch(addSample(sample.trim()));
      setSampleInput('');
      setShowSampleSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.hcp_id) return;

    const payload = {
      hcp_id: parseInt(formData.hcp_id),
      interaction_type: formData.interaction_type,
      interaction_date: new Date(formData.interaction_date).toISOString(),
      interaction_time: formData.interaction_time,
      attendees: formData.attendees,
      topics_discussed: formData.topics_discussed,
      materials_shared: formData.materials_shared,
      samples_distributed: formData.samples_distributed,
      sentiment: formData.sentiment,
      outcomes: formData.outcomes,
      follow_up_actions: formData.follow_up_actions,
    };

    dispatch(logInteraction(payload));
  };

  if (success && submittedInteraction) {
    return (
      <div className="success-state">
        <div className="success-icon">
          <CheckCircle2 size={48} />
        </div>
        <h2>Interaction Logged!</h2>
        <p className="success-subtitle">AI-enriched and saved successfully</p>

        <div className="ai-summary-card">
          <div className="ai-summary-header">
            <Sparkles size={16} />
            <span>AI Summary</span>
          </div>
          <p>{submittedInteraction.ai_summary || 'Interaction captured and processed.'}</p>
        </div>

        {submittedInteraction.ai_suggested_followups?.length > 0 && (
          <div className="followup-card">
            <p className="followup-title">AI Suggested Follow-ups</p>
            <ul>
              {submittedInteraction.ai_suggested_followups.map((f, i) => (
                <li key={i}>
                  <CornerDownRight size={12} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sentiment-badge-row">
          <span className={`sentiment-badge sentiment-${submittedInteraction.sentiment}`}>
            {submittedInteraction.sentiment?.toUpperCase()} SENTIMENT
          </span>
          {submittedInteraction.sentiment_score && (
            <span className="sentiment-score">
              {Math.round(submittedInteraction.sentiment_score * 100)}% confidence
            </span>
          )}
        </div>

        <button className="btn-primary btn-full" onClick={() => dispatch(resetForm())}>
          Log Another Interaction
        </button>
      </div>
    );
  }

  return (
    <form className="interaction-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Row: HCP + Type ── */}
      <div className="form-row two-col">
        <div className="form-group" ref={hcpRef}>
          <label className="form-label">
            <Users size={13} /> HCP Name <span className="required">*</span>
          </label>
          <div className="input-with-icon">
            <Search size={15} className="input-icon" />
            <input
              className="form-input"
              placeholder="Search or select HCP..."
              value={hcpQuery}
              onChange={(e) => { setHcpQuery(e.target.value); setShowHcpDropdown(true); }}
              onFocus={() => setShowHcpDropdown(true)}
              required
            />
          </div>
          {showHcpDropdown && hcps.length > 0 && (
            <div className="dropdown">
              {hcps.map((hcp) => (
                <div key={hcp.id} className="dropdown-item" onClick={() => handleSelectHCP(hcp)}>
                  <span className="dropdown-name">{hcp.name}</span>
                  <span className="dropdown-meta">{hcp.specialty} · {hcp.institution}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Interaction Type</label>
          <div className="input-with-icon select-wrapper">
            <select
              className="form-input form-select"
              value={formData.interaction_type}
              onChange={(e) => handleChange('interaction_type', e.target.value)}
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={15} className="select-icon" />
          </div>
        </div>
      </div>

      {/* ── Row: Date + Time ── */}
      <div className="form-row two-col">
        <div className="form-group">
          <label className="form-label"><Calendar size={13} /> Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.interaction_date}
            onChange={(e) => handleChange('interaction_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label"><Clock size={13} /> Time</label>
          <input
            type="time"
            className="form-input"
            value={formData.interaction_time}
            onChange={(e) => handleChange('interaction_time', e.target.value)}
          />
        </div>
      </div>

      {/* ── Attendees ── */}
      <div className="form-group">
        <label className="form-label"><Users size={13} /> Attendees</label>
        <input
          className="form-input"
          placeholder="Enter names or search..."
          value={formData.attendees}
          onChange={(e) => handleChange('attendees', e.target.value)}
        />
      </div>

      {/* ── Topics Discussed ── */}
      <div className="form-group">
        <label className="form-label"><FileText size={13} /> Topics Discussed</label>
        <div className="textarea-wrapper">
          <textarea
            className="form-input form-textarea"
            placeholder="Enter key discussion points..."
            value={formData.topics_discussed}
            onChange={(e) => handleChange('topics_discussed', e.target.value)}
            rows={4}
          />
          <button type="button" className="textarea-action-btn" title="Summarize with AI">
            <Sparkles size={14} />
          </button>
        </div>
        <button type="button" className="voice-btn">
          <Mic size={13} />
          Summarize from Voice Note (Requires Consent)
        </button>
      </div>

      {/* ── Materials Shared ── */}
      <div className="form-group">
        <label className="form-label"><Package size={13} /> Materials Shared</label>
        <div className="tag-section">
          <div className="tag-list">
            {formData.materials_shared.map((m, i) => (
              <span key={i} className="tag tag-blue">
                {m}
                <button type="button" onClick={() => dispatch(removeMaterial(i))}>
                  <Trash2 size={10} />
                </button>
              </span>
            ))}
            {formData.materials_shared.length === 0 && (
              <span className="tag-placeholder">No materials added</span>
            )}
          </div>
          <div className="tag-input-row">
            <input
              className="form-input tag-input"
              placeholder="Search/Add material..."
              value={materialInput}
              onChange={(e) => { setMaterialInput(e.target.value); setShowMaterialSuggestions(true); }}
              onFocus={() => setShowMaterialSuggestions(true)}
            />
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => handleAddMaterial(materialInput)}
            >
              <Search size={13} /> Search/Add
            </button>
          </div>
          {showMaterialSuggestions && materialInput && (
            <div className="dropdown">
              {SAMPLE_MATERIALS.filter(m =>
                m.toLowerCase().includes(materialInput.toLowerCase())
              ).map((m) => (
                <div key={m} className="dropdown-item" onClick={() => handleAddMaterial(m)}>
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Samples Distributed ── */}
      <div className="form-group">
        <label className="form-label"><Flask size={13} /> Samples Distributed</label>
        <div className="tag-section">
          <div className="tag-list">
            {formData.samples_distributed.map((s, i) => (
              <span key={i} className="tag tag-green">
                {s}
                <button type="button" onClick={() => dispatch(removeSample(i))}>
                  <Trash2 size={10} />
                </button>
              </span>
            ))}
            {formData.samples_distributed.length === 0 && (
              <span className="tag-placeholder">No samples added</span>
            )}
          </div>
          <div className="tag-input-row">
            <input
              className="form-input tag-input"
              placeholder="Add sample drug..."
              value={sampleInput}
              onChange={(e) => { setSampleInput(e.target.value); setShowSampleSuggestions(true); }}
              onFocus={() => setShowSampleSuggestions(true)}
            />
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => handleAddSample(sampleInput)}
            >
              <Plus size={13} /> Add Sample
            </button>
          </div>
          {showSampleSuggestions && sampleInput && (
            <div className="dropdown">
              {SAMPLE_DRUGS.filter(d =>
                d.toLowerCase().includes(sampleInput.toLowerCase())
              ).map((d) => (
                <div key={d} className="dropdown-item" onClick={() => handleAddSample(d)}>
                  {d}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sentiment ── */}
      <div className="form-group">
        <label className="form-label">Observed/Inferred HCP Sentiment</label>
        <div className="sentiment-radio-group">
          {['positive', 'neutral', 'negative'].map((s) => (
            <label key={s} className={`sentiment-radio ${formData.sentiment === s ? 'active' : ''} sentiment-${s}`}>
              <input
                type="radio"
                name="sentiment"
                value={s}
                checked={formData.sentiment === s}
                onChange={() => handleChange('sentiment', s)}
              />
              <span className="sentiment-dot" />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* ── Outcomes ── */}
      <div className="form-group">
        <label className="form-label"><Target size={13} /> Outcomes</label>
        <textarea
          className="form-input form-textarea"
          placeholder="Key outcomes or agreements..."
          value={formData.outcomes}
          onChange={(e) => handleChange('outcomes', e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Follow-up Actions ── */}
      <div className="form-group">
        <label className="form-label"><CornerDownRight size={13} /> Follow-up Actions</label>
        <textarea
          className="form-input form-textarea"
          placeholder="Enter next steps or tasks..."
          value={formData.follow_up_actions}
          onChange={(e) => handleChange('follow_up_actions', e.target.value)}
          rows={3}
        />
        <div className="ai-followup-hint">
          <Sparkles size={12} />
          AI Suggested Follow-ups will appear after saving
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        className="btn-primary btn-full btn-submit"
        disabled={loading || !formData.hcp_id}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="spin" />
            Processing with AI...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Log Interaction
          </>
        )}
      </button>
    </form>
  );
}
