import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Brain, FileText, AlertCircle, Loader2, Copy, Check,
  AlertTriangle, CheckCircle, Shield, Clock, ChevronRight,
  MessageSquare, Send, BarChart2, BookOpen
} from 'lucide-react';
import axios from 'axios';

/* ─── Legal term highlighter ─────────────────────────────────── */
const LEGAL_TERMS = [
  'indemnification','indemnify','indemnified','indemnitor','indemnitee',
  'liability','liable','limitation of liability',
  'termination','terminate','terminates',
  'confidential','confidentiality','non-disclosure','nda',
  'intellectual property','ip','copyright','trademark','patent',
  'force majeure',
  'arbitration','mediation','dispute resolution',
  'jurisdiction','governing law','applicable law',
  'warranty','warranties','warranted','warranty disclaimer',
  'representations','represent','representation',
  'breach','breaches','material breach',
  'default','defaulting party',
  'assignment','assignee','assignor','assign',
  'amendment','modification','modifications',
  'waiver','waivers',
  'severability','severability clause',
  'entire agreement','merger clause',
  'notice','notices','notification',
  'penalty','penalties','liquidated damages',
  'payment terms','consideration','compensation',
  'obligations','obligation',
  'compliance','comply',
  'exclusivity','exclusive',
  'subcontract','subcontractor',
  'renewal','auto-renew','automatic renewal',
  'effective date','commencement date',
  'party','parties','counterpart',
];

// Sort by length descending so longer phrases match first
const SORTED_TERMS = [...LEGAL_TERMS].sort((a, b) => b.length - a.length);

function highlightLegalTerms(text) {
  if (!text || typeof text !== 'string') return text;
  const escaped = SORTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = [];
  let last = 0;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={m.index} className="legal-term" title="Legal term">
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

/* ─── Markdown-to-JSX renderer ───────────────────────────────── */
function renderMarkdown(raw) {
  if (!raw) return null;
  const lines = raw.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="md-h1">{highlightLegalTerms(line.slice(2))}</h1>
      );
      i++; continue;
    }
    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="md-h2">{highlightLegalTerms(line.slice(3))}</h2>
      );
      i++; continue;
    }
    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="md-h3">{highlightLegalTerms(line.slice(4))}</h3>
      );
      i++; continue;
    }
    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      elements.push(<hr key={i} className="md-hr" />);
      i++; continue;
    }
    // Table row (| ... |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().slice(1, -1).split('|').map(c => c.trim());
        // skip separator rows (---|---)
        if (!cells.every(c => /^[-: ]+$/.test(c))) {
          rows.push(cells);
        }
        i++;
      }
      if (rows.length) {
        elements.push(
          <div key={`table-${i}`} className="md-table-wrapper">
            <table className="md-table">
              <thead>
                <tr>{rows[0].map((c, ci) => <th key={ci}>{highlightLegalTerms(c)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((c, ci) => <td key={ci}>{highlightLegalTerms(inlineMarkdown(c))}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }
    // Bullet list (• - *)
    if (/^[•\-\*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[•\-\*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[•\-\*] /, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="md-ul">
          {items.map((item, idx) => (
            <li key={idx} className="md-li">{highlightLegalTerms(inlineMarkdown(item))}</li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="md-ol">
          {items.map((item, idx) => (
            <li key={idx} className="md-li">{highlightLegalTerms(inlineMarkdown(item))}</li>
          ))}
        </ol>
      );
      continue;
    }
    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="md-blockquote">
          {highlightLegalTerms(inlineMarkdown(line.slice(2)))}
        </blockquote>
      );
      i++; continue;
    }
    // Empty line
    if (line.trim() === '') {
      i++; continue;
    }
    // Regular paragraph
    elements.push(
      <p key={i} className="md-p">{highlightLegalTerms(inlineMarkdown(line))}</p>
    );
    i++;
  }
  return elements;
}

/** Handle inline bold/italic/code/br */
function inlineMarkdown(text) {
  if (!text) return '';
  // Replace <br> tags
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Bold **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, (_, t) => `§BOLD§${t}§/BOLD§`);
  text = text.replace(/__(.+?)__/g, (_, t) => `§BOLD§${t}§/BOLD§`);
  // Italic *text* or _text_
  text = text.replace(/\*(.+?)\*/g, (_, t) => `§EM§${t}§/EM§`);
  // Code `text`
  text = text.replace(/`(.+?)`/g, (_, t) => `§CODE§${t}§/CODE§`);

  const parts = text.split(/(§BOLD§.*?§\/BOLD§|§EM§.*?§\/EM§|§CODE§.*?§\/CODE§)/g);
  return parts.map((part, i) => {
    if (part.startsWith('§BOLD§')) return <strong key={i}>{part.slice(6, -7)}</strong>;
    if (part.startsWith('§EM§'))   return <em key={i}>{part.slice(5, -5)}</em>;
    if (part.startsWith('§CODE§')) return <code key={i} className="md-code">{part.slice(7, -7)}</code>;
    return part;
  });
}

/* ─── Main component ─────────────────────────────────────────── */
function Analysis() {
  const navigate = useNavigate();
  const { docId } = useParams();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading]       = useState(true);
  const [isAsking, setIsAsking]         = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [aiResponse, setAiResponse]     = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [error, setError]               = useState('');
  const [copied, setCopied]             = useState(false);
  const [summary, setSummary]           = useState(null);
  const [activeTab, setActiveTab]       = useState('summary');
  const [qaHistory, setQaHistory]       = useState([]);

  useEffect(() => {
    const documentId = docId || localStorage.getItem('documentId');
    if (!documentId) {
      setError('No document specified. Please upload a document first.');
      setIsLoading(false);
      return;
    }
    fetchDocument(documentId);
  }, [docId]);

  const fetchDocument = async (documentId) => {
    try {
      const token = getToken();
      if (!token) { navigate('/login'); return; }

      const res = await fetch(
        `https://lexibridge-guax.onrender.com/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        if (res.status === 401) { navigate('/login'); return; }
        throw new Error(`Failed to fetch document (${res.status})`);
      }

      const data = await res.json();
      const doc  = data.document || data;
      setDocumentInfo(doc);
      await generateDocumentSummary(documentId, doc);
    } catch (err) {
      setError(`Failed to load document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocumentSummary = async (documentId, documentData) => {
    try {
      await askAI(
        'Provide a comprehensive legal summary of this document including: 1. Key points, 2. Important clauses, 3. Potential risks, 4. Recommendations. Format with clear headings and bullet points.',
        documentId,
        true
      );
    } catch {
      createFallbackSummary(documentData);
    }
  };

  const createFallbackSummary = (documentData) => {
    setSummary({
      keyPoints:       ['Document uploaded successfully', 'AI analysis service is being configured', 'Manual review recommended'],
      risks:           ['Full AI analysis temporarily unavailable', 'Consult legal expert for complex agreements'],
      clauses:         ['Standard contract structure detected', 'Multiple sections identified'],
      recommendations: ['Review all party information', 'Verify dates and signatures', 'Consult with legal counsel'],
    });
    setAiResponse('# Document Summary\n\nDocument uploaded successfully. Configure the Groq API key in your backend `.env` file to enable full AI analysis.\n\n## Next Steps\n- Ask specific questions using the Q&A tab\n- Verify all key clauses manually\n- Consult a qualified attorney for legal advice');
  };

  const extractSummaryFromResponse = (response) => {
    try {
      const lines = response.split('\n');
      const pick = (keywords) =>
        lines
          .filter(l => keywords.some(k => l.toLowerCase().includes(k)))
          .slice(0, 5)
          .map(l => l.replace(/^[#•\-\*\d\.\s]+/, '').trim())
          .filter(Boolean);

      setSummary({
        keyPoints:       pick(['key point', 'important:', '• ', '- ', '* ']).slice(0, 5) || ['Key points identified'],
        risks:           pick(['risk', 'warning', 'concern', 'potential']).slice(0, 4) || ['Standard risks apply'],
        clauses:         pick(['clause', 'section', 'article']).slice(0, 4)            || ['Multiple clauses identified'],
        recommendations: pick(['recommend', 'suggest', 'advise']).slice(0, 4)          || ['Review with legal counsel'],
      });
    } catch { /* silent */ }
  };

  const askAI = async (question, specificDocumentId = null, isInitial = false) => {
    if (!question.trim()) return;
    if (!isInitial) setIsAsking(true);
    setError('');

    try {
      const token = getToken();
      if (!token) { navigate('/login'); return; }
      const documentIdToUse = specificDocumentId || docId || localStorage.getItem('documentId');
      if (!documentIdToUse) throw new Error('No document ID available');

      const formData = new FormData();
      formData.append('question', question);
      formData.append('documentId', documentIdToUse);

      const res = await axios.post(
        'https://lexibridge-guax.onrender.com/ask-ai',
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }, timeout: 30000 }
      );

      if (res.data.aiResponse) {
        setAiResponse(res.data.aiResponse);
        if (isInitial) extractSummaryFromResponse(res.data.aiResponse);
        if (!isInitial) {
          setQaHistory(prev => [...prev, { q: question, a: res.data.aiResponse }]);
          setUserQuestion('');
        }
      } else {
        throw new Error('No response from AI service');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setTimeout(() => navigate('/login'), 2000);
      }
      if (isInitial) createFallbackSummary(documentInfo);
      else setError(`AI error: ${err.message}`);
    } finally {
      if (!isInitial) setIsAsking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const suggestedQuestions = [
    'Summarize the key obligations in this document',
    'What are the termination conditions?',
    'Identify any confidentiality requirements',
    'Explain the payment terms and conditions',
    'Are there any liability limitations?',
    'What dispute resolution methods are mentioned?',
  ];

  /* Loading state */
  if (isLoading) return (
    <div className="an-loading">
      <Loader2 className="an-spin" size={44} />
      <h2>Analyzing Your Document</h2>
      <p>Processing with AI — this may take a moment…</p>
    </div>
  );

  /* Hard error state */
  if (error && !aiResponse) return (
    <div className="an-error-page">
      <div className="an-error-card">
        <AlertCircle size={44} color="#ef4444" />
        <h2>Unable to Load Document</h2>
        <p>{error}</p>
        <button className="an-btn-primary" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className="an-page">
      {/* ── Page header ─────────────────────────── */}
      <div className="an-header">
        <div className="an-header-left">
          <Brain className="an-brain-icon" size={28} />
          <div>
            <h1>AI Document Analysis</h1>
            <p>AI-powered insights for your legal documents</p>
          </div>
        </div>
        <div className="an-header-actions">
          <button className="an-btn-ghost" onClick={() => navigate('/')}>Upload Another</button>
          <button className="an-btn-outline" onClick={() => navigate('/history')}>View History</button>
        </div>
      </div>

      {/* ── Document info bar ───────────────────── */}
      {documentInfo && (
        <div className="an-doc-bar">
          <div className="an-doc-bar-icon"><FileText size={20} /></div>
          <div className="an-doc-bar-info">
            <strong>{documentInfo.documentName || documentInfo.originalFilename || 'Legal Document'}</strong>
            <span>
              <Clock size={12} />
              Uploaded: {new Date(documentInfo.createdAt || Date.now()).toLocaleDateString()}
              {documentInfo.fileSize ? ` · ${(documentInfo.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
            </span>
          </div>
          <div className={`an-status-pill ${documentInfo.analysisStatus === 'completed' ? 'done' : 'pending'}`}>
            {documentInfo.analysisStatus === 'completed' ? '✓ Analyzed' : '⏳ Pending'}
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────── */}
      <div className="an-tabs">
        {[
          { key: 'summary',  label: 'Summary',      Icon: BarChart2    },
          { key: 'analysis', label: 'Full Analysis', Icon: BookOpen     },
          { key: 'qa',       label: 'Q&A',           Icon: MessageSquare },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`an-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── SUMMARY TAB ─────────────────────────── */}
      {activeTab === 'summary' && summary && (
        <div className="an-summary-grid">
          {[
            { title: 'Key Points',       items: summary.keyPoints,       icon: <CheckCircle size={18} />, cls: 'green'  },
            { title: 'Potential Risks',  items: summary.risks,           icon: <AlertTriangle size={18}/>, cls: 'amber'  },
            { title: 'Important Clauses',items: summary.clauses,         icon: <FileText size={18} />,    cls: 'blue'   },
            { title: 'Recommendations', items: summary.recommendations,  icon: <Brain size={18} />,       cls: 'purple' },
          ].map(({ title, items, icon, cls }) => (
            <div key={title} className={`an-summary-card ${cls}`}>
              <div className="an-summary-card-head">
                {icon}
                <h3>{title}</h3>
              </div>
              <ul className="an-summary-list">
                {(items || []).map((item, idx) => (
                  <li key={idx}>{highlightLegalTerms(typeof item === 'string' ? item : '')}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick actions */}
          <div className="an-quick-actions">
            <button className="an-qa-btn blue"   onClick={() => setActiveTab('analysis')}>View Full Analysis</button>
            <button className="an-qa-btn gray"   onClick={handleCopy} disabled={!aiResponse}>
              {copied ? '✓ Copied' : 'Copy Summary'}
            </button>
            <button className="an-qa-btn gray"   onClick={() => window.print()}>Print Report</button>
            <button className="an-qa-btn green"  onClick={() => navigate('/')}>New Document</button>
          </div>
        </div>
      )}

      {/* ── FULL ANALYSIS TAB ───────────────────── */}
      {activeTab === 'analysis' && (
        <div className="an-analysis-layout">
          {/* Sidebar */}
          <aside className="an-sidebar">
            <div className="an-sidebar-card">
              <h3>Suggested Questions</h3>
              <div className="an-questions-list">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} className="an-question-btn" onClick={() => { setActiveTab('qa'); askAI(q); }} disabled={isAsking}>
                    <ChevronRight size={13} />{q}
                  </button>
                ))}
              </div>
            </div>
            {documentInfo && (
              <div className="an-sidebar-card">
                <h3>Document Details</h3>
                <dl className="an-doc-details">
                  <dt>Filename</dt>
                  <dd>{documentInfo.documentName || documentInfo.originalFilename || '—'}</dd>
                  <dt>Upload Date</dt>
                  <dd>{new Date(documentInfo.createdAt || Date.now()).toLocaleDateString()}</dd>
                  {documentInfo.fileSize && <><dt>File Size</dt><dd>{(documentInfo.fileSize/1024/1024).toFixed(2)} MB</dd></>}
                </dl>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="an-main-content">
            <div className="an-analysis-card">
              <div className="an-analysis-card-head">
                <span className="an-analysis-card-title"><Brain size={16} /> AI Document Analysis</span>
                {aiResponse && (
                  <button className="an-copy-btn" onClick={handleCopy}>
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                )}
              </div>
              <div className="an-analysis-body">
                {error && (
                  <div className="an-inline-warning">
                    <AlertTriangle size={15} />{error}
                  </div>
                )}
                {aiResponse ? (
                  <div className="an-markdown">{renderMarkdown(aiResponse)}</div>
                ) : (
                  <div className="an-empty-analysis">
                    <Brain size={40} />
                    <p>Ask a question to generate AI analysis</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inline question input */}
            <div className="an-input-card">
              <h3>Ask About This Document</h3>
              <div className="an-input-row">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={e => setUserQuestion(e.target.value)}
                  placeholder="e.g., What are the termination conditions?"
                  className="an-text-input"
                  onKeyDown={e => e.key === 'Enter' && !isAsking && askAI(userQuestion)}
                />
                <button
                  className="an-ask-btn"
                  onClick={() => askAI(userQuestion)}
                  disabled={isAsking || !userQuestion.trim()}
                >
                  {isAsking ? <Loader2 className="an-spin" size={16} /> : <Send size={16} />}
                  {isAsking ? 'Analyzing…' : 'Ask AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Q&A TAB ─────────────────────────────── */}
      {activeTab === 'qa' && (
        <div className="an-qa-layout">
          <div className="an-qa-messages">
            {qaHistory.length === 0 && (
              <div className="an-qa-empty">
                <MessageSquare size={42} />
                <p>Ask a question about your document below.</p>
              </div>
            )}
            {qaHistory.map((item, i) => (
              <div key={i} className="an-qa-item">
                <div className="an-qa-q"><span>You</span><p>{item.q}</p></div>
                <div className="an-qa-a">
                  <span><Brain size={14} /> LexiBridge AI</span>
                  <div className="an-markdown">{renderMarkdown(item.a)}</div>
                </div>
              </div>
            ))}
            {isAsking && (
              <div className="an-qa-typing">
                <Loader2 className="an-spin" size={16} /> AI is thinking…
              </div>
            )}
          </div>

          <div className="an-qa-input-bar">
            {/* Suggested pills */}
            <div className="an-qa-suggestions">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <button key={i} className="an-pill" onClick={() => askAI(q)} disabled={isAsking}>{q}</button>
              ))}
            </div>
            <div className="an-input-row">
              <input
                type="text"
                value={userQuestion}
                onChange={e => setUserQuestion(e.target.value)}
                placeholder="Ask anything about this legal document…"
                className="an-text-input"
                onKeyDown={e => e.key === 'Enter' && !isAsking && askAI(userQuestion)}
              />
              <button
                className="an-ask-btn"
                onClick={() => askAI(userQuestion)}
                disabled={isAsking || !userQuestion.trim()}
              >
                {isAsking ? <Loader2 className="an-spin" size={16} /> : <Send size={16} />}
                {isAsking ? 'Analyzing…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scoped styles ────────────────────────── */}
      <style>{`
        .an-page {
          max-width: 1160px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #1e293b;
        }
        .an-loading {
          min-height: 70vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: .9rem; color: #64748b; text-align: center;
        }
        .an-loading h2 { color: #0f172a; margin: 0; font-size: 1.4rem; }
        .an-loading p { margin: 0; }
        .an-error-page {
          min-height: 70vh;
          display: flex; align-items: center; justify-content: center;
        }
        .an-error-card {
          background: #fff; border-radius: 16px;
          padding: 2.5rem; text-align: center; max-width: 400px;
          box-shadow: 0 4px 20px rgba(0,0,0,.1);
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .an-error-card h2 { margin: 0; }
        .an-error-card p { color: #64748b; margin: 0; }
        .an-btn-primary {
          padding: .65rem 1.5rem; background: #3b82f6;
          color: #fff; border: none; border-radius: 9px;
          font-weight: 600; cursor: pointer; margin-top: .5rem;
        }
        /* Header */
        .an-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; flex-wrap: wrap;
          gap: 1rem; margin-bottom: 1.4rem;
        }
        .an-header-left { display: flex; gap: .75rem; align-items: flex-start; }
        .an-brain-icon { color: #6366f1; margin-top: 4px; flex-shrink: 0; }
        .an-header-left h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 .15rem; color: #0f172a; }
        .an-header-left p  { color: #64748b; margin: 0; font-size: .9rem; }
        .an-header-actions { display: flex; gap: .6rem; }
        .an-btn-ghost  { padding: .5rem 1rem; background: transparent; border: 1px solid #e2e8f0; border-radius: 9px; cursor: pointer; font-size: .87rem; color: #475569; }
        .an-btn-outline{ padding: .5rem 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9px; cursor: pointer; font-size: .87rem; color: #3b82f6; font-weight: 600; }
        /* Doc bar */
        .an-doc-bar {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 1rem 1.25rem;
          display: flex; align-items: center; gap: .9rem;
          margin-bottom: 1.4rem;
          box-shadow: 0 1px 4px rgba(0,0,0,.05);
        }
        .an-doc-bar-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: #eff6ff; color: #3b82f6;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .an-doc-bar-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .an-doc-bar-info strong { font-size: .95rem; color: #0f172a; }
        .an-doc-bar-info span  { font-size: .78rem; color: #94a3b8; display: flex; align-items: center; gap: 5px; }
        .an-status-pill { padding: .3rem .85rem; border-radius: 20px; font-size: .78rem; font-weight: 600; }
        .an-status-pill.done    { background: #dcfce7; color: #166534; }
        .an-status-pill.pending { background: #fef9c3; color: #854d0e; }
        /* Tabs */
        .an-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .an-tab {
          display: flex; align-items: center; gap: .4rem;
          padding: .55rem 1.15rem; border-radius: 9px;
          border: 1px solid #e2e8f0; background: #fff;
          font-size: .87rem; font-weight: 500; color: #475569; cursor: pointer;
          transition: all .15s;
        }
        .an-tab.active { background: #6366f1; border-color: #6366f1; color: #fff; }
        .an-tab:not(.active):hover { background: #f8fafc; }
        /* Summary grid */
        .an-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }
        .an-summary-card {
          background: #fff; border-radius: 14px;
          padding: 1.2rem 1.3rem;
          border-top: 3px solid transparent;
          box-shadow: 0 1px 5px rgba(0,0,0,.07);
        }
        .an-summary-card.green  { border-color: #22c55e; }
        .an-summary-card.amber  { border-color: #f59e0b; }
        .an-summary-card.blue   { border-color: #3b82f6; }
        .an-summary-card.purple { border-color: #8b5cf6; }
        .an-summary-card-head {
          display: flex; align-items: center; gap: .55rem;
          margin-bottom: .85rem; font-weight: 700; font-size: .92rem; color: #0f172a;
        }
        .an-summary-card.green  .an-summary-card-head { color: #15803d; }
        .an-summary-card.amber  .an-summary-card-head { color: #b45309; }
        .an-summary-card.blue   .an-summary-card-head { color: #1d4ed8; }
        .an-summary-card.purple .an-summary-card-head { color: #7c3aed; }
        .an-summary-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .55rem; }
        .an-summary-list li { font-size: .84rem; color: #475569; padding-left: 1.2rem; position: relative; line-height: 1.5; }
        .an-summary-list li::before { content: '›'; position: absolute; left: 0; color: #94a3b8; }
        /* Quick actions row (spans full width) */
        .an-quick-actions {
          grid-column: 1 / -1;
          display: flex; gap: .6rem; flex-wrap: wrap;
          background: #fff; border-radius: 14px; padding: 1rem 1.3rem;
          box-shadow: 0 1px 5px rgba(0,0,0,.07);
        }
        .an-qa-btn {
          flex: 1 1 auto; min-width: 120px;
          padding: .55rem 1rem; border: none; border-radius: 9px;
          font-size: .83rem; font-weight: 600; cursor: pointer; transition: background .15s;
        }
        .an-qa-btn.blue   { background: #eff6ff; color: #1d4ed8; }
        .an-qa-btn.blue:hover { background: #dbeafe; }
        .an-qa-btn.gray   { background: #f1f5f9; color: #475569; }
        .an-qa-btn.gray:hover { background: #e2e8f0; }
        .an-qa-btn.green  { background: #f0fdf4; color: #15803d; }
        .an-qa-btn.green:hover { background: #dcfce7; }
        /* Analysis layout */
        .an-analysis-layout { display: flex; gap: 1.25rem; align-items: flex-start; }
        .an-sidebar { width: 270px; flex-shrink: 0; display: flex; flex-direction: column; gap: 1rem; }
        .an-sidebar-card {
          background: #fff; border-radius: 14px;
          padding: 1.1rem 1.2rem;
          box-shadow: 0 1px 5px rgba(0,0,0,.07);
        }
        .an-sidebar-card h3 { font-size: .88rem; font-weight: 700; color: #0f172a; margin: 0 0 .75rem; }
        .an-questions-list { display: flex; flex-direction: column; gap: .4rem; }
        .an-question-btn {
          display: flex; align-items: flex-start; gap: .4rem;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; padding: .5rem .7rem;
          font-size: .8rem; color: #475569; cursor: pointer; text-align: left;
          transition: background .15s;
        }
        .an-question-btn:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        .an-doc-details { display: grid; grid-template-columns: auto 1fr; gap: .3rem .75rem; font-size: .82rem; margin: 0; }
        .an-doc-details dt { color: #94a3b8; }
        .an-doc-details dd { color: #1e293b; font-weight: 500; margin: 0; }
        .an-main-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1rem; }
        .an-analysis-card {
          background: #fff; border-radius: 14px; overflow: hidden;
          box-shadow: 0 1px 5px rgba(0,0,0,.07);
        }
        .an-analysis-card-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: .9rem 1.25rem; border-bottom: 1px solid #f1f5f9;
        }
        .an-analysis-card-title { display: flex; align-items: center; gap: .5rem; font-weight: 700; font-size: .92rem; color: #0f172a; }
        .an-copy-btn {
          display: flex; align-items: center; gap: .35rem;
          padding: .35rem .8rem; background: #f1f5f9;
          border: none; border-radius: 7px; cursor: pointer;
          font-size: .8rem; color: #475569;
        }
        .an-copy-btn:hover { background: #e2e8f0; }
        .an-analysis-body { padding: 1.25rem; }
        .an-inline-warning {
          display: flex; align-items: center; gap: .5rem;
          background: #fffbeb; border: 1px solid #fcd34d;
          border-radius: 8px; padding: .65rem .9rem;
          font-size: .83rem; color: #92400e; margin-bottom: 1rem;
        }
        .an-empty-analysis {
          text-align: center; padding: 3rem 1rem;
          color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: .75rem;
        }
        .an-input-card {
          background: #fff; border-radius: 14px;
          padding: 1.1rem 1.25rem;
          box-shadow: 0 1px 5px rgba(0,0,0,.07);
        }
        .an-input-card h3 { font-size: .9rem; font-weight: 700; margin: 0 0 .75rem; color: #0f172a; }
        .an-input-row { display: flex; gap: .6rem; }
        .an-text-input {
          flex: 1; padding: .65rem 1rem;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: .88rem; color: #1e293b; outline: none;
          transition: border-color .15s;
        }
        .an-text-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .an-ask-btn {
          display: flex; align-items: center; gap: .45rem;
          padding: .65rem 1.25rem; background: #6366f1;
          color: #fff; border: none; border-radius: 10px;
          font-size: .87rem; font-weight: 600; cursor: pointer;
          white-space: nowrap; transition: background .15s;
        }
        .an-ask-btn:hover:not(:disabled) { background: #4f46e5; }
        .an-ask-btn:disabled { opacity: .55; cursor: not-allowed; }
        /* Q&A layout */
        .an-qa-layout { display: flex; flex-direction: column; gap: 1rem; }
        .an-qa-messages {
          background: #fff; border-radius: 14px;
          padding: 1.25rem; min-height: 300px;
          box-shadow: 0 1px 5px rgba(0,0,0,.07);
          display: flex; flex-direction: column; gap: 1.25rem;
        }
        .an-qa-empty { text-align: center; color: #94a3b8; padding: 3rem 0; display: flex; flex-direction: column; align-items: center; gap: .75rem; }
        .an-qa-item { display: flex; flex-direction: column; gap: .75rem; }
        .an-qa-q { display: flex; flex-direction: column; align-items: flex-end; gap: .3rem; }
        .an-qa-q span { font-size: .75rem; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: .05em; }
        .an-qa-q p { background: #eff6ff; border-radius: 12px 12px 2px 12px; padding: .7rem 1rem; max-width: 80%; font-size: .88rem; color: #1e293b; margin: 0; }
        .an-qa-a { display: flex; flex-direction: column; gap: .3rem; }
        .an-qa-a span { font-size: .75rem; font-weight: 700; color: #6366f1; display: flex; align-items: center; gap: .35rem; text-transform: uppercase; letter-spacing: .05em; }
        .an-qa-a .an-markdown { background: #f8fafc; border-radius: 2px 12px 12px 12px; padding: .85rem 1rem; font-size: .87rem; }
        .an-qa-typing { display: flex; align-items: center; gap: .5rem; color: #94a3b8; font-size: .85rem; }
        .an-qa-input-bar { background: #fff; border-radius: 14px; padding: 1rem 1.25rem; box-shadow: 0 1px 5px rgba(0,0,0,.07); }
        .an-qa-suggestions { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .75rem; }
        .an-pill {
          padding: .3rem .75rem; background: #f1f5f9;
          border: 1px solid #e2e8f0; border-radius: 20px;
          font-size: .76rem; color: #475569; cursor: pointer;
          transition: all .15s; white-space: nowrap;
        }
        .an-pill:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        /* Markdown styles */
        .an-markdown { line-height: 1.65; color: #374151; }
        .an-markdown .md-h1 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 1.2rem 0 .5rem; padding-bottom: .4rem; border-bottom: 2px solid #e2e8f0; }
        .an-markdown .md-h2 { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 1rem 0 .4rem; }
        .an-markdown .md-h3 { font-size: .95rem; font-weight: 700; color: #334155; margin: .9rem 0 .35rem; }
        .an-markdown .md-p  { margin: .4rem 0; font-size: .88rem; }
        .an-markdown .md-ul, .an-markdown .md-ol { margin: .4rem 0 .4rem 1.4rem; padding: 0; }
        .an-markdown .md-li { font-size: .87rem; margin-bottom: .3rem; }
        .an-markdown .md-hr { border: none; border-top: 1px solid #e2e8f0; margin: .9rem 0; }
        .an-markdown .md-blockquote { border-left: 3px solid #6366f1; margin: .7rem 0; padding: .5rem .9rem; background: #f5f3ff; border-radius: 0 8px 8px 0; font-size: .86rem; color: #4b5563; }
        .an-markdown .md-code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px 5px; font-family: monospace; font-size: .83rem; }
        .an-markdown .md-table-wrapper { overflow-x: auto; margin: .7rem 0; }
        .an-markdown .md-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
        .an-markdown .md-table th { background: #f8fafc; padding: .55rem .8rem; text-align: left; font-weight: 700; font-size: .78rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
        .an-markdown .md-table td { padding: .55rem .8rem; border-bottom: 1px solid #f1f5f9; }
        .an-markdown .md-table tbody tr:hover { background: #f8fafc; }
        /* Legal term highlight */
        .legal-term {
          background: linear-gradient(120deg, #fef9c3 0%, #fef08a 100%);
          border-bottom: 1.5px solid #eab308;
          border-radius: 3px;
          padding: 0 2px;
          cursor: help;
          font-weight: 500;
          color: #78350f;
        }
        /* Spin util */
        .an-spin { animation: an-rotate 1s linear infinite; }
        @keyframes an-rotate { to { transform: rotate(360deg); } }
        /* Responsive */
        @media (max-width: 768px) {
          .an-analysis-layout { flex-direction: column; }
          .an-sidebar { width: 100%; }
          .an-header { flex-direction: column; }
          .an-summary-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default Analysis;
