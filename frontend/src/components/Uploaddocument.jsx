import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Brain, Loader2, Check, AlertCircle, X, FileUp } from 'lucide-react';
import { useAuth } from './AuthContext';

function UploadDocument() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  
  const { getToken, user } = useAuth();
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
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit');
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported');
      return;
    }
    
    setUploadedFile({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.type.split('/').pop().toUpperCase(),
      date: new Date().toLocaleDateString(),
      file: file
    });
    setUploadError('');
    setUploadSuccess(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !uploadedFile.file) {
      setUploadError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);
    
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload the file to backend
      const uploadResponse = await fetch('https://lexibridge-guax.onrender.com/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 401) {
          localStorage.removeItem('lexibridge_user');
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Upload failed');
      }
      console.log(uploadData)
      setUploadResult(uploadData);
      setUploadSuccess(true);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!uploadResult || !uploadResult.documentId) {
      setUploadError('No document to analyze');
      return;
    }

    setIsAnalyzing(true);
    setUploadError('');
    
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Call analyze endpoint
      const analyzeResponse = await fetch('https://lexibridge-guax.onrender.com/analyze-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          documentId: uploadResult.documentId
        })
      });

      if (!analyzeResponse.ok) {
        if (analyzeResponse.status === 401) {
          localStorage.removeItem('lexibridge_user');
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const analyzeData = await analyzeResponse.json();
      
      if (!analyzeData.success) {
        throw new Error(analyzeData.message || 'Analysis failed');
      }
      
      // Navigate to analysis page with the document ID
      localStorage.setItem('documentId', uploadResult.documentId)
      navigate('/analysis');
      
    } catch (error) {
      console.error('Analysis error:', error);
      setUploadError(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    setUploadError('');
    setUploadSuccess(false);
    setUploadResult(null);
  };
console.log(up)
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Upload Legal Document</h1>
        <p>Upload your PDF document and analyze it with AI</p>
      </div>

      <div className="upload-section">
        <div className="upload-container">
          {uploadSuccess ? (
            <div className="success-container">
              <div className="success-icon">
                <Check size={64} />
              </div>
              <h2>Upload Successful!</h2>
              <p>Your document has been uploaded successfully.</p>
              
              <div className="upload-details">
                <div className="detail-item">
                  <FileText size={20} />
                  <div>
                    <h4>Document</h4>
                    <p>{uploadedFile.name}</p>
                  </div>
                </div>
                <div className="detail-item">
                  <div>
                    <h4>Status</h4>
                    <p className="status-pending">Ready for AI Analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="success-actions">
                <button 
                  className="analyze-btn"
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Brain size={20} />
                      <span>Analyze with AI</span>
                    </>
                  )}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setUploadSuccess(false)}
                >
                  Upload Another
                </button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className={`upload-card ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadedFile && document.getElementById('file-upload').click()}
              >
                <div className="upload-center">
                  <div className="upload-icon">
                    {isUploading ? (
                      <Loader2 className="animate-spin" size={48} />
                    ) : (
                      <FileUp size={48} />
                    )}
                  </div>
                  
                  <div className="upload-text">
                    <h2>Upload your legal document</h2>
                    <p>PDF documents only (max 25MB)</p>
                  </div>
                  
                  <input 
                    type="file" 
                    id="file-upload"
                    className="file-input"
                    onChange={handleFileInput}
                    accept=".pdf"
                    disabled={isUploading}
                  />
                  
                  {isUploading ? (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p>Uploading... {uploadProgress}%</p>
                    </div>
                  ) : !uploadedFile ? (
                    <div className="upload-instructions">
                      <p>Drag & drop files here or click to browse</p>
                      <p className="upload-note">Maximum file size: 25MB • PDF format only</p>
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
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {uploadError && (
                <div className="error-message">
                  <AlertCircle size={20} />
                  <span>{uploadError}</span>
                </div>
              )}
              
              {uploadedFile && !isUploading && !uploadSuccess && (
                <div className="upload-actions">
                  <button 
                    className="analyze-btn"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Upload Document</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="upload-info">
        <div className="info-card">
          <h3>How it works</h3>
          <ol>
            <li><strong>Upload</strong> your PDF document</li>
            <li><strong>Click "Analyze with AI"</strong> after upload</li>
            <li><strong>Get instant analysis</strong> with AI-powered insights</li>
            <li><strong>Ask questions</strong> about your document</li>
          </ol>
        </div>
        
        <div className="info-card">
          <h3>What AI analyzes</h3>
          <ul>
            <li>Document type and purpose</li>
            <li>Key parties and their roles</li>
            <li>Important clauses and obligations</li>
            <li>Potential risks and red flags</li>
            <li>Payment terms and deadlines</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadDocument;