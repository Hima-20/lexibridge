import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Shield, Sparkles, Check } from 'lucide-react';
import { useAuth } from './AuthContext';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (!formData.agreeTerms) {
        throw new Error('You must agree to the Terms of Service');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const user = register(formData);
      
      if (user) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    alert('Terms of Service and Privacy Policy will be available soon!');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper">
        <div className="auth-left-panel">
          <div className="auth-brand">
            <div className="auth-logo">
              <Shield size={32} />
              <span>LexiBridge</span>
            </div>
            <h1>Join LexiBridge</h1>
            <p className="auth-subtitle">Create your account and revolutionize your legal document analysis</p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <Sparkles size={20} />
                <span>AI-Powered Analysis</span>
              </div>
              <div className="auth-feature">
                <UserPlus size={20} />
                <span>Free Trial Available</span>
              </div>
              <div className="auth-feature">
                <Shield size={20} />
                <span>Bank-Level Security</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Join LexiBridge for AI-powered legal document analysis</p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  <User size={20} />
                  <span>Full Name</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="form-input"
                    disabled={loading}
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={20} />
                  <span>Email Address</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="form-input"
                    disabled={loading}
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Lock size={20} />
                  <span>Password</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    className="form-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <div className="input-border"></div>
                </div>
                <div className="password-hints">
                  <span className={`hint ${formData.password.length >= 8 ? 'hint-valid' : ''}`}>
                    At least 8 characters
                  </span>
                  <span className={`hint ${/[A-Z]/.test(formData.password) ? 'hint-valid' : ''}`}>
                    One uppercase letter
                  </span>
                  <span className={`hint ${/\d/.test(formData.password) ? 'hint-valid' : ''}`}>
                    One number
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <Lock size={20} />
                  <span>Confirm Password</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="form-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <div className="input-border"></div>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-container terms-checkbox">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    I agree to the <a href="#" className="inline-link" onClick={handleTermsClick}>Terms of Service</a> and <a href="#" className="inline-link" onClick={handleTermsClick}>Privacy Policy</a>
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <>
                    <Check size={20} />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div className="divider">
                <span>Or sign up with</span>
              </div>

              <div className="social-login">
                <button 
                  type="button" 
                  className="social-btn google"
                  onClick={() => alert('Google signup coming soon!')}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <a href="/login" className="auth-link">Sign In</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;