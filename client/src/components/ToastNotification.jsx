// src/components/ToastNotification.jsx
import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useToast } from '../contexts/ToastContext'; // Import useToast hook

function ToastNotification() {
    const { toasts, removeToast } = useToast();

    return (
        // Position toasts in the bottom right corner of the viewport
        <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    onClose={() => removeToast(toast.id)} // Function to call when toast is closed
                    show={true} // Boolean to control visibility (always true if in 'toasts' array)
                    delay={5000} // Auto-hide after 5 seconds (matches TOAST_TIMEOUT in context)
                    autohide // Enables auto-hiding behavior
                    // Dynamically set background color based on toast type
                    bg={toast.type === 'success' ? 'success' : (toast.type === 'danger' ? 'danger' : 'info')}
                >
                    <Toast.Header>
                        <strong className="me-auto">{toast.title}</strong> {/* Toast title */}
                        <small className="text-muted">just now</small> {/* Timestamp or additional info */}
                    </Toast.Header>
                    {/* Toast body content, text color adjusted for better contrast */}
                    <Toast.Body className={toast.type === 'danger' ? 'text-white' : 'text-dark'}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            ))}
        </ToastContainer>
    );
}

export default ToastNotification;
