import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Shield, Sparkles, Check, AlertCircle } from 'lucide-react';
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
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setPasswordStrength(checkPasswordStrength(value));
  };

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

      // Call REAL backend registration
      const user = await register(formData.fullName, formData.email, formData.password);
      
      if (user) {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    setFormData(newFormData);
    
    if (name === 'password') {
      handlePasswordChange(value);
    }
    
    if (error) setError('');
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    alert('Terms of Service and Privacy Policy will be available soon!');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#ef4444'; // red
    if (passwordStrength <= 3) return '#f59e0b'; // orange
    return '#10b981'; // green
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
                <AlertCircle size={20} />
                <span>{error}</span>
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
                
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{
                          width: `${passwordStrength * 20}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      ></div>
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
                )}
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
                <span>Already have an account?</span>
              </div>

              <div className="auth-footer">
                <a href="/login" className="auth-link">Sign In</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;