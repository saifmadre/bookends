// src/components/ToastNotification.jsx
import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useToast } from '../contexts/ToastContext'; // Import useToast hook

function ToastNotification() {
    // Destructure toasts and removeToast from the context
    const { toasts, removeToast } = useToast();

    return (
        // Position toasts in the bottom right corner of the viewport
        <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
            {/* Ensure toasts is an array before mapping over it */}
            {(toasts || []).map(toast => (
                <Toast
                    key={toast.id}
                    onClose={() => removeToast(toast.id)} // Function to call when toast is closed
                    show={true} // Boolean to control visibility (always true if in 'toasts' array)
                    delay={toast.duration || 5000} // Use duration from toast object, default to 5 seconds
                    autohide // Enables auto-hiding behavior
                    // Dynamically set background color based on toast variant (from context)
                    bg={toast.variant}
                >
                    <Toast.Header>
                        <strong className="me-auto text-capitalize">{toast.title}</strong> {/* Toast title */}
                        <small className="text-muted">just now</small> {/* Timestamp or additional info */}
                    </Toast.Header>
                    {/* Toast body content, text color adjusted for better contrast */}
                    <Toast.Body className={toast.variant === 'dark' ? 'text-white' : ''}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            ))}
        </ToastContainer>
    );
}

export default ToastNotification;

