import React, { useState } from 'react';
import { Upload, FileText, Plus, X, Brain } from 'lucide-react';

function UploadDocument() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

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
      date: new Date().toLocaleDateString()
    });
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Upload Legal Document</h1>
        <p>Upload PDF or Word documents for AI analysis</p>
      </div>

      <div className="upload-section">
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
                <Plus size={48} />
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
                  <FileText size={24} />
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
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {uploadedFile && (
            <div className="upload-actions">
              <button className="analyze-btn">
                <Brain size={20} />
                Analyze with AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadDocument;