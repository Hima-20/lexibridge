import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Call REAL backend login
      const user = await login(formData.email, formData.password);
      
      if (user) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    setLoading(true);
    setError('');
    
    try {
      // Try with test credentials
      const user = await login('test@example.com', 'testpass123');
      if (user) {
        navigate('/');
      }
    } catch (error) {
      setError('Demo login failed. Please register a new account.');
    } finally {
      setLoading(false);
    }
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
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue your legal document analysis journey</p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <Sparkles size={20} />
                <span>AI-Powered Analysis</span>
              </div>
              <div className="auth-feature">
                <Shield size={20} />
                <span>Secure & Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Login to LexiBridge</h2>
              <p>Access your AI legal document analysis account</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
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
                    placeholder="Enter your password"
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
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <div className="divider">
                <span>Don't have an account?</span>
              </div>

              <div className="auth-footer">
                <a href="/register" className="auth-link">Create Account</a>
              </div>

              <div className="demo-section">
                <p className="demo-text">For testing purposes:</p>
                <button 
                  type="button" 
                  className="demo-btn"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  Try Test Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;