import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from './AuthContext';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);

    try {
      const user = await register(
        formData.fullName,
        formData.email,
        formData.password
      );

      if (user) navigate('/');
    } catch (err) {
      console.error('Registration error:', err);

      setError(
        typeof err === 'string'
          ? err
          : err?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (error) setError('');
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
            <p className="auth-subtitle">
              Create your account and start AI-powered legal analysis
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <Sparkles size={20} />
                <span>AI-Powered Analysis</span>
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
              <p>Join LexiBridge today</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
                required
              />

              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="input-with-icon">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>I agree to the Terms of Service</span>
              </label>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
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
                <a href="/login" className="auth-link">
                  Sign In
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
