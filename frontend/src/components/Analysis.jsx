import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  Brain, FileText, AlertCircle, Loader2, Shield, Clock, 
  Copy, Check, ChevronRight, FileSearch, BarChart3, 
  AlertTriangle, CheckCircle, XCircle 
} from 'lucide-react';
import axios from 'axios'

function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  // const { documentId } = useParams();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');

  const documentId = localStorage.getItem('documentId')
  console.log(documentId)
  useEffect(() => {
    if (documentId) {
      fetchDocumentAndAnalyze();
    } else {
      setError('No document specified');
      setIsLoading(false);
    }
  }, []);

  const fetchDocumentAndAnalyze = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = getToken();
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch document info
      const docResponse = await fetch(`http://localhost:8000/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!docResponse.ok) {
        if (docResponse.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch document: ${docResponse.status}`);
      }

      const docData = await docResponse.json();
      setDocumentInfo(docData);
      
      // Now analyze with a default question for summary
      await askAI('Analyze this legal document and provide a comprehensive summary including: key points, potential risks, important clauses, and recommendations. Format the response with clear sections.', true);
      
    } catch (error) {
      setError(`Failed to load document: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const askAI = async (question, isInitial = false) => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    setError('');
    
    try {
      const token = getToken();
      
      if (!token) {
        navigate('/login');
        return;
      }

     const formData = new FormData();
formData.append("question", question);

if (documentId) {
  formData.append("documentId", documentId);
}

const response = await axios.post(
  "http://localhost:8000/ask-ai",
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    }
  }
);

console.log(response.data)
setAiResponse(response.data.aiResponse);
      if (response.status !== 200) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        //const errorData = await response.json();
        throw new Error( 'Analysis failed');
      }

     // const data = await response.json();
      //setAiResponse(response.data.aiResponse);
      
      // If this is the initial analysis, extract summary
      if (isInitial) {
        extractSummary(response.data.aiResponse);
      }
      
      // Add question to history if it's new
      if (!isInitial) {
        setQuestions(prev => [...prev, { 
          question, 
          response: response.data.aiResponse,
          timestamp: new Date().toLocaleTimeString() 
        }]);
      }
      
      // Clear input if it was a user question
      if (userQuestion && !isInitial) {
        setUserQuestion(''); 
      }
      
    } catch (error) {
      console.log(error)
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  const extractSummary = (response) => {
    // Simple extraction of summary from AI response
    const lines = response.split('\n');
    const summaryLines = lines.filter(line => 
      line.toLowerCase().includes('summary') || 
      line.includes('**') ||
      line.includes('•') ||
      line.includes('-')
    );
    
    if (summaryLines.length > 0) {
      setSummary({
        keyPoints: extractSection(response, ['key points', 'main points', 'important points']),
        risks: extractSection(response, ['risks', 'risk', 'potential issues']),
        recommendations: extractSection(response, ['recommendations', 'suggestions', 'advice']),
        clauses: extractSection(response, ['clauses', 'clause', 'terms'])
      });
    }
  };

  const extractSection = (text, keywords) => {
    const lines = text.split('\n');
    const sectionLines = [];
    let foundSection = false;
    
    for (let line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        foundSection = true;
        continue;
      }
      if (foundSection && (line.includes('**') || line.includes('•') || line.includes('-'))) {
        sectionLines.push(line.trim());
      } else if (foundSection && line.trim() === '') {
        break;
      }
    }
    
    return sectionLines.length > 0 ? sectionLines : ['No specific information found'];
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const suggestedQuestions = [
    "What are the key obligations for each party?",
    "Identify any termination clauses and their conditions",
    "Are there any liability limitations or indemnities?",
    "What are the payment terms and conditions?",
    "Are there any confidentiality requirements?",
    "What dispute resolution mechanisms are included?"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Analyzing your document with AI...</h2>
          <p className="mt-2 text-gray-600">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Analysis Failed</h2>
          <p className="mt-2 text-gray-700">{error}</p>
          <button 
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 p-4 bg-white rounded-lg shadow">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">AI Document Analysis</h1>
            {documentInfo && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{documentInfo.document_name || documentInfo.filename}</span>
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(documentInfo.created_at || documentInfo.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <div>
            <button 
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/history')}
            >
              View History
            </button>
          </div>
        </div>

        <div className="flex space-x-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button 
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('summary')}
          >
            <FileSearch className="h-4 w-4 mr-2" />
            Document Summary
          </button>
          <button 
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'analysis' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('analysis')}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Analysis
          </button>
          <button 
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'qa' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('qa')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Q&A Session
          </button>
        </div>

        {activeTab === 'summary' && summary && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Key Points</h3>
                </div>
                <div className="space-y-2">
                  {summary.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Potential Risks</h3>
                </div>
                <div className="space-y-2">
                  {summary.risks.map((risk, index) => (
                    <div key={index} className="flex items-start">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Important Clauses</h3>
                </div>
                <div className="space-y-2">
                  {summary.clauses.map((clause, index) => (
                    <div key={index} className="flex items-start">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{clause}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <Brain className="h-5 w-5 text-purple-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {summary.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <ChevronRight className="h-3 w-3 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Suggested Questions</h3>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => askAI(q)}
                      disabled={isAsking}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {questions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Questions</h3>
                  <div className="space-y-3">
                    {questions.slice(-3).reverse().map((item, index) => (
                      <div key={index} className="border-l-2 border-blue-500 pl-3">
                        <p className="text-sm text-gray-800">{item.question}</p>
                        <span className="text-xs text-gray-500 mt-1 block">{item.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow mb-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className="font-semibold text-gray-900">AI Analysis</h2>
                  </div>
                  <button 
                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => handleCopy(aiResponse)}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                
                <div className="p-4">
                  {aiResponse ? (
                    <div className="prose max-w-none">
                      {aiResponse.split('\n').map((line, index) => (
                        <p key={index} className="mb-2 text-gray-700">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Ask a question to get AI analysis of your document</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Ask a specific question about this document..."
                    onKeyPress={(e) => e.key === 'Enter' && askAI(userQuestion)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    onClick={() => askAI(userQuestion)}
                    disabled={isAsking || !userQuestion.trim()}
                  >
                    {isAsking ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      'Ask AI'
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Press Enter or click Ask AI to get instant analysis</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qa' && questions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Question & Answer History</h3>
            <div className="space-y-4">
              {questions.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-blue-600">Q:</strong>
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                    </div>
                    <p className="text-gray-800">{item.question}</p>
                  </div>
                  <div>
                    <strong className="text-green-600">A:</strong>
                    <p className="text-gray-700 mt-1">{item.response}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analysis;