// src/contexts/AuthContext.js

import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
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
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : hardcodedFirebaseConfig;

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

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
    const [firebaseUser, setFirebaseUser] = useState(null); // Raw Firebase Auth user
    const [userId, setUserId] = useState(null); // Firebase UID
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Application-level auth status
    const [loading, setLoading] = useState(true); // Initial auth check loading
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Flag to prevent anonymous re-login right after explicit logout
    const [isManuallyLoggedOut, setIsManuallyLoggedOut] = useState(false);

    /**
     * loadUserProfile: Fetches a user's custom profile data from Firestore.
     * Sets the `user` state. Also determines if the user is `isAuthenticated`
     * from the application's perspective (i.e., has a real profile).
     * @param {object} firebaseAuthUser - The user object directly from Firebase Auth.
     */
    const loadUserProfile = useCallback(async (firebaseAuthUser) => {
        if (!firebaseAuthUser) {
            setUser(null);
            setIsAuthenticated(false);
            setUserId(null); // Ensure userId is null if no user
            console.log("AuthContext: loadUserProfile called with no Firebase Auth user. State cleared.");
            return;
        }

        const uid = firebaseAuthUser.uid;
        setUserId(uid); // Always set userId from the Firebase Auth user

        try {
            console.log(`AuthContext: Attempting to load user profile for UID: ${uid} from Firestore.`);
            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            const userProfileDocSnap = await getDoc(userProfileDocRef);

            if (userProfileDocSnap.exists()) {
                const profileData = userProfileDocSnap.data();
                setUser({ ...profileData, id: uid });
                // Only set isAuthenticated to true if a non-anonymous user is signed in OR a profile exists
                setIsAuthenticated(!firebaseAuthUser.isAnonymous);
                console.log(`AuthContext: User profile loaded for UID: ${uid}. Username: ${profileData.username || 'N/A'}. IsAuthenticated: ${!firebaseAuthUser.isAnonymous}`);
            } else {
                // If Firebase Auth user exists but no custom profile:
                // For non-anonymous users, this might indicate incomplete registration.
                // For anonymous users, this is expected.
                console.warn(`AuthContext: No custom Firestore profile found for UID: ${uid}.`);
                setUser({
                    id: uid,
                    username: firebaseAuthUser.email || `User_${uid.substring(0, 6)}`,
                    email: firebaseAuthUser.email || null,
                    role: 'user', // Default role
                    date: new Date().toISOString() // Approximate registration date
                });
                // Keep isAuthenticated as false for anonymous users or incomplete profiles
                setIsAuthenticated(!firebaseAuthUser.isAnonymous);
            }
        } catch (err) {
            console.error(`AuthContext: Error loading user profile for UID ${uid} from Firestore:`, err);
            setUser(null);
            setIsAuthenticated(false); // Explicitly set to false on profile load error
        }
    }, [appId, db]); // Dependencies: appId and db

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AuthContext: onAuthStateChanged callback triggered. Firebase Auth User:", user ? user.uid : "None");
            setFirebaseUser(user);

            if (user) {
                // If a Firebase user is signed in (could be anonymous from initial token)
                await loadUserProfile(user); // Load or create their custom profile based on this Firebase user
                setIsManuallyLoggedOut(false); // Reset logout flag on any successful sign-in
            } else {
                // If no Firebase user is currently signed in
                if (!isManuallyLoggedOut) {
                    console.log('AuthContext: No Firebase user. Attempting initial anonymous or custom token login (if not manually logged out).');
                    try {
                        if (initialAuthToken) {
                            const customTokenUserCredential = await signInWithCustomToken(auth, initialAuthToken);
                            console.log('AuthContext: Successfully signed in with custom token.');
                            await loadUserProfile(customTokenUserCredential.user);
                        } else {
                            const anonymousUserCredential = await signInAnonymously(auth);
                            console.log('AuthContext: Successfully signed in anonymously. UID:', anonymousUserCredential.user.uid);
                            await loadUserProfile(anonymousUserCredential.user); // Load profile for this anonymous user
                        }
                    } catch (error) {
                        console.error("AuthContext: Firebase initial authentication (anonymous/custom token) failed:", error);
                        // If even anonymous/custom token auth fails, ensure states are cleared
                        setUser(null);
                        setFirebaseUser(null);
                        setUserId(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    console.log("AuthContext: User explicitly logged out. Not attempting anonymous/custom token login.");
                    // Ensure all user states are cleared after manual logout
                    setUser(null);
                    setFirebaseUser(null);
                    setUserId(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false); // Authentication check is complete
            console.log("AuthContext: Authentication loading state set to false.");
        });

        return () => {
            console.log("AuthContext: Unsubscribing from onAuthStateChanged listener.");
            unsubscribe();
        };
    }, [initialAuthToken, loadUserProfile, isManuallyLoggedOut]);

    const register = async ({ username, email, password, phoneNumber }) => {
        setIsRegistering(true);
        try {
            console.log('AuthContext: Attempting Firebase registration for email:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            console.log('AuthContext: Firebase user created successfully with UID:', uid);

            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            await setDoc(userProfileDocRef, {
                username: username,
                email: email,
                phoneNumber: phoneNumber || null,
                role: 'user',
                date: new Date().toISOString()
            });
            console.log('AuthContext: User profile saved to Firestore for UID:', uid);

            setIsManuallyLoggedOut(false); // Reset logout flag upon successful registration/login
            // onAuthStateChanged will pick up the new user and load profile.
            return { success: true, uid: uid };
        } catch (err) {
            console.error('AuthContext: Firebase registration error:', err.message, err.code);
            throw err;
        } finally {
            setIsRegistering(false);
        }
    };

    const login = async ({ identifier, password }) => {
        setIsLoggingIn(true);
        try {
            console.log('AuthContext: Attempting Firebase login for identifier (email):', identifier);
            await signInWithEmailAndPassword(auth, identifier, password);
            console.log('AuthContext: Firebase login successful.');
            setIsManuallyLoggedOut(false); // Reset logout flag upon successful registration/login
            // onAuthStateChanged will handle state updates.
            return { success: true };
        } catch (err) {
            console.error('AuthContext: Firebase login error:', err.message, err.code);
            throw err;
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = async () => {
        try {
            console.log('AuthContext: Attempting Firebase logout.');
            setIsManuallyLoggedOut(true); // Set the flag *before* signing out
            await signOut(auth);
            console.log('AuthContext: User logged out successfully from Firebase.');
            // States will be cleared by onAuthStateChanged due to isManuallyLoggedOut flag
        } catch (error) {
            console.error('AuthContext: Error during logout:', error);
            setIsManuallyLoggedOut(false); // Reset flag if logout fails
            throw error;
        }
    };

    const authContextValue = {
        user,
        firebaseUser,
        userId,
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