import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Shield, Zap, Brain, Clock, Plus, ChevronRight } from 'lucide-react';

function Homepage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file) => {
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit');
      return;
    }
    
    setUploadedFile({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.type.split('/').pop().toUpperCase(),
      date: new Date().toLocaleDateString(),
      file: file  // Store the actual file object
    });
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!uploadedFile || !uploadedFile.file) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      // Upload the file to backend
      const uploadResponse = await fetch('https://lexibridge-guax.onrender.com/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      // console.log(uploadData)
      // Navigate to analysis page with the document ID
      localStorage.setItem('documentId', uploadData.documentId)
      navigate('/analysis');
      
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const features = [
    {
      icon: <Brain size={20} />,
      title: 'AI-Powered Analysis',
      description: 'Advanced NLP models decode complex legal language'
    },
    {
      icon: <Shield size={20} />,
      title: 'Risk Assessment',
      description: 'Identify potential risks and compliance issues'
    },
    {
      icon: <FileText size={20} />,
      title: 'Smart Summarization',
      description: 'Generate concise summaries in seconds'
    },
    {
      icon: <Zap size={20} />,
      title: 'Real-time Processing',
      description: 'Analyze documents instantly'
    }
  ];

  const recentDocuments = [
    { name: 'NDA Agreement.pdf', date: 'Today, 10:30 AM', pages: 8 },
    { name: 'Employment Contract.docx', date: 'Yesterday, 14:45', pages: 15 },
    { name: 'Lease Agreement.pdf', date: 'Nov 12, 2024', pages: 12 },
  ];

  return (
    <>
      {/* Simplified Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>AI-Powered Legal Intelligence</span>
          </div>
          
          <h1 className="hero-title">
            Transform Legal Documents
            <span className="accent-text"> with AI Precision</span>
          </h1>
          
          <p className="hero-description">
            Upload legal documents and receive instant AI-powered analysis, 
            risk assessment, and plain-language explanations.
          </p>
        </div>
      </section>

      {/* Upload Section - Main Focus */}
      <section className="upload-section">
        <div className="upload-container">
          <div 
            className={`upload-card ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploadedFile && document.getElementById('file-upload').click()}
          >
            <div className="upload-center">
              <div className="upload-icon">
                <Plus size={40} />
              </div>
              
              <div className="upload-text">
                <h2>Upload your legal document</h2>
                <p>PDF or Word documents supported</p>
              </div>
              
              <input 
                type="file" 
                id="file-upload"
                className="file-input"
                onChange={handleFileInput}
                accept=".pdf,.docx,.doc"
              />
              
              {!uploadedFile ? (
                <div className="upload-instructions">
                  <p>Drag & drop files here or click to browse</p>
                  <p className="upload-note">Maximum file size: 25MB</p>
                </div>
              ) : (
                <div className="uploaded-file-info">
                  <FileText size={20} />
                  <div className="file-details">
                    <h3>{uploadedFile.name}</h3>
                    <p>{uploadedFile.size} MB • {uploadedFile.type} • {uploadedFile.date}</p>
                  </div>
                  <button 
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {uploadedFile && (
            <div className="upload-actions">
              <button 
                className="analyze-btn"
                onClick={handleUploadAndAnalyze}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="spinner"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Brain size={18} />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          )}
          
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2>Advanced Legal AI Features</h2>
            <p>Professional tools designed for legal excellence</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
  
        </div>
      </section>

      {/* Recent Documents */}
      <section className="recent-section">
        <div className="recent-container">
          <div className="section-header">
            <h2>Recent Documents</h2>
            <Link to="/history" className="view-all">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="documents-list">
            {recentDocuments.map((doc, index) => (
              <div key={index} className="document-item">
                <div className="document-icon">
                  <FileText size={18} />
                </div>
                <div className="document-details">
                  <h4>{doc.name}</h4>
                  <div className="document-meta">
                    <Clock size={12} />
                    <span>{doc.date}</span>
                    <span className="document-pages">{doc.pages} pages</span>
                  </div>
                </div>
                <button className="view-btn" onClick={() => navigate('/upload')}>
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Homepage;