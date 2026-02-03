import React from 'react';
import { Users, Target, Award, Globe, Heart, Sparkles, Shield } from 'lucide-react';

function AboutUs() {
  const teamMembers = [
    {
      name: 'Hima Anjuri',
      role: 'AI Research Lead',
      expertise: 'Natural Language Processing, Legal Tech',
      description: 'PhD in Computer Science with 10+ years in AI research'
    },
    {
      name: 'Kiran',
      role: 'Legal Director',
      expertise: 'Corporate Law, Compliance',
      description: 'Former General Counsel with 15+ years legal experience'
    },
    {
      name: 'Ravindra',
      role: 'Lead Developer',
      expertise: 'Full-stack Development, Cloud Architecture',
      description: 'Expert in scalable web applications and AI integration'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>About LexiBridge</h1>
        <p>Transforming legal document analysis with artificial intelligence</p>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="mission-card">
          <div className="mission-header">
            <Target size={32} />
            <h2>Our Mission</h2>
          </div>
          <div className="mission-content">
            <p>
              At LexiBridge Intelligence, our mission is to democratize access to legal 
              understanding by bridging the gap between complex legal language and 
              everyday comprehension. We believe that AI-powered tools can make legal 
              documents more accessible, transparent, and understandable for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="values-section">
        <h2>Our Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <Sparkles size={24} />
            </div>
            <h3>Innovation</h3>
            <p>Continuously advancing AI technology for better legal analysis</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <Heart size={24} />
            </div>
            <h3>Accessibility</h3>
            <p>Making legal understanding available to all individuals and businesses</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <Shield size={24} />
            </div>
            <h3>Security</h3>
            <p>Ensuring the highest standards of data protection and privacy</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <Award size={24} />
            </div>
            <h3>Excellence</h3>
            <p>Maintaining 99.7% accuracy in legal document analysis</p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="team-section">
        <h2>Our Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-header">
                <Users size={24} />
                <div>
                  <h3>{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                </div>
              </div>
              <div className="team-content">
                <p className="team-expertise"><strong>Expertise:</strong> {member.expertise}</p>
                <p className="team-description">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AboutUs;