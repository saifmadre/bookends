// src/App.js

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect } from 'react';
import { Link, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';

import './index.css'; // Ensure your custom CSS is imported

// Contexts
import ToastNotification from './components/ToastNotification.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Components
import AdminDashboard from './components/AdminDashboard.jsx';
import ChangePassword from './components/ChangePassword.jsx';
import Dashboard from './components/Dashboard.jsx';
import DeleteAccount from './components/DeleteAccount.jsx';
import EditProfile from './components/EditProfile.jsx';
import Login from './components/login.jsx';
import NotFoundPage from './components/NotFoundPage.jsx'; // Corrected import for 404
import Profile from './components/Profile.jsx';
import Register from './components/register.jsx';
import ResetPassword from './components/ResetPassword.jsx'; // Corrected import for ResetPassword
import UsersPage from './components/UsersPage.jsx'; // NEW: Import UsersPage


// ProtectedRoute Component: Wraps routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('ProtectedRoute: Not authenticated, redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="book-theme-app d-flex align-items-center justify-content-center min-vh-100">
        <p className="book-form-text">Loading authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};


// Main App Content Component: Handles global layout, navigation, and routing.
function AppContent() {
  const { isAuthenticated, logout, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (location.pathname === '/') {
        if (isAuthenticated) {
          console.log('AppContent: Authenticated, redirecting from / to /dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('AppContent: Not authenticated, redirecting from / to /login');
          navigate('/login', { replace: true });
        }
      }
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    console.log('Logging out, redirecting to /login');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="book-theme-app d-flex align-items-center justify-content-center min-vh-100">
        <p className="book-form-text">Initializing application...</p>
      </div>
    );
  }

  return (
    <div> {/* Changed from book-theme-app to div for user's header */}
      {/* User's preferred header content */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">BookEnds</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/dashboard">Dashboard</Link>
                  </li>
                  {/* Removed the "Add Book" link */}
                  {/* NEW: Add Link for UsersPage */}
                  <li className="nav-item">
                    <Link className="nav-link" to="/users">Find Users</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/profile">Profile</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/edit-profile">Edit Profile</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/change-password">Change Password</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/delete-account">Delete Account</Link>
                  </li>
                  {user && user.role === 'admin' && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin-dashboard">Admin Dashboard</Link>
                    </li>
                  )}
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Register</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-4"> {/* The container for the routed content */}
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Root path: If authenticated, redirect to Dashboard. Otherwise, show Login.
              The useEffect in AppContent handles the actual navigation, this simply sets up the route logic. */}
          <Route path="/" element={isAuthenticated ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Login />} />

          {/* Protected Routes - wrapped with ProtectedRoute */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          {/* Removed the /add-book route from here as well, since the link is gone */}
          {/* NEW: Add Protected Route for UsersPage */}
          <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} /> {/* This is now correctly imported */}


          {/* Admin Protected Route - combines ProtectedRoute with an internal role check */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              {/* Conditional rendering for admin access: if not admin, show Dashboard instead */}
              {user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />}
            </ProtectedRoute>
          } />

          {/* Fallback route for any unmatched paths - MUST be the last route */}
          <Route path="*" element={<NotFoundPage />} /> {/* Using NotFoundPage component */}
        </Routes>
      </div>

      {/* Footer section (kept simple for now) */}
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="m-0">&copy; 2024 BookEnds. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Root App component that sets up Router and Context Providers
function App() {
  return (
    <Router>
      <AuthProvider>
        {/* ToastProvider and ToastNotification are now here, wrapping AppContent */}
        <ToastProvider>
          <AppContent />
          <ToastNotification /> {/* Render ToastNotification here to be globally available */}
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
