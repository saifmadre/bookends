// src/contexts/AuthContext.js

import { getApp, getApps, initializeApp } from 'firebase/app';
// signInAnonymously and signInWithCustomToken are removed from imports as they are no longer used in onAuthStateChanged for main app flow
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyCHsj6GgNIz123WiXdHoNZn577mqGbCrBCI", // NOTE: This is a dummy key. Replace with your actual Firebase API key.
    authDomain: "bookends-e027a.firebaseapp.com",
    projectId: "bookends-e027a",
    storageBucket: "bookends-e027a.appspot.com",
    messagingSenderId: "693810748587",
    appId: "1:693810748587:web:c1c6ac0602c0c7e74f2bee",
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : hardcodedFirebaseConfig;

// __initial_auth_token is specific to the Canvas environment's auto-login for Firestore access.
// We explicitly avoid using it for general app authentication flow to prevent unintended logins.
// const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// --- Firebase App Initialization (Ensured Once for the entire app) ---
let app;
if (!getApps().length) {
    console.log("AuthContext: Initializing Firebase app with provided config.");
    app = initializeApp(firebaseConfig);
} else {
    console.log("AuthContext: Firebase app already exists, retrieving existing app instance.");
    try {
        app = getApp();
    } catch (e) {
        console.error("AuthContext: Error retrieving existing Firebase app:", e);
        throw new Error("AuthContext: Failed to get existing Firebase app. Check for multiple initializations or misconfigurations.");
    }
}

const auth = getAuth(app);
const db = getFirestore(app);
console.log("AuthContext: Firebase Auth and Firestore services are ready.");
// --- End Firebase App Initialization ---

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Custom profile from Firestore
    const [firebaseUser, setFirebaseUser] = useState(null); // Raw Firebase Auth user (from onAuthStateChanged)
    const [userId, setUserId] = useState(null); // Firebase UID
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Application-level auth status (true only for logged-in users)
    const [loading, setLoading] = useState(true); // Initial auth check loading state
    const [isRegistering, setIsRegistering] = useState(false); // UI loading for registration
    const [isLoggingIn, setIsLoggingIn] = useState(false); // UI loading for login

    // This flag is now less critical given the removal of automatic anonymous login,
    // but can still be used for clarity or future specific post-logout behaviors.
    const [isManuallyLoggedOut, setIsManuallyLoggedOut] = useState(false);

    /**
     * loadUserProfile: Fetches a user's custom profile data from Firestore.
     * This function is responsible for setting the `user` (custom profile) state,
     * and crucially, setting `isAuthenticated` based on whether the `firebaseAuthUser`
     * is a non-anonymous user and potentially has a saved profile.
     * @param {object} firebaseAuthUser - The user object directly from Firebase Auth.
     */
    const loadUserProfile = useCallback(async (firebaseAuthUser) => {
        if (!firebaseAuthUser) {
            // No Firebase user means no profile to load, so clear states
            setUser(null);
            setIsAuthenticated(false);
            setUserId(null);
            console.log("AuthContext: loadUserProfile called with no Firebase Auth user. States cleared.");
            return;
        }

        const uid = firebaseAuthUser.uid;
        setUserId(uid); // Always set userId from the Firebase Auth user's UID

        try {
            console.log(`AuthContext: Attempting to load user profile for UID: ${uid} from Firestore.`);
            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            const userProfileDocSnap = await getDoc(userProfileDocRef);

            if (userProfileDocSnap.exists()) {
                const profileData = userProfileDocSnap.data();
                setUser({ ...profileData, id: uid });
                // A user is truly 'authenticated' from the app's perspective if they are NOT anonymous
                setIsAuthenticated(!firebaseAuthUser.isAnonymous);
                console.log(`AuthContext: User profile loaded for UID: ${uid}. Username: ${profileData.username || 'N/A'}. IsAuthenticated: ${!firebaseAuthUser.isAnonymous}`);
            } else {
                // If a Firebase user exists but no custom profile in Firestore (e.g., brand new user not fully registered, or anonymous user)
                console.warn(`AuthContext: No custom Firestore profile found for UID: ${uid}.`);
                setUser({
                    id: uid,
                    username: firebaseAuthUser.email || `User_${uid.substring(0, 6)}`, // Fallback username
                    email: firebaseAuthUser.email || null,
                    role: 'user', // Default role
                    date: new Date().toISOString()
                });
                // If no profile, or if the Firebase user is anonymous, set isAuthenticated to false for the app
                setIsAuthenticated(false); // Explicitly false if custom profile doesn't exist or if anonymous
            }
        } catch (err) {
            console.error(`AuthContext: Error loading user profile for UID ${uid} from Firestore:`, err);
            // On error during profile load, consider the user unauthenticated for safety
            setUser(null);
            setIsAuthenticated(false);
        }
    }, [appId, db]); // Dependencies for useCallback: Firebase app ID and Firestore instance


    // This useEffect listens for changes in Firebase Authentication state.
    // It's the central point for determining the app's overall authentication status.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AuthContext: onAuthStateChanged callback triggered. Firebase Auth User:", user ? user.uid : "None");
            setFirebaseUser(user); // Always update the raw Firebase user object

            if (user) {
                // If Firebase reports a user (could be a genuine login or an existing session)
                await loadUserProfile(user); // Attempt to load their custom profile
                setIsManuallyLoggedOut(false); // Reset logout flag since a user is now signed in
            } else {
                // If Firebase reports NO user (after explicit logout or no prior session)
                // This is the crucial change: we NO LONGER automatically sign in anonymously or with __initial_auth_token here.
                // The app will now truly be in an unauthenticated state until explicit login/registration.
                console.log("AuthContext: No Firebase user signed in. User is genuinely unauthenticated.");
                setUser(null);
                setFirebaseUser(null);
                setUserId(null);
                setIsAuthenticated(false);
                setIsManuallyLoggedOut(false); // Ensure this is false for a clean state
            }
            setLoading(false); // Authentication check is complete, UI can now render based on state
            console.log("AuthContext: Authentication loading state set to false.");
        });

        // Cleanup function: Unsubscribe from the listener when the component unmounts
        return () => {
            console.log("AuthContext: Unsubscribing from onAuthStateChanged listener.");
            unsubscribe();
        };
    }, [loadUserProfile]); // Dependencies: Only loadUserProfile, as initialAuthToken is no longer used here.

    /**
     * register: Registers a new user with Firebase Authentication and saves profile to Firestore.
     * @param {object} userData - Contains username, email, password, phoneNumber.
     */
    const register = async ({ username, email, password, phoneNumber }) => {
        setIsRegistering(true);
        try {
            console.log('AuthContext: Attempting Firebase registration for email:', email);
            // 1. Create user with email and password using Firebase Auth SDK
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            console.log('AuthContext: Firebase user created successfully with UID:', uid);

            // 2. Save additional user profile data to Firestore
            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            await setDoc(userProfileDocRef, {
                username: username,
                email: email,
                phoneNumber: phoneNumber || null,
                role: 'user', // Default role for new registrations
                date: new Date().toISOString()
            });
            console.log('AuthContext: User profile saved to Firestore for UID:', uid);

            // onAuthStateChanged listener will automatically pick up the newly signed-in user
            // and call loadUserProfile, which will correctly set isAuthenticated and user state.
            return { success: true, uid: uid };
        } catch (err) {
            console.error('AuthContext: Firebase registration error:', err.message, err.code);
            throw err; // Re-throw the error for the calling component (register.jsx) to handle
        } finally {
            setIsRegistering(false);
        }
    };

    /**
     * login: Logs in an existing user with Firebase Authentication.
     * @param {object} credentials - Contains identifier (email) and password.
     */
    const login = async ({ identifier, password }) => {
        setIsLoggingIn(true);
        try {
            console.log('AuthContext: Attempting Firebase login for identifier (email):', identifier);
            await signInWithEmailAndPassword(auth, identifier, password);
            console.log('AuthContext: Firebase login successful.');
            // onAuthStateChanged listener will handle updating AuthContext state
            return { success: true };
        } catch (err) {
            console.error('AuthContext: Firebase login error:', err.message, err.code);
            throw err; // Re-throw the error for the calling component (login.jsx) to handle
        } finally {
            setIsLoggingIn(false);
        }
    };

    /**
     * logout: Logs out the current user from Firebase Authentication.
     */
    const logout = async () => {
        try {
            console.log('AuthContext: Attempting Firebase logout.');
            setIsManuallyLoggedOut(true); // Signal that logout was explicit
            await signOut(auth);
            console.log('AuthContext: User logged out successfully from Firebase.');
            // onAuthStateChanged will now handle clearing states due to `isManuallyLoggedOut` behavior
        } catch (error) {
            console.error('AuthContext: Error during logout:', error);
            setIsManuallyLoggedOut(false); // Reset flag if logout fails
            throw error;
        }
    };

    // The value object provided by the AuthContext.Provider
    const authContextValue = {
        user,             // Custom user profile data from Firestore
        firebaseUser,     // Raw Firebase Auth user object
        userId,           // Firebase UID
        isAuthenticated,  // Application-level authentication status
        loading,          // Initial auth check loading state
        isRegistering,    // Registration loading state
        isLoggingIn,      // Login loading state
        register,         // Register function
        login,            // Login function
        logout,           // Logout function
        db,               // Firestore instance
        auth              // Firebase Auth instance
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
