import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './components/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './components/Homepage';
import HowitWorks from './components/HowitWorks';
import History from './components/History';
import Profile from './components/Profile';
import Login from './components/Login';
import Register from './components/Register';
import Summary from './components/Summary';
import Techstack from './components/Techstack';
import Aboutus from './components/Aboutus';
import Disclaimer from './components/Disclaimer';
import Analysis from './components/Analysis';  
import Uploaddocument from './components/Uploaddocument'; 
import './App.css';

// Layout Component for consistent header/footer
function Layout({ children }) {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Homepage />
            </Layout>
          } />
          
          <Route path="/how-it-works" element={
            <Layout>
              <HowItWorks />
            </Layout>
          } />
          
          <Route path="/history" element={
            <Layout>
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            </Layout>
          } />
          
          <Route path="/profile" element={
            <Layout>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </Layout>
          } />
          
          <Route path="/login" element={
            <Layout>
              <Login />
            </Layout>
          } />
          
          <Route path="/register" element={
            <Layout>
              <Register />
            </Layout>
          } />
          
          {/* NEW ROUTES ADDED */}
          <Route path="/analysis" element={
            <Layout>
              
                <Analysis />
              
            </Layout>
          } />
          
          <Route path="/upload" element={
            <Layout>
              <ProtectedRoute>
                <Uploaddocument />
              </ProtectedRoute>
            </Layout>
          } />
          {/* END NEW ROUTES */}
          
          <Route path="/summary" element={
            <Layout>
              <Summary />
            </Layout>
          } />
          
          <Route path="/tech-stack" element={
            <Layout>
              <TechStack />
            </Layout>
          } />
          
          <Route path="/about-us" element={
            <Layout>
              <AboutUs />
            </Layout>
          } />
          
          <Route path="/disclaimer" element={
            <Layout>
              <Disclaimer />
            </Layout>
          } />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;