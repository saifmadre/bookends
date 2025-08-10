// src/contexts/ToastContext.js
import React, { createContext, useContext, useRef, useState } from 'react';

const ToastContext = createContext();

export function useToast() {
    // Added for debugging: Check if useToast is being called
    console.log("DEBUG: useToast hook is being called.");
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const toastIdCounter = useRef(0); // Suppressed warning: toastIdCounter.current is used

    const showToast = (message, variant = 'info', title = 'Notification', duration = 3000) => {
        const id = toastIdCounter.current++; // Increment and use the current value
        setToasts(prevToasts => [...prevToasts, { id, message, variant, title, duration }]); // Add duration to toast object

        // The timeout logic is now handled by the ToastNotification component's `autohide` and `delay` props
        // We will remove toasts when the `onClose` is triggered from the ToastNotification component.
    };

    // New function to remove a toast by its ID
    const removeToast = (id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    const value = {
        showToast,
        toasts, // Expose toasts state
        removeToast // Expose removeToast function
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* The ToastContainer and individual Toasts will now be rendered by ToastNotification.jsx */}
            {/* Remove the ToastContainer from here as it's redundant with ToastNotification.jsx */}
        </ToastContext.Provider>
    );
}
