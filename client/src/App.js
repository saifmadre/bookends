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
// RE-ENABLED: Import BookList as it's used in a route
import BookList from './components/BookList';
import ChangePassword from './components/ChangePassword.jsx';
import Dashboard from './components/Dashboard.jsx';
import DeleteAccount from './components/DeleteAccount.jsx';
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
      console.log('ProtectedRoute: Not authenticated, redirecting to login...');
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

// AppContent Component: Contains the main layout and routes
function AppContent() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (location.pathname === '/') {
        if (user) {
          console.log('AppContent: Authenticated, redirecting from / to /dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('AppContent: Not authenticated, redirecting from / to /login');
          navigate('/login', { replace: true });
        }
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      // Optionally show a toast notification for logout error
    }
  };

  // eslint-disable-next-line no-unused-vars
  const isHomePage = location.pathname === '/';

  if (loading) {
    return (
      <div className="book-theme-app d-flex align-items-center justify-content-center min-vh-100">
        <p className="book-form-text">Initializing application...</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* User's preferred header content */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">BookEnds</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {user ? (
                <>
                  <li className="nav-item">
                    <Link to="/dashboard" className="nav-link custom-nav-link">
                      Dashboard
                    </Link>
                  </li>
                  {/* REMOVED: My Reading List link from the main navigation */}
                  {/*
                  <li className="nav-item">
                    <Link to="/reading-list" className="nav-link custom-nav-link">
                      My Reading List
                    </Link>
                  </li>
                  */}
                  <li className="nav-item">
                    <Link to="/users" className="nav-link custom-nav-link">
                      Find Users
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/profile" className="nav-link custom-nav-link">
                      Profile
                    </Link>
                  </li>
                  {/* Settings Dropdown */}
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle custom-nav-link" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Settings
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      <li><Link className="dropdown-item" to="/change-password">Change Password</Link></li>
                      <li><Link className="dropdown-item" to="/delete-account">Delete Account</Link></li>
                      {/* NEW: Admin Dashboard link, only visible if user is an admin */}
                      {user?.role === 'admin' && (
                        <li><Link className="dropdown-item" to="/admin-dashboard">Admin Dashboard</Link></li>
                      )}
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/register" className="nav-link custom-nav-link">
                      Register
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link custom-nav-link">
                      Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Root path: If authenticated, redirect to Dashboard. Otherwise, show Login. */}
          <Route path="/" element={user ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Login />} />

          {/* Protected Routes - wrapped with ProtectedRoute */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          {/* Updated Profile route to handle optional userId parameter */}
          <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* NEW: Route for the BookList component, protected */}
          {/* Kept the route, even if the direct nav link is removed. */}
          <Route path="/reading-list" element={<ProtectedRoute><BookList /></ProtectedRoute>} />

          {/* Admin Protected Route - only the route remains, link is now in UI dropdown */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />}
            </ProtectedRoute>
          } />

          {/* Fallback route for any unmatched paths - MUST be the last route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {/* Footer section (kept simple for now) */}
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="m-0">&copy; 2024 BookEnds. All rights reserved.</p>
      </footer>

      {/* Custom Styles for Navigation Links */}
      <style jsx>{`
        .custom-nav-link {
          color: white; /* White text for visibility on dark background */
          font-weight: 600;
          padding: 0.5rem 1rem; /* Add some padding for clickability */
          border-radius: 0.375rem; /* Slightly rounded corners */
          transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        }

        .custom-nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1); /* Subtle white background on hover */
          color: white; /* Keep text white on hover */
          text-decoration: none; /* Remove underline on hover */
        }

        .custom-nav-link.dropdown-toggle {
          /* Specific styles for dropdown toggle if needed */
          background-color: transparent; /* Ensure no background for dropdown toggle */
          color: white;
        }

        .custom-nav-link.dropdown-toggle::after {
          /* Adjust dropdown arrow color if needed */
          color: white;
        }
      `}</style>
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
