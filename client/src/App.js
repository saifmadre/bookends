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
import ChangePassword from './components/ChangePassword.jsx'; // <--- ADDED THIS IMPORT
import Dashboard from './components/Dashboard.jsx';
import DeleteAccount from './components/DeleteAccount.jsx'; // <--- ADDED THIS IMPORT
import Login from './components/login.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';
import Register from './components/register.jsx';
import ResetPassword from './components/ResetPassword.jsx';

// ProtectedRoute Component: Wraps routes that require authentication
const ProtectedRoute = ({ children, adminOnly = false }) => { // Added adminOnly prop
  const { isAuthenticated, loading, user } = useAuth(); // Destructure user for role check
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log(`ProtectedRoute for path: ${location.pathname} - loading: ${loading}, isAuthenticated: ${isAuthenticated}, user role: ${user?.role}`);
    if (!loading) {
      if (!isAuthenticated) {
        console.log(`ProtectedRoute: Not authenticated, redirecting to /login.`);
        navigate('/login', { replace: true });
      } else if (adminOnly && user?.role !== 'admin') { // Check for admin role if adminOnly is true
        console.log(`ProtectedRoute: User is not admin, redirecting to /dashboard.`);
        navigate('/dashboard', { replace: true }); // Redirect non-admins from admin routes
      }
    }
  }, [isAuthenticated, loading, navigate, location.pathname, adminOnly, user?.role]);

  if (loading) {
    return (
      <div className="book-theme-app d-flex align-items-center justify-content-center min-vh-100">
        <p className="book-form-text">Loading authentication status...</p>
      </div>
    );
  }

  if (isAuthenticated && (!adminOnly || user?.role === 'admin')) {
    console.log('ProtectedRoute: Authenticated and authorized, rendering children.');
    return children;
  }

  console.log('ProtectedRoute: Not authorized or redirect handled, returning null.');
  return null;
};

// RedirectToAuthPage Component: Handles initial redirection from root based on auth status
const RedirectToAuthPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`RedirectToAuthPage: Effect triggered. loading: ${loading}, isAuthenticated: ${isAuthenticated}`);
    if (!loading) {
      if (isAuthenticated) {
        console.log('RedirectToAuthPage: Authenticated, redirecting to /dashboard.');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('RedirectToAuthPage: Not authenticated, redirecting to /login.');
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="book-theme-app d-flex align-items-center justify-content-center min-vh-100">
        <p className="book-form-text">Initializing application...</p>
      </div>
    );
  }

  return null;
};


// AppContent Component: Contains the main layout and routes
function AppContent() {
  const { user, logout, loading, isAuthenticated } = useAuth(); // Keep user for navbar display
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      // Optionally show a toast notification for logout error
    }
  };

  // Global loading indicator for the entire application wrapper
  if (loading) {
    return (
      <div className="book-theme-app d-flex align-items-center justify-content-center min-vh-100">
        <p className="book-form-text">Initializing application...</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
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
                    <Link to="/dashboard" className="nav-link custom-nav-link">
                      Dashboard
                    </Link>
                  </li>
                  {/* Removed direct links for /users, /profile as these are now handled within Dashboard */}
                  {/* Settings Dropdown - still relevant for global actions like password/account management */}
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle custom-nav-link" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Settings
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      {/* These routes remain separate as they are global account actions, not dashboard specific views */}
                      <li><Link className="dropdown-item" to="/change-password">Change Password</Link></li>
                      <li><Link className="dropdown-item" to="/delete-account">Delete Account</Link></li>
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

      <div className="container mt-4 flex-grow-1"> {/* Added flex-grow-1 here */}
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root path now uses the redirection helper component */}
          <Route path="/" element={<RedirectToAuthPage />} />

          {/* Protected Routes - dashboard itself */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Global account management routes, still protected individually */}
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />

          {/* Admin Protected Route */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute adminOnly={true}> {/* Use adminOnly prop */}
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback route for any unmatched paths */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="m-0">&copy; 2024 BookEnds. All rights reserved.</p>
      </footer>

      <style jsx>{`
        .custom-nav-link {
          color: white;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        }

        .custom-nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          text-decoration: none;
        }

        .custom-nav-link.dropdown-toggle {
          background-color: transparent;
          color: white;
        }

        .custom-nav-link.dropdown-toggle::after {
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
        <ToastProvider>
          <AppContent />
          <ToastNotification />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
