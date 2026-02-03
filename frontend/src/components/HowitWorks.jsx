import React from 'react';
import { Brain, Upload, FileText, Shield, Zap, Clock, CheckCircle } from 'lucide-react';

function HowItWorks() {
  const steps = [
    {
      icon: <Upload size={24} />,
      step: 'Step 1',
      title: 'Upload Document',
      description: 'Upload your legal document in PDF or Word format. Our system supports multiple file types.',
      color: '#667eea'
    },
    {
      icon: <Brain size={24} />,
      step: 'Step 2',
      title: 'AI Processing',
      description: 'Our advanced AI models analyze the document using natural language processing.',
      color: '#764ba2'
    },
    {
      icon: <FileText size={24} />,
      step: 'Step 3',
      title: 'Document Analysis',
      description: 'Key clauses, terms, and potential risks are identified and highlighted.',
      color: '#4facfe'
    },
    {
      icon: <Shield size={24} />,
      step: 'Step 4',
      title: 'Risk Assessment',
      description: 'Get detailed risk analysis and compliance checks for your legal documents.',
      color: '#43e97b'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>How LexiBridge Works</h1>
        <p>Simple four-step process to transform your legal document review</p>
      </div>

      <div className="steps-container">
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-header">
                <div 
                  className="step-icon"
                  style={{ backgroundColor: step.color }}
                >
                  {step.icon}
                </div>
                <div className="step-number">{step.step}</div>
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-highlight">
        <div className="section-header">
          <h2>Key Features</h2>
          <p>Advanced capabilities for legal document analysis</p>
        </div>
        
        <div className="features-list">
          <div className="feature-item">
            <Zap size={20} />
            <div>
              <h4>Fast Processing</h4>
              <p>Analyze documents in seconds instead of hours</p>
            </div>
          </div>
          <div className="feature-item">
            <Shield size={20} />
            <div>
              <h4>Risk Detection</h4>
              <p>Identify potential legal risks automatically</p>
            </div>
          </div>
          <div className="feature-item">
            <Clock size={20} />
            <div>
              <h4>Time Saving</h4>
              <p>Reduce document review time by up to 80%</p>
            </div>
          </div>
          <div className="feature-item">
            <CheckCircle size={20} />
            <div>
              <h4>Accuracy</h4>
              <p>99.7% accuracy in legal term identification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;