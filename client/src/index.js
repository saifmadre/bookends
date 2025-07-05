import 'bootstrap/dist/css/bootstrap.min.css'; // Make sure Bootstrap CSS is imported
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Your custom book theme CSS

import ToastNotification from './components/ToastNotification.jsx'; // Import ToastNotification for global rendering
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { ToastProvider } from './contexts/ToastContext'; // Import ToastProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap the entire App with AuthProvider and ToastProvider to make them globally available */}
    <AuthProvider>
      <ToastProvider>
        <App />
        {/* ToastNotification is placed here so it's globally available and outside of any routing logic */}
        <ToastNotification />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
