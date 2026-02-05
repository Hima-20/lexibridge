import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FileText, Calendar, Clock, Eye, Download, Trash2, FileSearch, Shield, AlertCircle, Loader2 } from 'lucide-react';

function History() {
  const navigate = useNavigate();
  const { apiRequest, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, [isAuthenticated, navigate]);

  const fetchDocuments = async () => {
    try {
      const response = await apiRequest('https://lexibridge-guax.onrender.com/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      setError('Failed to load documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (documentId) => {
    navigate(`/analysis?documentId=${documentId}`);
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await apiRequest(`https://lexibridge-guax.onrender.com/documents/${documentId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiRequest(`https://lexibridge-guax.onrender.com/documents/${documentId}`, {
        method: 'DELETE',
      });
      // Remove from local state
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'processed': { label: 'Analyzed', className: 'analyzed' },
      'pending': { label: 'Pending', className: 'pending' },
      'processing': { label: 'Processing', className: 'pending' },
      'error': { label: 'Error', className: 'error' }
    };

    const statusInfo = statusMap[status?.toLowerCase()] || { label: 'Unknown', className: 'pending' };
    
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label === 'Analyzed' ? <FileSearch size={16} /> : 
         statusInfo.label === 'Pending' ? <Clock size={16} /> : 
         <AlertCircle size={16} />}
        {statusInfo.label}
      </span>
    );
  };

  const getRiskLevel = () => {
    // This should come from your backend analysis
    const levels = ['Low', 'Medium', 'High'];
    return levels[Math.floor(Math.random() * levels.length)];
  };

  const getFileExtension = (filename) => {
    return filename?.split('.').pop().toUpperCase() || 'PDF';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Loader2 className="animate-spin" size={48} />
          <h2>Loading documents...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Failed to Load History</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchDocuments}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Document History</h1>
        <p>View and manage your previously analyzed documents</p>
      </div>

      <div className="history-container">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <h3>{documents.length}</h3>
              <p>Total Documents</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FileSearch size={24} />
            </div>
            <div className="stat-content">
              <h3>{documents.filter(d => d.status === 'processed').length}</h3>
              <p>Analyzed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{documents.filter(d => d.status === 'pending' || d.status === 'processing').length}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{documents.filter(d => d.status === 'error').length}</h3>
              <p>Errors</p>
            </div>
          </div>
        </div>

        <div className="documents-table-container">
          <div className="table-header-section">
            <h2>All Documents ({documents.length})</h2>
            <div className="table-controls">
              <button className="btn-primary" onClick={() => navigate('/upload')}>
                Upload New Document
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No documents yet</h3>
              <p>Upload your first document to get started with AI analysis</p>
              <button className="btn-primary" onClick={() => navigate('/upload')}>
                Upload Document
              </button>
            </div>
          ) : (
            <div className="documents-table">
              <div className="table-header">
                <div className="table-row">
                  <div className="table-cell">Document Name</div>
                  <div className="table-cell">Upload Date</div>
                  <div className="table-cell">File Size</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Risk Level</div>
                  <div className="table-cell">Actions</div>
                </div>
              </div>
              
              <div className="table-body">
                {documents.map((doc) => (
                  <div key={doc.id} className="table-row">
                    <div className="table-cell">
                      <div className="document-info">
                        <div className={`file-icon ${getFileExtension(doc.filename).toLowerCase()}`}>
                          <FileText size={20} />
                        </div>
                        <div className="document-details">
                          <h4>{doc.filename || doc.documentName || 'Document'}</h4>
                          <div className="document-meta">
                            <span className="file-type">{getFileExtension(doc.filename)}</span>
                            {doc.pageCount && (
                              <>
                                <span>•</span>
                                <span>{doc.pageCount} pages</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="table-cell">
                      <div className="date-time">
                        <div className="date">
                          <Calendar size={14} />
                          <span>{new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="time">
                          <Clock size={14} />
                          <span>{new Date(doc.uploadedAt || doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className="size-badge">
                        {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                      </span>
                    </div>
                    <div className="table-cell">
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="table-cell">
                      <span className={`risk-badge ${getRiskLevel().toLowerCase()}`}>
                        {getRiskLevel()}
                      </span>
                    </div>
                    <div className="table-cell">
                      <div className="action-buttons">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => {
                            localStorage.setItem('documentId', doc.__id)
                            navigate('/analysis');
                           
                          }}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="action-btn download" 
                          title="Download"
                          onClick={() => handleDownload(doc.id, doc.filename)}
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;