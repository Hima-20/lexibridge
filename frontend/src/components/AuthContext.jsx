import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('lexibridge_user');
    const token = localStorage.getItem('access_token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('lexibridge_user');
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  // REAL Login function - calls backend
  // ONLY login & register functions changed

const login = async (email, password) => {
  try {
    const response = await fetch('https://lexibridge-guax.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: email,          // ✅ FIXED
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    if (!data.access_token) {
      throw new Error('No access token received');
    }

    const userData = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      fullName: data.user.fullName,
      isAuthenticated: true
    };

    setUser(userData);
    localStorage.setItem('lexibridge_user', JSON.stringify(userData));
    localStorage.setItem('access_token', data.access_token);

    return userData;

  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};


const register = async (fullName, email, password) => {
  try {
    const response = await fetch('https://lexibridge-guax.onrender.com/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // ✅ FIXED
      },
      body: new URLSearchParams({
        username: fullName,    // ✅ FIXED
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed');
    }

    const userData = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      fullName: data.user.fullName,
      isAuthenticated: true
    };

    setUser(userData);
    localStorage.setItem('lexibridge_user', JSON.stringify(userData));
    localStorage.setItem('access_token', data.access_token);

    return userData;

  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};


  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('lexibridge_user');
    localStorage.removeItem('access_token');
  };

  // Update user function
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('lexibridge_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  // Get token function for API calls
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  // Check if authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('lexibridge_user');
    return !!token && !!savedUser;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    getToken,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route component - FIXED: Separate component outside AuthProvider
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : null;
};