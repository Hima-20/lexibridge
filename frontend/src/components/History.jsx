import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FileText, Calendar, Clock, Eye, Trash2, FileSearch, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

function History() {
  const navigate = useNavigate();
  const { getToken, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) { navigate('/login'); return; }

      const response = await fetch('https://lexibridge-guax.onrender.com/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) { navigate('/login'); return; }
        throw new Error(`Failed to load documents (${response.status})`);
      }

      const data = await response.json();
      const docs = data.documents || data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = getToken();
      await fetch(`https://lexibridge-guax.onrender.com/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document');
    }
  };

  // A document is "completed/analyzed" if:
  //   analysisStatus === 'completed'  OR  hasSummary === true
  // (hasSummary is set by the backend when aiSummary exists,
  //  even if the status field wasn't updated correctly)
  const isAnalyzed = (doc) =>
    doc.analysisStatus === 'completed' ||
    doc.hasSummary === true;

  const getStatusBadge = (doc) => {
    if (isAnalyzed(doc))
      return <span className="h-badge h-done"><CheckCircle2 size={13} /> Completed</span>;
    if (doc.analysisStatus === 'analyzing')
      return <span className="h-badge h-analyzing"><Loader2 size={13} className="h-spin-sm" /> Analyzing</span>;
    if (doc.analysisStatus === 'error')
      return <span className="h-badge h-error"><AlertCircle size={13} /> Error</span>;
    return <span className="h-badge h-pending"><Clock size={13} /> Pending</span>;
  };

  const analyzedCount = documents.filter(isAnalyzed).length;
  const pendingCount  = documents.filter(d => !isAnalyzed(d) && d.analysisStatus !== 'error').length;

  // "Upload New Document" — goes to '/' (Homepage has the upload widget).
  // Change to '/upload' if you have a dedicated upload route.
  const goToUpload = () => navigate('/');

  /* ── Loading ── */
  if (loading) return (
    <div className="h-page">
      <div className="h-mid">
        <Loader2 size={40} className="h-spin" />
        <p>Loading your documents…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="h-page">
      <div className="h-mid">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Failed to Load History</h2>
        <p>{error}</p>
        <button className="h-btn" onClick={fetchDocuments}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="h-page">

      {/* Header */}
      <div className="h-header">
        <div>
          <h1>Document History</h1>
          <p>View and manage your previously analyzed documents</p>
        </div>
        <button className="h-btn" onClick={goToUpload}>+ Upload New Document</button>
      </div>

      {/* Stats */}
      <div className="h-stats">
        <div className="h-stat">
          <div className="h-stat-ico blue"><FileText size={20} /></div>
          <div>
            <div className="h-stat-n">{documents.length}</div>
            <div className="h-stat-l">Total Documents</div>
          </div>
        </div>
        <div className="h-stat">
          <div className="h-stat-ico green"><FileSearch size={20} /></div>
          <div>
            <div className="h-stat-n">{analyzedCount}</div>
            <div className="h-stat-l">Analyzed</div>
          </div>
        </div>
        <div className="h-stat">
          <div className="h-stat-ico amber"><Clock size={20} /></div>
          <div>
            <div className="h-stat-n">{pendingCount}</div>
            <div className="h-stat-l">Pending</div>
          </div>
        </div>
      </div>

      {/* Table or Empty */}
      {documents.length === 0 ? (
        <div className="h-empty">
          <FileText size={52} color="#cbd5e1" />
          <h3>No documents yet</h3>
          <p>Upload your first document to get started with AI analysis</p>
          <button className="h-btn" onClick={goToUpload}>Upload Document</button>
        </div>
      ) : (
        <div className="h-table-wrap">
          <table className="h-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Upload Date</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>

                  <td>
                    <div className="h-doc-cell">
                      <div className="h-doc-ico"><FileText size={17} /></div>
                      <div>
                        <div className="h-doc-name">
                          {doc.documentName || doc.originalFilename || 'Document'}
                        </div>
                        <div className="h-doc-sub">
                          PDF
                          {doc.hasSummary &&
                            <span className="h-has-summary"> · AI summary available</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="h-date">
                      <span><Calendar size={12} />{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span><Clock size={12} />{new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>

                  <td>
                    <span className="h-size">
                      {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}
                    </span>
                  </td>

                  <td>{getStatusBadge(doc)}</td>

                  <td>
                    <div className="h-acts">
                      <button
                        className="h-act view" title="View / Analyze"
                        onClick={() => { localStorage.setItem('documentId', doc.id); navigate('/analysis'); }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="h-act del" title="Delete"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .h-page { max-width:1100px; margin:0 auto; padding:2.5rem 1.5rem 4rem; font-family:'Segoe UI',system-ui,sans-serif; }

        /* states */
        .h-mid { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; min-height:320px; color:#64748b; text-align:center; }
        .h-mid h2 { color:#0f172a; margin:0; }
        .h-mid p  { margin:0; }
        .h-spin    { animation:hrot 1s linear infinite; }
        .h-spin-sm { animation:hrot 1s linear infinite; }
        @keyframes hrot { to { transform:rotate(360deg); } }

        /* button */
        .h-btn { padding:.65rem 1.4rem; background:#3b82f6; color:#fff; border:none; border-radius:10px; font-weight:600; font-size:.9rem; cursor:pointer; transition:background .18s; }
        .h-btn:hover { background:#2563eb; }

        /* header */
        .h-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:2rem; }
        .h-header h1 { font-size:1.75rem; font-weight:800; color:#0f172a; margin:0 0 .25rem; }
        .h-header p  { color:#64748b; margin:0; font-size:.92rem; }

        /* stats */
        .h-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:1rem; margin-bottom:2rem; }
        .h-stat  { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.1rem 1.4rem; display:flex; align-items:center; gap:1rem; box-shadow:0 1px 4px rgba(0,0,0,.05); }
        .h-stat-ico { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .h-stat-ico.blue  { background:#eff6ff; color:#3b82f6; }
        .h-stat-ico.green { background:#f0fdf4; color:#22c55e; }
        .h-stat-ico.amber { background:#fffbeb; color:#f59e0b; }
        .h-stat-n { font-size:1.6rem; font-weight:800; color:#0f172a; line-height:1.1; }
        .h-stat-l { font-size:.78rem; color:#64748b; margin-top:2px; }

        /* empty */
        .h-empty { text-align:center; padding:4rem 1rem; background:#fff; border-radius:16px; border:1.5px dashed #cbd5e1; display:flex; flex-direction:column; align-items:center; gap:.75rem; color:#94a3b8; }
        .h-empty h3 { color:#1e293b; margin:0; font-size:1.15rem; }
        .h-empty p  { margin:0; }

        /* table */
        .h-table-wrap { background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.06); }
        .h-table { width:100%; border-collapse:collapse; }
        .h-table thead { background:#f8fafc; }
        .h-table th { padding:.85rem 1.2rem; text-align:left; font-size:.74rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; border-bottom:1px solid #e2e8f0; }
        .h-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background .12s; }
        .h-table tbody tr:last-child { border-bottom:none; }
        .h-table tbody tr:hover { background:#f8fafc; }
        .h-table td { padding:.95rem 1.2rem; vertical-align:middle; }

        /* doc cell */
        .h-doc-cell { display:flex; align-items:center; gap:.85rem; }
        .h-doc-ico  { width:38px; height:38px; border-radius:9px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .h-doc-name { font-weight:600; color:#0f172a; font-size:.9rem; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .h-doc-sub  { font-size:.73rem; color:#94a3b8; margin-top:2px; }
        .h-has-summary { color:#22c55e; font-weight:600; }

        /* date */
        .h-date { display:flex; flex-direction:column; gap:3px; font-size:.82rem; color:#64748b; }
        .h-date span { display:flex; align-items:center; gap:5px; }

        /* size */
        .h-size { font-size:.82rem; color:#475569; background:#f1f5f9; padding:3px 10px; border-radius:6px; white-space:nowrap; }

        /* badges */
        .h-badge    { display:inline-flex; align-items:center; gap:5px; padding:.32rem .85rem; border-radius:20px; font-size:.76rem; font-weight:700; white-space:nowrap; }
        .h-done     { background:#dcfce7; color:#15803d; }
        .h-pending  { background:#fef9c3; color:#92400e; }
        .h-analyzing{ background:#eff6ff; color:#1d4ed8; }
        .h-error    { background:#fee2e2; color:#991b1b; }

        /* actions */
        .h-acts { display:flex; gap:.5rem; }
        .h-act  { width:34px; height:34px; border:none; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .h-act.view  { background:#eff6ff; color:#3b82f6; }
        .h-act.view:hover  { background:#dbeafe; }
        .h-act.del   { background:#fef2f2; color:#ef4444; }
        .h-act.del:hover   { background:#fee2e2; }

        @media (max-width:640px) {
          .h-table th:nth-child(3), .h-table td:nth-child(3) { display:none; }
        }
      `}</style>
    </div>
  );
}

export default History;
