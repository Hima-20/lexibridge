import React from 'react';
import { Cpu, Code, Database, Shield, Cloud, CpuIcon } from 'lucide-react';

function TechStack() {
  const technologies = [
    {
      category: 'Frontend',
      icon: <Code size={24} />,
      tech: ['React.js', 'Tailwind CSS', 'React Router', 'Axios/Fetch API', 'Lucide React Icons']
    },
    {
      category: 'Backend',
      icon: <Cpu size={24} />,
      tech: ['Python', 'FastAPI', 'Uvicorn']
    },
    {
      category: 'Database',
      icon: <Database size={24} />,
      tech: ['MongoDB', 'PyMongo']
    },
    {
      category: 'AI Integration',
      icon: <CpuIcon size={24} />,
      tech: ['Groq API', 'LLM Model']
    },
    {
      category: 'Document Processing',
      icon: <Document size={24} />,
      tech: ['PyMuPDF', 'tempfile', 'shutil']
    },
    {
      category: 'Authentication & Security',
      icon: <Shield size={24} />,
      tech: ['JWT Authentication', 'bcrypt', 'HTTPBearer']
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Technology Stack</h1>
        <p>Modern technologies powering LexiBridge Intelligence</p>
      </div>

      {/* Tech Stack Grid */}
      <div className="tech-grid">
        {technologies.map((category, index) => (
          <div key={index} className="tech-card">
            <div className="tech-header">
              <div className="tech-icon">{category.icon}</div>
              <h3>{category.category}</h3>
            </div>
            <ul className="tech-list">
              {category.tech.map((item, idx) => (
                <li key={idx} className="tech-item">
                  <span className="tech-bullet">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Architecture Section */}
      <div className="architecture-section">
        <h2>System Architecture</h2>
        <div className="architecture-diagram">
          <div className="arch-layer">
            <h4>Presentation Layer</h4>
            <p>React.js frontend with Tailwind CSS for responsive design</p>
          </div>
          <div className="arch-layer">
            <h4>Application Layer</h4>
            <p>FastAPI backend built with Python for APIs and business logic</p>
          </div>
          <div className="arch-layer">
            <h4>Authentication Layer</h4>
            <p>Handles user authentication using JWT tokens, bcrypt password hashing, and FastAPI security mechanisms.</p>
          </div>
          <div className="arch-layer">
            <h4>AI Processing Layer</h4>
            <p>Groq API & PyMuPDF for AI-driven document analysis </p>
          </div>
          <div className="arch-layer">
            <h4>Data Layer</h4>
            <p>MongoDB database in the cloud for storing user data & documents</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechStack;