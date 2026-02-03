import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, FileText, Users, ChevronRight, History } from 'lucide-react';

function Footer() {
  const footerSections = [
    {
      title: 'Project Summary',
      icon: <FileText size={20} />,
      links: [
        { name: 'Project Summary', href: '/summary' },
        { name: 'Legal Intelligence', href: '#' },
        { name: 'Risk Assessment', href: '#' },
        { name: 'Compliance Review', href: '#' },
      ]
    },
    {
      title: 'Tech Stack',
      icon: <Cpu size={20} />,
      links: [
        { name: 'Tech Stack', href: '/tech-stack' },
        { name: 'GPT-4 & Claude AI', href: '#' },
        { name: 'TensorFlow NLP', href: '#' },
        { name: 'AWS Infrastructure', href: '#' },
      ]
    },
    {
      title: 'Disclaimer',
      icon: <Shield size={20} />,
      links: [
        { name: 'Disclaimer', href: '/disclaimer' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'GDPR Compliance', href: '#' },
      ]
    },
    {
      title: 'About Us',
      icon: <Users size={20} />,
      links: [
        { name: 'About Us', href: '/about-us' },
        { name: 'History', href: '/history' },
        { name: 'Careers', href: '#' },
        { name: 'Contact', href: '#' },
      ]
    }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Footer Grid */}
        <div className="footer-grid">
          {footerSections.map((section, index) => (
            <div key={index} className="footer-section">
              <div className="footer-section-header">
                {section.icon}
                <h3>{section.title}</h3>
              </div>
              <ul className="footer-links">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link to={link.href}>
                      <ChevronRight size={14} />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L4 8L16 14L28 8L16 2Z" fill="currentColor" />
                <path d="M4 22L16 28L28 22" stroke="currentColor" strokeWidth="2" />
                <path d="M4 16L16 22L28 16" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="footer-brand-text">
              <h2>LexiBridge</h2>
              <p>AI-Assisted Legal Document Interpretation</p>
            </div>
          </div>
          
          <div className="footer-legal">
            <p>© {new Date().getFullYear()} LexiBridge Intelligence. All Rights Reserved.</p>
            <p>This system provides AI-assisted analysis. Consult a qualified attorney for legal advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;