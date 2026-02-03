import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

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
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('lexibridge_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    const user = {
      id: Date.now(),
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      fullName: userData.fullName || userData.name,
      isAuthenticated: true
    };
    
    setUser(user);
    localStorage.setItem('lexibridge_user', JSON.stringify(user));
    return user;
  };

  // Register function
  const register = (userData) => {
    const user = {
      id: Date.now(),
      name: userData.fullName || userData.email.split('@')[0],
      email: userData.email,
      fullName: userData.fullName,
      isAuthenticated: true
    };
    
    setUser(user);
    localStorage.setItem('lexibridge_user', JSON.stringify(user));
    return user;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('lexibridge_user');
  };

  // Update user function
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('lexibridge_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route component
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return null;
  }

  return children;
};