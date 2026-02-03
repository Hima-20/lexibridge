import React from 'react';
import { FileText, Calendar, Clock, Eye, Download, Trash2, FileSearch, Shield, AlertCircle } from 'lucide-react';

function History() {
  const documents = [
    {
      id: 1,
      name: 'NDA Agreement.pdf',
      date: '2024-01-29',
      time: '10:30 AM',
      size: '2.4 MB',
      status: 'Analyzed',
      riskLevel: 'Low',
      pages: 8,
      type: 'PDF'
    },
    {
      id: 2,
      name: 'Employment Contract.docx',
      date: '2024-01-28',
      time: '2:45 PM',
      size: '3.1 MB',
      status: 'Reviewed',
      riskLevel: 'Medium',
      pages: 15,
      type: 'DOCX'
    },
    {
      id: 3,
      name: 'Lease Agreement.pdf',
      date: '2024-01-27',
      time: '9:15 AM',
      size: '1.8 MB',
      status: 'Analyzed',
      riskLevel: 'Low',
      pages: 12,
      type: 'PDF'
    },
    {
      id: 4,
      name: 'Service Agreement.pdf',
      date: '2024-01-26',
      time: '4:20 PM',
      size: '2.9 MB',
      status: 'Pending',
      riskLevel: 'High',
      pages: 10,
      type: 'PDF'
    }
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Analyzed': return <FileSearch size={16} />;
      case 'Reviewed': return <Shield size={16} />;
      case 'Pending': return <Clock size={16} />;
      default: return <FileSearch size={16} />;
    }
  };

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
              <h3>3</h3>
              <p>Analyzed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>1</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>12.2 MB</h3>
              <p>Total Size</p>
            </div>
          </div>
        </div>

        <div className="documents-table-container">
          <div className="table-header-section">
            <h2>All Documents</h2>
            <div className="table-controls">
              <div className="search-box">
                <input type="text" placeholder="Search documents..." />
              </div>
              <button className="filter-btn">
                Filter
              </button>
            </div>
          </div>

          <div className="documents-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">Document Name</div>
                <div className="table-cell">Date & Time</div>
                <div className="table-cell">Size</div>
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
                      <div className={`file-icon ${doc.type.toLowerCase()}`}>
                        <FileText size={20} />
                      </div>
                      <div className="document-details">
                        <h4>{doc.name}</h4>
                        <div className="document-meta">
                          <span className="file-type">{doc.type}</span>
                          <span>•</span>
                          <span>{doc.pages} pages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="date-time">
                      <div className="date">
                        <Calendar size={14} />
                        <span>{doc.date}</span>
                      </div>
                      <div className="time">
                        <Clock size={14} />
                        <span>{doc.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="size-badge">{doc.size}</span>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${doc.status.toLowerCase()}`}>
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className={`risk-badge ${doc.riskLevel.toLowerCase()}`}>
                      {doc.riskLevel}
                    </span>
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button className="action-btn view" title="View">
                        <Eye size={18} />
                      </button>
                      <button className="action-btn download" title="Download">
                        <Download size={18} />
                      </button>
                      <button className="action-btn delete" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;