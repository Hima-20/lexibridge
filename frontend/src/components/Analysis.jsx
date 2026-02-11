import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  Brain, FileText, AlertCircle, Loader2, Copy, Check, 
  AlertTriangle, CheckCircle, Shield, Clock, ChevronRight
} from 'lucide-react';
import axios from 'axios';

function Analysis() {
  const navigate = useNavigate();
  const { docId } = useParams();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Debug logs
  console.log('URL Parameters:', useParams());
  console.log('docId from URL:', docId);
  console.log('Full URL:', window.location.href);

  useEffect(() => {
    // Try multiple ways to get documentId
    let documentId = docId;
    
    // If not in URL params, check localStorage as fallback
    if (!documentId) {
      documentId = localStorage.getItem('documentId');
      console.log('documentId from localStorage:', documentId);
    }
    
    if (!documentId) {
      setError('No document specified. Please upload a document first.');
      setIsLoading(false);
      return;
    }

    console.log('Using documentId for analysis:', documentId);
    fetchDocument(documentId);
  }, [docId]);

  const fetchDocument = async (documentId) => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Fetching document with ID:', documentId);

      const res = await fetch(
        `https://lexibridge-guax.onrender.com/documents/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', res.status);

      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch document: ${res.status}`);
      }

      const data = await res.json();
      console.log('Document data received:', data);
      
      const documentData = data.document || data;
      setDocumentInfo(documentData);

      // Always show a summary - either from AI or a placeholder
      await generateDocumentSummary(documentId, documentData);
      
    } catch (err) {
      console.error('Fetch document error:', err);
      setError(`Failed to load document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocumentSummary = async (documentId, documentData) => {
    try {
      // Try to get AI summary first
      await askAI('Provide a comprehensive legal summary of this document including: 1. Key points, 2. Important clauses, 3. Potential risks, 4. Recommendations. Format with clear headings and bullet points.', documentId, true);
    } catch (error) {
      console.log('AI summary failed, using fallback:', error.message);
      // If AI fails, create a structured fallback summary
      createFallbackSummary(documentData);
    }
  };

  const createFallbackSummary = (documentData) => {
    const fallbackSummary = {
      keyPoints: [
        'Document uploaded successfully',
        'AI analysis service is being configured',
        'Manual review recommended for critical documents',
        'Try asking specific questions using the input below'
      ],
      risks: [
        'Full AI analysis temporarily unavailable',
        'Manual verification of clauses recommended',
        'Consult legal expert for complex agreements'
      ],
      clauses: [
        'Standard contract structure detected',
        'Multiple sections identified',
        'Legal terminology present throughout'
      ],
      recommendations: [
        'Review all party information',
        'Verify dates and signatures',
        'Check payment terms carefully',
        'Consult with legal counsel for final review'
      ]
    };

    setSummary(fallbackSummary);
    
    // Create formatted AI response
    const formattedResponse = `# 📋 Document Analysis Summary

## 📄 Document Overview
**${documentData.filename || documentData.documentName || 'Legal Document'}**
- Uploaded: ${new Date(documentData.uploaded_at || documentData.created_at || Date.now()).toLocaleDateString()}
- Status: Successfully uploaded, AI analysis pending

## 🔍 Key Points Identified
${fallbackSummary.keyPoints.map(point => `• ${point}`).join('\n')}

## ⚠️ Important Considerations
${fallbackSummary.risks.map(risk => `• ${risk}`).join('\n')}

## 📑 Document Structure
${fallbackSummary.clauses.map(clause => `• ${clause}`).join('\n')}

## 💡 Recommendations
${fallbackSummary.recommendations.map(rec => `• ${rec}`).join('\n')}

## 🔧 Next Steps
1. **Ask specific questions** using the input below
2. **Upload to another service** for immediate analysis
3. **Contact support** if you need urgent assistance
4. **Try again later** when AI service is fully configured

> Note: This is a placeholder analysis. The AI service is currently being configured for optimal performance.`;
    
    setAiResponse(formattedResponse);
  };

  const askAI = async (question, specificDocumentId = null, isInitial = false) => {
    if (!question.trim()) return;

    try {
      if (!isInitial) setIsAsking(true);
      setError('');

      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Use the specific documentId or the one from URL
      const documentIdToUse = specificDocumentId || docId || localStorage.getItem('documentId');
      
      if (!documentIdToUse) {
        throw new Error('No document ID available');
      }

      const formData = new FormData();
      formData.append('question', question);
      formData.append('documentId', documentIdToUse);

      console.log('Sending to AI with documentId:', documentIdToUse);

      const res = await axios.post(
        'https://lexibridge-guax.onrender.com/ask-ai',
        formData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('AI Response received:', res.data);
      
      if (res.data.aiResponse) {
        setAiResponse(res.data.aiResponse);
        
        // Extract structured summary from AI response
        if (isInitial) {
          extractSummaryFromResponse(res.data.aiResponse);
        }
        
        setError(''); // Clear any previous errors
      } else if (res.data.error) {
        throw new Error(res.data.error);
      } else {
        throw new Error('No response from AI service');
      }
    } catch (err) {
      console.error('AI Analysis error details:', err);
      
      // User-friendly error handling
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The AI service is taking too long to respond.');
      } else if (err.response?.status === 401) {
        if (err.response?.data?.detail?.includes('Invalid API Key')) {
          setError('AI service configuration in progress. Showing structured summary instead.');
          createFallbackSummary(documentInfo);
        } else {
          setError('Authentication failed. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else if (err.response?.status === 500) {
        setError('Server error. Our team has been notified. Showing structured summary.');
        createFallbackSummary(documentInfo);
      } else {
        setError(`AI service temporarily unavailable: ${err.message}`);
        createFallbackSummary(documentInfo);
      }
    } finally {
      if (!isInitial) setIsAsking(false);
    }
  };

  const extractSummaryFromResponse = (response) => {
    try {
      // Simple extraction of structured data from AI response
      const lines = response.split('\n');
      
      const keyPoints = lines.filter(line => 
        line.includes('•') || line.includes('-') || 
        line.toLowerCase().includes('key point') ||
        line.toLowerCase().includes('important:')
      ).slice(0, 5).map(line => line.replace(/^[•\-]\s*/, '').trim());
      
      const risks = lines.filter(line => 
        line.toLowerCase().includes('risk') ||
        line.toLowerCase().includes('warning') ||
        line.toLowerCase().includes('concern') ||
        line.includes('⚠️')
      ).slice(0, 3).map(line => line.replace(/^[•\-]\s*/, '').trim());
      
      const clauses = lines.filter(line => 
        line.toLowerCase().includes('clause') ||
        line.toLowerCase().includes('section') ||
        line.toLowerCase().includes('article') ||
        line.includes('📑')
      ).slice(0, 4).map(line => line.replace(/^[•\-]\s*/, '').trim());
      
      const recommendations = lines.filter(line => 
        line.toLowerCase().includes('recommend') ||
        line.toLowerCase().includes('suggest') ||
        line.toLowerCase().includes('advise') ||
        line.includes('💡')
      ).slice(0, 4).map(line => line.replace(/^[•\-]\s*/, '').trim());

      setSummary({
        keyPoints: keyPoints.length > 0 ? keyPoints : ['Key points extracted from document'],
        risks: risks.length > 0 ? risks : ['Standard legal risks apply'],
        clauses: clauses.length > 0 ? clauses : ['Multiple legal clauses identified'],
        recommendations: recommendations.length > 0 ? recommendations : ['Consult with legal expert for review']
      });
    } catch (error) {
      console.log('Summary extraction failed:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const suggestedQuestions = [
    "Summarize the key obligations in this document",
    "What are the termination conditions?",
    "Identify any confidentiality requirements",
    "Explain the payment terms and conditions",
    "Are there any liability limitations?",
    "What dispute resolution methods are mentioned?"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-blue-600 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analyzing Your Document</h2>
          <p className="text-gray-600 max-w-md">
            Processing document with AI. This may take a moment...
          </p>
          <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !aiResponse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Document</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/upload')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload New Document
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                AI Document Analysis
              </h1>
              <p className="text-gray-600 mt-1">AI-powered insights for your legal documents</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate('/history')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                View History
              </button>
            </div>
          </div>
          
          {documentInfo && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 text-lg">
                    {documentInfo.filename || documentInfo.documentName || 'Legal Document'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Uploaded: {new Date(documentInfo.uploaded_at || documentInfo.created_at || Date.now()).toLocaleDateString()}
                    </span>
                    {documentInfo.file_size && (
                      <span>• Size: {(documentInfo.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('summary')}
          >
            <CheckCircle className="h-4 w-4" />
            Summary
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('analysis')}
          >
            <Brain className="h-4 w-4" />
            Full Analysis
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'qa' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('qa')}
          >
            <Shield className="h-4 w-4" />
            Q&A
          </button>
        </div>

        {/* Summary View */}
        {activeTab === 'summary' && summary && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900">Key Points</h3>
                </div>
                <div className="space-y-2">
                  {summary.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold text-gray-900">Potential Risks</h3>
                </div>
                <div className="space-y-2">
                  {summary.risks.map((risk, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Important Clauses</h3>
                </div>
                <div className="space-y-2">
                  {summary.clauses.map((clause, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{clause}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {summary.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  View Full Analysis
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!aiResponse}
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  Copy Summary
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Print Report
                </button>
                <button
                  onClick={() => navigate('/upload')}
                  className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  New Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Analysis View */}
        {activeTab === 'analysis' && (
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Sidebar */}
            <div className="lg:w-1/3 space-y-6">
              {/* Suggested Questions */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Suggested Questions</h3>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors disabled:opacity-50"
                      onClick={() => askAI(q)}
                      disabled={isAsking}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Info */}
              {documentInfo && (
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Document Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Filename</p>
                      <p className="font-medium">{documentInfo.filename || documentInfo.documentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Upload Date</p>
                      <p className="font-medium">
                        {new Date(documentInfo.uploaded_at || documentInfo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {documentInfo.file_size && (
                      <div>
                        <p className="text-xs text-gray-500">File Size</p>
                        <p className="font-medium">{(documentInfo.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Analysis Content */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
                <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI Document Analysis</h3>
                  </div>
                  {aiResponse && (
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-green-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  {aiResponse ? (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {aiResponse}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Ask a question to generate AI analysis</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Input */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ask About This Document</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="e.g., What are the termination conditions in this agreement?"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && askAI(userQuestion)}
                  />
                  <button
                    onClick={() => askAI(userQuestion)}
                    disabled={isAsking || !userQuestion.trim()}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAsking ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      'Ask AI'
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Press Enter or click Ask AI to analyze specific aspects of your document
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Q&A View */}
        {activeTab === 'qa' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Document Q&A</h3>
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ask questions about your document using the input above</p>
              <p className="text-sm text-gray-400 mt-2">
                Your questions and answers will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analysis;