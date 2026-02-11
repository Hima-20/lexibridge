import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Brain, Loader2, Check, AlertCircle, X, FileUp } from 'lucide-react';
import { useAuth } from './AuthContext';

function Uploaddocument() {
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
      console.log('Uploading document to server...');
      const uploadResponse = await fetch('https://lexibridge-guax.onrender.com/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload response status:', uploadResponse.status);
      
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
      console.log('Upload response data:', uploadData);
      
      // Try to get documentId from different possible response formats
      let documentId = uploadData.documentId || uploadData.id || uploadData._id || uploadData.document_id;
      
      if (!documentId) {
        console.error('No documentId found in response:', uploadData);
        throw new Error('Upload failed - no document ID received from server');
      }
      
      console.log('Document uploaded successfully. Document ID:', documentId);
      
      // Store the result with documentId
      setUploadResult({
        ...uploadData,
        documentId: documentId
      });
      setUploadSuccess(true);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!uploadResult?.documentId) {
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

      console.log('Starting AI analysis for document:', uploadResult.documentId);
      
      // Optionally call analyze endpoint if needed
      const analyzeResponse = await fetch(
        'https://lexibridge-guax.onrender.com/analyze-document',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ documentId: uploadResult.documentId })
        }
      );

      if (!analyzeResponse.ok) {
        const err = await analyzeResponse.json();
        console.warn('Analysis endpoint warning:', err.detail || 'Analysis failed');
        // Continue anyway - we can still navigate
      }

      // ✅ CRITICAL: Navigate with documentId in URL parameter
      console.log('Navigating to:', `/analysis/${uploadResult.documentId}`);
      
      // Store in localStorage as backup
      localStorage.setItem('documentId', uploadResult.documentId);
      
      // Navigate to analysis page with documentId in URL
      navigate(`/analysis/${uploadResult.documentId}`);

    } catch (error) {
      console.error('Analysis initiation error:', error);
      // Even if analysis endpoint fails, still navigate
      console.log('Navigating anyway with documentId:', uploadResult.documentId);
      localStorage.setItem('documentId', uploadResult.documentId);
      navigate(`/analysis/${uploadResult.documentId}`);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Upload Legal Document</h1>
          <p className="text-gray-600">Upload your PDF document and get instant AI-powered analysis</p>
        </div>

        {/* Main Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {uploadSuccess ? (
            /* Success State */
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
              <p className="text-gray-600 mb-8">Your document has been uploaded successfully.</p>
              
              {/* Document Details */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Document</h4>
                    <p className="text-sm text-gray-600 truncate max-w-xs">{uploadedFile.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Brain className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Status</h4>
                    <p className="text-sm font-medium text-green-600">Ready for AI Analysis</p>
                  </div>
                </div>
                
                {/* Debug Info - Can be removed in production */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                  <p className="text-xs text-blue-700 font-mono">
                    Document ID: {uploadResult?.documentId || 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      <span>Analyze with AI</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setUploadSuccess(false);
                    setUploadedFile(null);
                    setUploadResult(null);
                  }}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Upload Another
                </button>
              </div>
              
              {/* Debug Info */}
              <div className="mt-6 text-xs text-gray-500">
                <p>Click "Analyze with AI" to navigate to: /analysis/{uploadResult?.documentId || 'document-id'}</p>
              </div>
            </div>
          ) : (
            /* Upload State */
            <div className="p-8">
              {/* Drag & Drop Area */}
              <div 
                className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer mb-6 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : uploadedFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadedFile && !isUploading && document.getElementById('file-upload').click()}
              >
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    {isUploading ? (
                      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                    ) : (
                      <FileUp className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {isUploading ? 'Uploading Document...' : 'Upload your legal document'}
                  </h2>
                  <p className="text-gray-600">PDF documents only (max 25MB)</p>
                </div>
                
                <input 
                  type="file" 
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".pdf"
                  disabled={isUploading}
                />
                
                {isUploading ? (
                  /* Upload Progress */
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                  </div>
                ) : !uploadedFile ? (
                  /* No File Selected */
                  <div className="max-w-md mx-auto">
                    <div className="px-6 py-4 bg-gray-100 rounded-lg mb-3">
                      <p className="font-medium text-gray-900 mb-1">Drag & drop files here</p>
                      <p className="text-sm text-gray-600">or click to browse</p>
                    </div>
                    <p className="text-xs text-gray-500">Maximum file size: 25MB • PDF format only</p>
                  </div>
                ) : (
                  /* File Selected */
                  <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 truncate">{uploadedFile.name}</h3>
                        <p className="text-sm text-gray-600">
                          {uploadedFile.size} MB • {uploadedFile.type} • {uploadedFile.date}
                        </p>
                      </div>
                      <button 
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Error Message */}
              {uploadError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">{uploadError}</span>
                </div>
              )}
              
              {/* Upload Button */}
              {uploadedFile && !isUploading && !uploadSuccess && (
                <div className="text-center">
                  <button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Upload Document</span>
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-3">
                    Click to upload and then analyze with AI
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How it works */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileUp className="h-5 w-5 text-blue-600" />
              </div>
              How it works
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium flex-shrink-0">1</span>
                <div>
                  <strong className="text-gray-900">Upload</strong> your PDF document
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium flex-shrink-0">2</span>
                <div>
                  <strong className="text-gray-900">Click "Upload Document"</strong> to send to server
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium flex-shrink-0">3</span>
                <div>
                  <strong className="text-gray-900">Click "Analyze with AI"</strong> after successful upload
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium flex-shrink-0">4</span>
                <div>
                  <strong className="text-gray-900">View AI analysis</strong> and ask questions about your document
                </div>
              </li>
            </ol>
          </div>

          {/* What AI analyzes */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              What AI analyzes
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Document type and purpose</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Key parties and their roles</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Important clauses and obligations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Potential risks and red flags</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Payment terms and deadlines</span>
              </li>
            </ul>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Logged in as <span className="font-medium text-gray-900">{user.fullName || user.email}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Uploaddocument;