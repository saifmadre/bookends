// src/contexts/AuthContext.js

import axios from 'axios'; // Make sure you have axios installed (npm install axios)
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Create the AuthContext
const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Initialize token by checking localStorage first, then sessionStorage
    const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Initial loading state for authentication check
    const [isRegistering, setIsRegistering] = useState(false); // New: Specific loading for registration
    const [isLoggingIn, setIsLoggingIn] = useState(false);     // New: Specific loading for login

    // --- Axios Interceptor for Centralized Error Handling ---
    // This interceptor will automatically clear token and logout user on 401 Unauthorized responses.
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                // Check if the error response has a status of 401 (Unauthorized)
                if (error.response && error.response.status === 401) {
                    console.warn('AuthContext: Axios Interceptor caught 401 Unauthorized. Clearing token and logging out.');
                    // Perform logout actions for both storage types
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    setIsAuthenticated(false);
                    delete axios.defaults.headers.common['x-auth-token'];
                    // Optionally, you could trigger a toast here or redirect the user
                    // Example: showToast('Your session has expired. Please log in again.', 'info', 'Session Expired');
                    // Note: If you have react-router-dom, you might navigate here (e.g., navigate('/login'))
                    // but it's often cleaner to handle navigation in components listening to auth state.
                }
                return Promise.reject(error); // Re-throw the error so component-specific catch blocks can still handle it
            }
        );

        // Cleanup function for the interceptor
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


    // Memoized callback for the core user loading logic
    const loadUserFromToken = useCallback(async () => {
        setLoading(true); // Ensure loading is true when this function is actively running
        // Prioritize localStorage token (for "remember me"), then sessionStorage
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log("AuthContext: [loadUserFromToken] Starting. Stored token found:", storedToken ? "Yes" : "No");

        if (storedToken) {
            // Update the token state if it was loaded from storage, in case it was null before
            setToken(storedToken);
            // Set token to default headers for all axios requests
            axios.defaults.headers.common['x-auth-token'] = storedToken; // Ensure this is set here too
            try {
                // Verify token with backend
                console.log('AuthContext: [loadUserFromToken] Attempting to fetch user data from /api/auth with token.');
                const res = await axios.get('http://localhost:5000/api/auth');
                console.log('AuthContext: [loadUserFromToken] Raw user data received from /api/auth:', res.data);

                // IMPORTANT FIX & ROBUSTNESS: Map _id to id for consistency across frontend.
                // Ensure res.data is an object and has _id.
                const userData = res.data && typeof res.data === 'object'
                    ? { ...res.data, id: res.data._id || res.data.id } // Use existing 'id' if present, otherwise '_id'
                    : null; // If res.data is not an object or null, set userData to null

                if (userData && userData.id) {
                    console.log('AuthContext: [loadUserFromToken] Processed user data for state:', userData);
                    // Update states immediately after successful fetch
                    setUser(userData);
                    setIsAuthenticated(true);
                    console.log('AuthContext: [loadUserFromToken] User successfully loaded and authenticated:', userData.username, 'ID:', userData.id);
                } else {
                    // This case means a token was present, but user data from backend was incomplete/invalid.
                    console.error('AuthContext: [loadUserFromToken] User data from API is incomplete or missing ID. Forcing logout.');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    setIsAuthenticated(false);
                    delete axios.defaults.headers.common['x-auth-token'];
                }
            } catch (err) {
                // Error handled by interceptor if 401, otherwise log general error
                console.error('AuthContext: [loadUserFromToken] Token verification failed or user not found:', err.response?.data?.msg || err.message || err);
                // If the error was not a 401 (e.g., network error), ensure state is still cleared
                if (!(err.response && err.response.status === 401)) {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setToken(null);
                    setUser(null); // Explicitly clear user
                    setIsAuthenticated(false); // Explicitly set to false
                    delete axios.defaults.headers.common['x-auth-token'];
                }
            }
        } else {
            console.log('AuthContext: [loadUserFromToken] No token found in storage. User is not authenticated.');
            setUser(null); // Explicitly ensure user is null
            setIsAuthenticated(false); // Explicitly ensure isAuthenticated is false
            setToken(null); // Ensure token state is null if no token was found
        }
        setLoading(false); // Authentication check complete regardless of success or failure
    }, [token]); // Dependencies for the memoized callback: only 'token'

    useEffect(() => {
        loadUserFromToken();
    }, [loadUserFromToken]); // Now useEffect depends on the memoized callback

    // NEW: Dedicated useEffect to log the *actual* state after a render
    useEffect(() => {
        console.log("--- AuthContext State Update (After Render) ---");
        console.log("isAuthenticated:", isAuthenticated);
        console.log("user:", user); // Log the full user object
        console.log("loading:", loading);
        console.log("isRegistering:", isRegistering);
        console.log("isLoggingIn:", isLoggingIn);
        console.log("----------------------------------------------");
    }, [isAuthenticated, user, loading, isRegistering, isLoggingIn]); // Dependencies ensure this logs when any of these states change

    // Register User
    const register = async ({ username, email, password, phoneNumber }) => {
        setIsRegistering(true); // Set specific loading state for registration
        try {
            // --- Client-side validation ---
            if (!username || username.trim() === '') {
                throw new Error('Username is required.');
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error('Valid email is required.');
            }
            if (!password || password.length < 6) { // Common minimum password length
                throw new Error('Password must be at least 6 characters long.');
            }
            // Add more validation for phoneNumber if needed, e.g., regex for specific formats

            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify({ username, email, password, phoneNumber });
            console.log('AuthContext: [register] Registering user with data:', body);
            const res = await axios.post('http://localhost:5000/api/auth/register', body, config);

            // Upon successful registration, the backend usually logs the user in and returns a token
            if (res.data.token) {
                // For registration, we typically just log them in for the current session, not "remember me"
                sessionStorage.setItem('token', res.data.token); // Store in sessionStorage by default for new registrations
                // Set Axios default header for all subsequent requests after successful registration
                axios.defaults.headers.common['x-auth-token'] = res.data.token; // Add this line here
                setToken(res.data.token); // This will trigger the useEffect to load user data
                console.log('AuthContext: [register] Registration successful. Token received and set.');
            }
            return res.data; // Return data from the registration response
        } catch (err) {
            console.error('AuthContext: [register] Registration error:', err.response?.data?.msg || err.message);
            throw err; // Re-throw the error for the component to catch
        } finally {
            setIsRegistering(false); // Reset specific loading state
        }
    };

    // Login User
    // Added rememberMe parameter
    const login = async ({ identifier, password, rememberMe = false }) => {
        setIsLoggingIn(true); // Set specific loading state for login
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            // Send the rememberMe flag to the backend
            const body = JSON.stringify({ identifier, password, rememberMe });
            console.log('AuthContext: [login] Logging in user with identifier:', identifier, 'Remember Me:', rememberMe);
            const res = await axios.post('http://localhost:5000/api/auth/login', body, config);

            // Store token based on rememberMe flag
            if (rememberMe) {
                localStorage.setItem('token', res.data.token);
                sessionStorage.removeItem('token'); // Clear sessionStorage if localStorage is used
                console.log('AuthContext: [login] Token stored in localStorage.');
            } else {
                sessionStorage.setItem('token', res.data.token);
                localStorage.removeItem('token'); // Clear localStorage if sessionStorage is used
                console.log('AuthContext: [login] Token stored in sessionStorage.');
            }
            // --- FIX: CRUCIAL LINE ADDED HERE ---
            // Set Axios default header for all subsequent requests immediately after login
            axios.defaults.headers.common['x-auth-token'] = res.data.token; // <--- THIS WAS MISSING!

            setToken(res.data.token); // This will trigger the useEffect to load user data
            console.log('AuthContext: [login] Login successful. Token set. useEffect will handle user data.');

        } catch (err) {
            console.error('AuthContext: [login] Login error:', err.response?.data?.msg || err.message);
            // Error handling already done by interceptor for 401, but ensure state is cleared for others
            if (!(err.response && err.response.status === 401)) {
                localStorage.removeItem('token'); // Clear both storages on failed login
                sessionStorage.removeItem('token');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
            console.log('AuthContext: [login] Login failed. Cleared token and set isAuthenticated to false.');
            throw err; // Re-throw the error for the component to catch
        } finally {
            setIsLoggingIn(false); // Reset specific loading state
        }
    };

    // Logout User
    const logout = () => {
        localStorage.removeItem('token'); // Clear both storages on logout
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['x-auth-token']; // Remove token from headers
        console.log('AuthContext: [logout] User logged out successfully. State reset.');
        // Note: For full application control, typically a redirect to '/login'
        // or a similar unauthenticated route would be triggered by the component
        // consuming this logout function (e.g., in App.js or a Navbar component).
    };

    // New function to explicitly refresh user data
    const refreshUser = useCallback(async () => {
        await loadUserFromToken();
    }, [loadUserFromToken]);

    // The value provided to consumers of the context
    const authContextValue = {
        user,
        token,
        isAuthenticated,
        loading,
        isRegistering, // Export new loading state
        isLoggingIn,   // Export new loading state
        register,
        login,
        logout,
        refreshUser // Export the new refreshUser function
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
