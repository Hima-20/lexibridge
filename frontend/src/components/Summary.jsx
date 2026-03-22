import React from 'react';
import { Target, Zap, Shield, Users, BarChart, Clock } from 'lucide-react';

function Summary() {
  const stats = [
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
                <h4>AI-Powered Legal Document Summarization</h4>
                <p>Automatically analyzes uploaded PDF documents and generates structured, easy-to-understand summaries using AI.</p>
              </div>
            </div>
            <div className="feature-item">
              <Shield size={24} />
              <div>
                <h4>Interactive Question Answering</h4>
                <p>Allows users to ask questions about their documents and receive accurate, context-based AI responses.</p>
              </div>
            </div>
            <div className="feature-item">
              <Zap size={24} />
              <div>
                <h4>Secure Document Management</h4>
                <p>Enables users to upload, store, and manage documents securely with authentication and personalized access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;