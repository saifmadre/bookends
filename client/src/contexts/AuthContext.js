// src/contexts/AuthContext.js

import axios from 'axios';
import { getApp, getApps, initializeApp } from 'firebase/app'; // Import getApps and getApp
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyCHsj6GgNIz123WiXdHoNZn57mqGbCrBCI",
    authDomain: "bookends-e027a.firebaseapp.com",
    projectId: "bookends-e027a",
    storageBucket: "bookends-e027a.appspot.com",
    messagingSenderId: "693810748587",
    appId: "1:693810748587:web:c1c6ac0602c0c7e74f2bee",
    // measurementId: "G-XXXXXXXXXX" // Optional: if you use Google Analytics
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : hardcodedFirebaseConfig;

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- FIX START: Initialize Firebase App and Services ONLY ONCE ---
let app;
console.log("AuthContext: Checking Firebase apps. getApps().length:", getApps().length);
if (!getApps().length) { // Check if no Firebase apps have been initialized
    console.log("AuthContext: No Firebase app found. Initializing for the first time with config:", firebaseConfig);
    app = initializeApp(firebaseConfig);
    console.log("AuthContext: Firebase app initialized successfully.");
} else {
    console.log("AuthContext: Firebase app already exists. Attempting to get existing app.");
    try {
        app = getApp(); // Get the already initialized default app
        console.log("AuthContext: Successfully retrieved existing Firebase app.");
    } catch (e) {
        console.error("AuthContext: Error retrieving existing Firebase app:", e);
        // This case should ideally not happen if getApps().length was 1+,
        // but adding a fallback to help diagnose if the default app isn't accessible.
        // If this error occurs, it indicates a deeper issue with app registration.
        throw new Error("AuthContext: Failed to get existing Firebase app. Check for multiple initializations or misconfigurations.");
    }
}

const auth = getAuth(app);
const db = getFirestore(app);
console.log("AuthContext: Firebase Auth and Firestore services initialized.");
// --- FIX END ---

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    console.warn('AuthContext: Axios Interceptor caught 401 Unauthorized. Clearing token and logging out.');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setToken(null);
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
            console.log('AuthContext: Axios default header set with token.');
        } else {
            delete axios.defaults.headers.common['x-auth-token'];
            console.log('AuthContext: Axios default header cleared (no token).');
        }
    }, [token]);

    const loadUserFromToken = useCallback(async () => {
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log("AuthContext: [loadUserFromToken] Starting. Stored token found:", storedToken ? "Yes" : "No");

        if (storedToken) {
            if (token !== storedToken) {
                setToken(storedToken);
            }
            try {
                console.log('AuthContext: [loadUserFromToken] Attempting to fetch user data from http://localhost:5000/api/auth with token.');
                const res = await axios.get('http://localhost:5000/api/auth');
                const userData = res.data && typeof res.data === 'object'
                    ? { ...res.data, id: res.data._id || res.data.id }
                    : null;

                if (userData && userData.id) {
                    setUser(userData);
                    setIsAuthenticated(true);
                    console.log('AuthContext: [loadUserFromToken] User successfully loaded and authenticated:', userData.username, 'ID:', userData.id);
                } else {
                    console.error('AuthContext: [loadUserFromToken] User data from API is incomplete or missing ID. Forcing logout.');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setToken(null);
                }
            } catch (err) {
                console.error('AuthContext: [loadUserFromToken] Token verification failed or user not found:', err.response?.data?.msg || err.message || err);
                if (!(err.response && err.response.status === 401)) {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setToken(null);
                }
            }
        } else {
            console.log('AuthContext: [loadUserFromToken] No token found in storage. User is not authenticated.');
            setUser(null);
            setIsAuthenticated(false);
            setToken(null);
        }
    }, [token]);

    useEffect(() => {
        // Log the state of 'auth' when the effect runs
        console.log("AuthContext: useEffect for onAuthStateChanged running. Auth object:", auth);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AuthContext: onAuthStateChanged callback triggered. Firebase User:", user);
            if (user) {
                setFirebaseUser(user);
                setUserId(user.uid);
                console.log('AuthContext: Firebase user signed in, UID:', user.uid);
            } else {
                console.log('AuthContext: No Firebase user signed in. Attempting anonymous or custom token login.');
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log('AuthContext: Signed in with custom token.');
                    } else {
                        await signInAnonymously(auth);
                        console.log('AuthContext: Signed in anonymously.');
                    }
                } catch (error) {
                    console.error("AuthContext: Firebase initial authentication failed:", error);
                    setUserId(crypto.randomUUID()); // Fallback if Firebase auth fails
                }
                setFirebaseUser(null);
            }
            console.log("AuthContext: Calling loadUserFromToken and then setting loading to false.");
            await loadUserFromToken();
            setLoading(false);
            console.log("AuthContext: Loading state set to false.");
        });

        return () => {
            console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
            unsubscribe();
        };
    }, [loadUserFromToken, auth, initialAuthToken]); // Added 'auth' and 'initialAuthToken' to dependencies for clarity

    const register = async ({ username, email, password, phoneNumber }) => {
        setIsRegistering(true);
        try {
            const firebaseUserCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUid = firebaseUserCredential.user.uid;
            console.log('AuthContext: Firebase user created with UID:', firebaseUid);

            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify({ username, email, password, phoneNumber, firebaseUid });
            console.log('AuthContext: [register] Sending user data to backend:', body);
            const res = await axios.post('http://localhost:5000/api/auth/register', body, config);

            if (res.data.token) {
                sessionStorage.setItem('token', res.data.token);
                setToken(res.data.token);
                console.log('AuthContext: [register] Backend registration successful. Token received and set.');
            }
            return res.data;
        } catch (err) {
            console.error('AuthContext: [register] Registration error:', err.response?.data?.msg || err.message);
            throw err;
        } finally {
            setIsRegistering(false);
        }
    };

    const login = async ({ identifier, password, rememberMe = false }) => {
        setIsLoggingIn(true);
        try {
            const firebaseUserCredential = await signInWithEmailAndPassword(auth, identifier, password);
            const firebaseUid = firebaseUserCredential.user.uid;
            console.log('AuthContext: Firebase user signed in with UID:', firebaseUid);

            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const firebaseIdToken = await firebaseUserCredential.user.getIdToken();
            const body = JSON.stringify({ identifier, password, rememberMe, firebaseIdToken });
            console.log('AuthContext: [login] Sending login request to backend with identifier:', identifier, 'Remember Me:', rememberMe);
            const res = await axios.post('http://localhost:5000/api/auth/login', body, config);

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                sessionStorage.removeItem('token');
            } else {
                sessionStorage.setItem('token', res.data.token);
                localStorage.removeItem('token');
            }
            setToken(res.data.token);
            console.log('AuthContext: [login] Backend login successful. Token set. User data will load.');

        } catch (err) {
            console.error('AuthContext: [login] Login error:', err.response?.data?.msg || err.message);
            if (err.code && err.code.startsWith('auth/')) {
                console.log('AuthContext: Firebase Auth error, clearing local tokens.');
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                setToken(null);
            }
            throw err;
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setFirebaseUser(null);
            setUserId(null);
            console.log('AuthContext: User logged out successfully from Firebase and backend. State reset.');
        } catch (error) {
            console.error('AuthContext: Error during logout:', error);
            throw error;
        }
    };

    const authContextValue = {
        user,
        firebaseUser,
        userId,
        token,
        isAuthenticated,
        loading,
        isRegistering,
        isLoggingIn,
        register,
        login,
        logout,
        db,
        auth
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
