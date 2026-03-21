import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FileText, Calendar, Clock, Eye, Trash2, FileSearch, AlertCircle, Loader2 } from 'lucide-react';

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
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://lexibridge-guax.onrender.com/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`Failed to load documents (${response.status})`);
      }

      const data = await response.json();
      // Backend returns { success: true, documents: [...] }
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
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: { label: 'Analyzed', cls: 'status-analyzed' },
      pending:   { label: 'Pending',  cls: 'status-pending'  },
      analyzing: { label: 'Analyzing',cls: 'status-pending'  },
      error:     { label: 'Error',    cls: 'status-error'    }
    };
    const s = map[(status || '').toLowerCase()] || { label: 'Pending', cls: 'status-pending' };
    return <span className={`history-status-badge ${s.cls}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-loading">
          <Loader2 className="history-spinner" size={40} />
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="history-error-state">
          <AlertCircle size={48} />
          <h2>Failed to Load History</h2>
          <p>{error}</p>
          <button className="history-retry-btn" onClick={fetchDocuments}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1>Document History</h1>
          <p>View and manage your previously analyzed documents</p>
        </div>
        <button className="history-upload-btn" onClick={() => navigate('/upload')}>
          + Upload New Document
        </button>
      </div>

      {/* Stats */}
      <div className="history-stats">
        <div className="history-stat-card">
          <FileText size={22} />
          <div>
            <span className="history-stat-value">{documents.length}</span>
            <span className="history-stat-label">Total Documents</span>
          </div>
        </div>
        <div className="history-stat-card">
          <FileSearch size={22} />
          <div>
            <span className="history-stat-value">
              {documents.filter(d => d.analysisStatus === 'completed').length}
            </span>
            <span className="history-stat-label">Analyzed</span>
          </div>
        </div>
        <div className="history-stat-card">
          <Clock size={22} />
          <div>
            <span className="history-stat-value">
              {documents.filter(d => d.analysisStatus === 'pending').length}
            </span>
            <span className="history-stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Table / Empty state */}
      {documents.length === 0 ? (
        <div className="history-empty">
          <FileText size={52} />
          <h3>No documents yet</h3>
          <p>Upload your first document to get started with AI analysis</p>
          <button className="history-upload-btn" onClick={() => navigate('/upload')}>
            Upload Document
          </button>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
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
                    <div className="history-doc-cell">
                      <div className="history-doc-icon">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="history-doc-name">
                          {doc.documentName || doc.originalFilename || 'Document'}
                        </div>
                        <div className="history-doc-meta">PDF</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="history-date-cell">
                      <span className="history-date">
                        <Calendar size={13} />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <span className="history-time">
                        <Clock size={13} />
                        {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="history-size">
                      {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}
                    </span>
                  </td>
                  <td>{getStatusBadge(doc.analysisStatus)}</td>
                  <td>
                    <div className="history-actions">
                      <button
                        className="history-action-btn view"
                        title="View Analysis"
                        onClick={() => {
                          localStorage.setItem('documentId', doc.id);
                          navigate('/analysis');
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="history-action-btn delete"
                        title="Delete"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 size={16} />
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
        .history-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .history-loading, .history-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          min-height: 300px;
          color: #64748b;
        }
        .history-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .history-error-state h2 { color: #1e293b; margin: 0; }
        .history-retry-btn {
          margin-top: .5rem;
          padding: .6rem 1.4rem;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: .9rem;
        }
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .history-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 .25rem;
        }
        .history-header p { color: #64748b; margin: 0; }
        .history-upload-btn {
          padding: .65rem 1.4rem;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-size: .9rem;
          transition: background .2s;
        }
        .history-upload-btn:hover { background: #2563eb; }
        .history-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .history-stat-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.1rem 1.4rem;
          display: flex;
          align-items: center;
          gap: .9rem;
          color: #3b82f6;
          box-shadow: 0 1px 3px rgba(0,0,0,.06);
        }
        .history-stat-card div { display: flex; flex-direction: column; }
        .history-stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
        .history-stat-label { font-size: .8rem; color: #64748b; }
        .history-empty {
          text-align: center;
          padding: 4rem 1rem;
          color: #94a3b8;
          background: #fff;
          border-radius: 16px;
          border: 1px dashed #cbd5e1;
        }
        .history-empty h3 { color: #1e293b; margin: 1rem 0 .5rem; font-size: 1.2rem; }
        .history-empty p { margin-bottom: 1.5rem; }
        .history-table-wrapper {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
        }
        .history-table { width: 100%; border-collapse: collapse; }
        .history-table thead { background: #f8fafc; }
        .history-table th {
          padding: .9rem 1.2rem;
          text-align: left;
          font-size: .78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .history-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background .15s;
        }
        .history-table tbody tr:last-child { border-bottom: none; }
        .history-table tbody tr:hover { background: #f8fafc; }
        .history-table td { padding: 1rem 1.2rem; vertical-align: middle; }
        .history-doc-cell { display: flex; align-items: center; gap: .85rem; }
        .history-doc-icon {
          width: 38px; height: 38px;
          background: #eff6ff;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #3b82f6; flex-shrink: 0;
        }
        .history-doc-name { font-weight: 600; color: #0f172a; font-size: .9rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .history-doc-meta { font-size: .75rem; color: #94a3b8; margin-top: 2px; }
        .history-date-cell { display: flex; flex-direction: column; gap: 3px; }
        .history-date, .history-time {
          display: flex; align-items: center; gap: 5px;
          font-size: .82rem; color: #64748b;
        }
        .history-size { font-size: .85rem; color: #475569; background: #f1f5f9; padding: 3px 10px; border-radius: 6px; }
        .history-status-badge {
          display: inline-flex; align-items: center;
          padding: .3rem .75rem;
          border-radius: 20px;
          font-size: .78rem;
          font-weight: 600;
        }
        .status-analyzed { background: #dcfce7; color: #166534; }
        .status-pending  { background: #fef9c3; color: #854d0e; }
        .status-error    { background: #fee2e2; color: #991b1b; }
        .history-actions { display: flex; gap: .5rem; }
        .history-action-btn {
          width: 34px; height: 34px;
          border: none; border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .history-action-btn.view { background: #eff6ff; color: #3b82f6; }
        .history-action-btn.view:hover { background: #dbeafe; }
        .history-action-btn.delete { background: #fef2f2; color: #ef4444; }
        .history-action-btn.delete:hover { background: #fee2e2; }
        @media (max-width: 640px) {
          .history-table th:nth-child(3),
          .history-table td:nth-child(3) { display: none; }
        }
      `}</style>
    </div>
  );
}

export default History;
