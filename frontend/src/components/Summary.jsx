import React from 'react';
import { Target, Zap, Shield, Users, BarChart, Clock } from 'lucide-react';

function Summary() {
  const stats = [
    { icon: <Zap size={24} />, value: '10,000+', label: 'Documents Analyzed' },
    { icon: <Clock size={24} />, value: '99.7%', label: 'Accuracy Rate' },
    { icon: <Shield size={24} />, value: '50+', label: 'Risk Categories' },
    { icon: <Users size={24} />, value: '24/7', label: 'AI Assistance' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Project Summary</h1>
        <p>AI-powered legal document interpretation system</p>
      </div>

      <div className="summary-content">
        <div className="overview-card">
          <div className="overview-header">
            <Target size={32} />
            <h2>Project Overview</h2>
          </div>
          <div className="overview-content">
            <p>
              LexiBridge Intelligence is an advanced AI-assisted legal document interpretation 
              system designed to transform complex legal language into clear, actionable insights. 
              Our platform leverages cutting-edge natural language processing and machine learning 
              technologies to provide instant analysis, risk assessment, and plain-language 
              explanations of legal documents.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="features-section">
          <h2>Core Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <BarChart size={24} />
              <div>
                <h4>AI-Powered Analysis</h4>
                <p>Advanced NLP models analyze legal documents with human-like understanding</p>
              </div>
            </div>
            <div className="feature-item">
              <Shield size={24} />
              <div>
                <h4>Risk Assessment</h4>
                <p>Identify potential risks, loopholes, and compliance issues automatically</p>
              </div>
            </div>
            <div className="feature-item">
              <Zap size={24} />
              <div>
                <h4>Real-time Processing</h4>
                <p>Analyze documents in seconds with our optimized AI infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;