// src/contexts/ToastContext.js
import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const MAX_TOASTS = 3; // Maximum number of toasts to show at once
    const TOAST_TIMEOUT = 5000; // Toast display duration in milliseconds

    const showToast = useCallback((message, type = 'info', title = 'Notification') => {
        const id = Date.now(); // Unique ID for each toast instance
        const newToast = { id, message, type, title };

        setToasts(prevToasts => {
            // If maximum toasts are reached, remove the oldest one before adding the new one
            if (prevToasts.length >= MAX_TOASTS) {
                return [...prevToasts.slice(1), newToast];
            }
            return [...prevToasts, newToast];
        });

        // Automatically remove the toast after a set timeout
        setTimeout(() => {
            removeToast(id);
        }, TOAST_TIMEOUT);
    }, []); // useCallback ensures this function is memoized

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []); // useCallback ensures this function is memoized

    // The context value provided to consumers
    const contextValue = {
        toasts,
        showToast,
        removeToast,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
