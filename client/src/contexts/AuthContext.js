// src/contexts/AuthContext.js

import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'; // Import setDoc and getDoc for Firestore operations
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Firebase config should always come from __firebase_config in Canvas environments
// Providing a hardcoded placeholder for local dev if __firebase_config is not defined.
const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyCHsj6GgNIz123WiXdHoNZn57mqGbCrBCI", // Replace with your actual key if not in Canvas
    authDomain: "bookends-e027a.firebaseapp.com", // Replace with your actual domain
    projectId: "bookends-e027a", // Replace with your actual project ID
    storageBucket: "bookends-e027a.appspot.com",
    messagingSenderId: "693810748587",
    appId: "1:693810748587:web:c1c6ac0602c0c7e74f2bee",
    // measurementId: "G-XXXXXXXXXX" // Optional: if you use Google Analytics
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : hardcodedFirebaseConfig;

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Firebase App Initialization (Ensured Once for the entire app) ---
let app;
// Check if no Firebase apps have been initialized to prevent re-initialization warnings
if (!getApps().length) {
    console.log("AuthContext: Initializing Firebase app with provided config.");
    app = initializeApp(firebaseConfig);
} else {
    // If an app already exists, retrieve it to avoid errors
    console.log("AuthContext: Firebase app already exists, retrieving existing app instance.");
    try {
        app = getApp();
    } catch (e) {
        console.error("AuthContext: Error retrieving existing Firebase app:", e);
        // Fallback for unexpected issues, though typically `getApps().length` handles this
        throw new Error("AuthContext: Failed to get existing Firebase app. Check for multiple initializations or misconfigurations.");
    }
}

// Initialize Firebase Auth and Firestore services
const auth = getAuth(app);
const db = getFirestore(app);
console.log("AuthContext: Firebase Auth and Firestore services are ready.");
// --- End Firebase App Initialization ---

// Custom hook to provide authentication context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// AuthProvider component to wrap the application and provide auth state
export const AuthProvider = ({ children }) => {
    // `user` state now holds custom profile data fetched from Firestore
    const [user, setUser] = useState(null);
    // `firebaseUser` is the raw Firebase Auth user object (from onAuthStateChanged)
    const [firebaseUser, setFirebaseUser] = useState(null);
    // `userId` is the Firebase UID, essential for Firestore paths and user identification
    const [userId, setUserId] = useState(null);
    // `isAuthenticated` reflects if a Firebase user (including anonymous) is signed in
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // `loading` indicates if the initial authentication check is still in progress
    const [loading, setLoading] = useState(true);
    // `isRegistering` and `isLoggingIn` for UI loading indicators
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // No need for Axios or custom token state/logic (`token`) as we're directly using Firebase Auth

    /**
     * loadUserProfile: Fetches a user's custom profile data from Firestore.
     * This function is called after a Firebase user (authenticated or anonymous) is available.
     * @param {string} uid - The Firebase User ID (UID).
     */
    const loadUserProfile = useCallback(async (uid) => {
        if (!uid) {
            setUser(null);
            setIsAuthenticated(false);
            console.log("AuthContext: loadUserProfile called with no UID. User profile state cleared.");
            return;
        }

        try {
            console.log(`AuthContext: Attempting to load user profile for UID: ${uid} from Firestore.`);
            // Construct the Firestore document reference for the user's profile
            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            const userProfileDocSnap = await getDoc(userProfileDocRef);

            if (userProfileDocSnap.exists()) {
                // If a profile exists, set it to the `user` state
                const profileData = userProfileDocSnap.data();
                setUser({ ...profileData, id: uid }); // Merge UID into the user object
                setIsAuthenticated(true);
                console.log(`AuthContext: User profile loaded for UID: ${uid}. Username: ${profileData.username || 'N/A'}`);
            } else {
                // If no specific profile document exists (e.g., anonymous user, or new email/password user not yet fully registered),
                // create a basic user object from the Firebase user info.
                console.warn(`AuthContext: No custom Firestore profile found for UID: ${uid}. Setting minimal user info.`);
                setUser({
                    id: uid,
                    username: firebaseUser?.email || `User_${uid.substring(0, 6)}`, // Default username
                    email: firebaseUser?.email || null,
                    role: 'user', // Default role
                    date: new Date().toISOString() // Approximate registration date
                });
                setIsAuthenticated(true); // Still considered authenticated by Firebase
            }
        } catch (err) {
            console.error(`AuthContext: Error loading user profile for UID ${uid} from Firestore:`, err);
            // On error, clear user state and set authenticated to false
            setUser(null);
            setIsAuthenticated(false);
        }
    }, [firebaseUser, appId]); // Depend on firebaseUser (for email) and appId

    // Effect to listen for Firebase Authentication state changes
    useEffect(() => {
        // This listener fires on component mount and whenever the auth state changes (login, logout, token refresh)
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AuthContext: onAuthStateChanged callback triggered. Firebase Auth User:", user ? user.uid : "None");
            setFirebaseUser(user); // Update raw Firebase user object

            if (user) {
                // If a Firebase user is signed in
                setUserId(user.uid);
                await loadUserProfile(user.uid); // Load or create their custom profile
            } else {
                // If no Firebase user is currently signed in, attempt initial anonymous or custom token login
                console.log('AuthContext: No Firebase user. Attempting initial anonymous or custom token login.');
                try {
                    if (initialAuthToken) {
                        // Sign in with a custom token provided by the Canvas environment
                        const customTokenUserCredential = await signInWithCustomToken(auth, initialAuthToken);
                        console.log('AuthContext: Successfully signed in with custom token.');
                        setFirebaseUser(customTokenUserCredential.user);
                        setUserId(customTokenUserCredential.user.uid);
                        await loadUserProfile(customTokenUserCredential.user.uid);
                    } else {
                        // If no custom token, sign in anonymously (common for initial app load in Canvas)
                        const anonymousUserCredential = await signInAnonymously(auth);
                        console.log('AuthContext: Successfully signed in anonymously. UID:', anonymousUserCredential.user.uid);
                        setFirebaseUser(anonymousUserCredential.user);
                        setUserId(anonymousUserCredential.user.uid);
                        await loadUserProfile(anonymousUserCredential.user.uid);
                    }
                } catch (error) {
                    console.error("AuthContext: Firebase initial authentication (anonymous/custom token) failed:", error);
                    // If even anonymous/custom token auth fails, user is not authenticated.
                    setUser(null);
                    setFirebaseUser(null);
                    setUserId(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false); // Mark loading as complete after the auth state check
            console.log("AuthContext: Authentication loading state set to false.");
        });

        // Cleanup function: Unsubscribe from the listener when the component unmounts
        return () => {
            console.log("AuthContext: Unsubscribing from onAuthStateChanged listener.");
            unsubscribe();
        };
    }, [initialAuthToken, loadUserProfile]); // Dependencies: re-run if initial token or profile loading logic changes

    /**
     * register: Registers a new user with Firebase Authentication and saves profile to Firestore.
     * @param {object} userData - Contains username, email, password, phoneNumber.
     */
    const register = async ({ username, email, password, phoneNumber }) => {
        setIsRegistering(true); // Set loading state for registration UI
        try {
            console.log('AuthContext: Attempting Firebase registration for email:', email);
            // 1. Create user with email and password using Firebase Auth SDK
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid; // Get the Firebase User ID (UID)

            console.log('AuthContext: Firebase user created successfully with UID:', uid);

            // 2. Save additional user profile data to Firestore
            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            await setDoc(userProfileDocRef, {
                username: username,
                email: email,
                phoneNumber: phoneNumber || null, // Store phoneNumber, allow null
                role: 'user', // Default role for new registrations
                date: new Date().toISOString() // Store registration date
            });
            console.log('AuthContext: User profile saved to Firestore for UID:', uid);

            // No custom backend token handling needed here; Firebase's onAuthStateChanged will update the state.
            return { success: true, uid: uid }; // Return success status

        } catch (err) {
            console.error('AuthContext: Firebase registration error:', err.message, err.code);
            throw err; // Re-throw the error for the calling component (register.jsx) to handle and display
        } finally {
            setIsRegistering(false); // Reset loading state
        }
    };

    /**
     * login: Logs in an existing user with Firebase Authentication.
     * @param {object} credentials - Contains identifier (email) and password.
     */
    const login = async ({ identifier, password }) => {
        setIsLoggingIn(true); // Set loading state for login UI
        try {
            console.log('AuthContext: Attempting Firebase login for identifier (email):', identifier);
            // Sign in user with email and password using Firebase Auth SDK
            await signInWithEmailAndPassword(auth, identifier, password);
            console.log('AuthContext: Firebase login successful.');
            // `onAuthStateChanged` listener will automatically handle updating the AuthContext state (user, isAuthenticated, etc.)
            return { success: true }; // Return success status
        } catch (err) {
            console.error('AuthContext: Firebase login error:', err.message, err.code);
            // Firebase errors have a 'code' property (e.g., 'auth/wrong-password', 'auth/user-not-found')
            throw err; // Re-throw the error for the calling component (login.jsx) to handle and display
        } finally {
            setIsLoggingIn(false); // Reset loading state
        }
    };

    /**
     * logout: Logs out the current user from Firebase Authentication.
     */
    const logout = async () => {
        try {
            console.log('AuthContext: Attempting Firebase logout.');
            await signOut(auth); // Sign out user from Firebase
            // Clear all user-related states after successful Firebase sign out
            setUser(null);
            setFirebaseUser(null);
            setUserId(null);
            setIsAuthenticated(false);
            console.log('AuthContext: User logged out successfully from Firebase. All user-related state reset.');
        } catch (error) {
            console.error('AuthContext: Error during logout:', error);
            throw error; // Re-throw any logout errors
        }
    };

    // The value object provided by the AuthContext.Provider
    const authContextValue = {
        user, // Custom user profile data from Firestore
        firebaseUser, // Raw Firebase Auth user object
        userId, // Firebase UID
        isAuthenticated, // Authentication status
        loading, // Initial loading state for auth check
        isRegistering, // Registration loading state
        isLoggingIn, // Login loading state
        register, // Register function
        login, // Login function
        logout, // Logout function
        db, // Firestore instance (exposed for other components to use Firestore)
        auth // Firebase Auth instance (exposed for direct auth interactions if needed, e.g., password reset)
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
