import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Edit2, Save, X, Shield, Bell, Settings, Upload, History } from 'lucide-react';
import { useAuth } from './AuthContext';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || ''
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditData({
      fullName: user?.fullName || '',
      email: user?.email || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      fullName: user?.fullName || '',
      email: user?.email || ''
    });
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Profile</h1>
          <p>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">
                      <User size={18} />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={editData.fullName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <Mail size={18} />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editData.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="edit-actions">
                    <button 
                      className="save-btn" 
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="loading-spinner-small"></div>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2>{user.fullName || user.name}</h2>
                  <p className="profile-email">{user.email}</p>
                  <button className="edit-profile-btn" onClick={handleEdit}>
                    <Edit2 size={18} />
                    <span>Edit Profile</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Documents Analyzed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Active Projects</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Storage Used</div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => navigate('/')}>
              <div className="action-icon">
                <Upload size={24} />
              </div>
              <div className="action-content">
                <h3>Upload Document</h3>
                <p>Analyze a new legal document</p>
              </div>
            </button>

            <button className="action-card" onClick={() => navigate('/history')}>
              <div className="action-icon">
                <History size={24} />
              </div>
              <div className="action-content">
                <h3>View History</h3>
                <p>Check your analyzed documents</p>
              </div>
            </button>

            <button className="action-card" onClick={() => alert('Settings coming soon!')}>
              <div className="action-icon">
                <Settings size={24} />
              </div>
              <div className="action-content">
                <h3>Settings</h3>
                <p>Customize your preferences</p>
              </div>
            </button>

            <button className="action-card" onClick={handleLogout}>
              <div className="action-icon logout">
                <Shield size={24} />
              </div>
              <div className="action-content">
                <h3>Logout</h3>
                <p>Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>

        <div className="profile-features">
          <h2>Account Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <User size={24} />
              </div>
              <div className="feature-content">
                <h4>Personal Profile</h4>
                <p>Customize your preferences and settings</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <div className="feature-content">
                <h4>Secure Storage</h4>
                <p>Encrypted document storage and processing</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Bell size={24} />
              </div>
              <div className="feature-content">
                <h4>Notifications</h4>
                <p>Get alerts for document analysis completion</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Settings size={24} />
              </div>
              <div className="feature-content">
                <h4>Preferences</h4>
                <p>Customize AI analysis settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;