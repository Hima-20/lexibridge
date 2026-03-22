import React from 'react';
import { Users, Target, Award, Globe, Heart, Sparkles, Shield } from 'lucide-react';

function AboutUs() {
  const teamMembers = [
    {
      name: 'Hima Anjuri',
      role: 'Team Lead',
      description: '22A21A05A2'
    },
    {
      name: 'Kiran Babu',
      role: 'Team Member',
      description: '23A25A0513'
    },
    {
      name: 'Ravindra Sai',
      role: 'Team Member',
      description: '22A21A05C5'
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
            <p>We leverage cutting-edge AI technologies to continuously improve how legal documents are analyzed and interpreted.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <Heart size={24} />
            </div>
            <h3>Accessibility</h3>
            <p>We simplify complex legal documents so that anyone can understand them easily, without requiring legal expertise.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <Shield size={24} />
            </div>
            <h3>Security</h3>
            <p>User data and documents are handled with strict security measures, ensuring confidentiality and safe processing.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <Award size={24} />
            </div>
            <h3>Accuracy</h3>
            <p>We focus on delivering precise and reliable AI-generated insights to ensure users can trust the information provided.</p>
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