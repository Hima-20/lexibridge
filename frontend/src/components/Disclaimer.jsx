import React from 'react';
import { Shield, AlertTriangle, FileWarning, Lock, Scale } from 'lucide-react';

function Disclaimer() {
  const disclaimers = [
    {
      icon: <AlertTriangle size={24} />,
      title: 'Not Legal Advice',
      content: 'LexiBridge Intelligence provides AI-assisted analysis and insights but does not constitute legal advice. Always consult with a qualified attorney for legal decisions.'
    },
    {
      icon: <FileWarning size={24} />,
      title: 'Accuracy Disclaimer',
      content: 'While we strive for 99.7% accuracy, AI analysis may contain errors. Users should verify critical information with legal professionals.'
    },
    {
      icon: <Shield size={24} />,
      title: 'Data Privacy',
      content: 'Your documents are processed with enterprise-grade security. We do not share or sell your data to third parties.'
    },
    {
      icon: <Lock size={24} />,
      title: 'Confidentiality',
      content: 'Uploaded documents are encrypted and stored securely. You retain full ownership of your intellectual property.'
    },
    {
      icon: <Scale size={24} />,
      title: 'Terms of Service',
      content: 'By using LexiBridge, you agree to our Terms of Service. We reserve the right to update our terms as needed.'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Legal Disclaimer</h1>
        <p>Important information about using LexiBridge Intelligence</p>
      </div>

      <div className="disclaimer-content">
        {/* Important Notice Banner */}
        <div className="disclaimer-alert">
          <AlertTriangle size={32} />
          <h2>Important Notice</h2>
          <p>
            Please read this disclaimer carefully before using LexiBridge Intelligence. 
            Your use of our services constitutes acceptance of these terms.
          </p>
        </div>

        {/* Disclaimer Cards Grid */}
        <div className="disclaimer-grid">
          {disclaimers.map((disclaimer, index) => (
            <div key={index} className="disclaimer-card">
              <div className="disclaimer-icon">{disclaimer.icon}</div>
              <div className="disclaimer-text">
                <h3>{disclaimer.title}</h3>
                <p>{disclaimer.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Terms & Conditions */}
        <div className="terms-section">
          <h2>Terms & Conditions</h2>
          <div className="terms-content">
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using LexiBridge Intelligence, you acknowledge that you have read, 
              understood, and agree to be bound by these terms.
            </p>

            <h3>2. Service Description</h3>
            <p>
              LexiBridge provides AI-assisted legal document analysis. The service is designed 
              to assist with document review but does not replace professional legal counsel.
            </p>

            <h3>3. User Responsibilities</h3>
            <p>
              Users are responsible for the accuracy of information provided and must ensure 
              they have the right to upload and analyze documents through our platform.
            </p>

            <h3>4. Limitation of Liability</h3>
            <p>
              LexiBridge shall not be liable for any damages arising from the use of our 
              AI analysis or any errors in the output provided.
            </p>

            <h3>5. Modifications</h3>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the 
              service constitutes acceptance of modified terms.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-section">
          <h2>Contact Information</h2>
          <p>
            For questions about this disclaimer or our terms of service, please contact our 
            legal team at <strong>legal@lexibridge.ai</strong>
          </p>
          <p className="last-updated">
            Last updated: January 29, 2024
          </p>
        </div>
      </div>
    </div>
  );
}

export default Disclaimer;