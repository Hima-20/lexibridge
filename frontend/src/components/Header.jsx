import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Upload, User, LogOut, FileText, History, Home, Settings } from 'lucide-react';
import { useAuth } from './AuthContext';

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenus}>
          <div className="logo-icon">
            <FileText size={24} />
          </div>
          <div className="logo-text">
            <div className="logo-name">LexiBridge</div>
            <div className="logo-tagline">AI Legal Intelligence</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link" onClick={closeMenus}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/how-it-works" className="nav-link" onClick={closeMenus}>
            <Settings size={18} />
            <span>How It Works</span>
          </Link>
          
          {user ? (
            <>
              <Link to="/history" className="nav-link" onClick={closeMenus}>
                <History size={18} />
                <span>History</span>
              </Link>
              
              {/* User Profile Dropdown */}
              <div className="profile-dropdown">
                <button className="profile-toggle" onClick={handleProfileClick}>
                  <div className="user-avatar">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span>{user.fullName || user.name}</span>
                </button>
                
                {profileMenuOpen && (
                  <div className="profile-menu">
                    <div className="profile-header">
                      <div className="user-avatar-large">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.fullName || user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="profile-menu-divider"></div>
                    <Link to="/profile" className="profile-menu-item" onClick={closeMenus}>
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                    <Link to="/history" className="profile-menu-item" onClick={closeMenus}>
                      <History size={18} />
                      <span>Document History</span>
                    </Link>
                    <button className="profile-menu-item logout-btn" onClick={handleLogout}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenus}>
                <User size={18} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="upload-btn" onClick={closeMenus}>
                <Upload size={18} />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-content">
            <Link to="/" className="mobile-nav-link" onClick={closeMenus}>
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link to="/how-it-works" className="mobile-nav-link" onClick={closeMenus}>
              <Settings size={20} />
              <span>How It Works</span>
            </Link>
            
            {user ? (
              <>
                <div className="mobile-profile-section">
                  <div className="mobile-profile-header">
                    <div className="user-avatar">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="mobile-user-info">
                      <div className="user-name">{user.fullName || user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="mobile-profile-links">
                    <Link to="/profile" className="mobile-profile-link" onClick={closeMenus}>
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                    <Link to="/history" className="mobile-profile-link" onClick={closeMenus}>
                      <History size={18} />
                      <span>Document History</span>
                    </Link>
                    <button className="mobile-profile-link logout-btn" onClick={handleLogout}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={closeMenus}>
                  <User size={20} />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="mobile-upload-btn" onClick={closeMenus}>
                  <Upload size={20} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;