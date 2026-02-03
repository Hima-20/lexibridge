import React from 'react';
import { Cpu, Code, Database, Shield, Cloud, CpuIcon } from 'lucide-react';

function TechStack() {
  const technologies = [
    {
      category: 'Frontend',
      icon: <Code size={24} />,
      tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'React Router']
    },
    {
      category: 'Backend',
      icon: <Cpu size={24} />,
      tech: ['Node.js', 'Express.js', 'Python', 'FastAPI', 'REST APIs']
    },
    {
      category: 'AI/ML',
      icon: <CpuIcon size={24} />,
      tech: ['GPT-4 API', 'TensorFlow', 'PyTorch', 'NLP Libraries', 'Custom AI Models']
    },
    {
      category: 'Database',
      icon: <Database size={24} />,
      tech: ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'AWS RDS']
    },
    {
      category: 'Cloud & DevOps',
      icon: <Cloud size={24} />,
      tech: ['AWS EC2', 'Docker', 'Kubernetes', 'CI/CD Pipeline', 'NGINX']
    },
    {
      category: 'Security',
      icon: <Shield size={24} />,
      tech: ['JWT Authentication', 'SSL/TLS', 'Data Encryption', 'GDPR Compliance', 'OWASP Standards']
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
            <p>React-based user interface with responsive design</p>
          </div>
          <div className="arch-layer">
            <h4>Application Layer</h4>
            <p>Node.js/Express server handling API requests and business logic</p>
          </div>
          <div className="arch-layer">
            <h4>AI Processing Layer</h4>
            <p>Python-based AI models for document analysis and NLP</p>
          </div>
          <div className="arch-layer">
            <h4>Data Layer</h4>
            <p>PostgreSQL for structured data, MongoDB for document storage</p>
          </div>
          <div className="arch-layer">
            <h4>Infrastructure Layer</h4>
            <p>AWS cloud services with Docker and Kubernetes orchestration</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechStack;