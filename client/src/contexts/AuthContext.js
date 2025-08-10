// src/contexts/AuthContext.js

import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import getStorage
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'; // Added useRef

const AuthContext = createContext(null);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Define hardcoded config for local development/Canvas preview only
const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyCHsj6GgNIz123WiXdHoNZn57mqGbCrBCI", // IMPORTANT: Keep your actual API key here for local testing.
    authDomain: "bookends-e027a.firebaseapp.com",
    projectId: "bookends-e027a",
    storageBucket: "bookends-e027a.appspot.com",
    messagingSenderId: "693810748587",
    appId: "1:693810748587:web:c1c6ac0602c0c7e74f2bee",
};

// Check for Vercel environment variable first, then fallback to local hardcoded config
let firebaseConfig;
try {
    if (typeof process !== 'undefined' && process.env.FIREBASE_CONFIG) {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log("[AuthContext Init] Using Firebase config from Vercel environment variable.");
    } else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        firebaseConfig = JSON.parse(__firebase_config);
        console.log("[AuthContext Init] Using Firebase config from Canvas '__firebase_config'.");
    } else {
        firebaseConfig = hardcodedFirebaseConfig;
        console.log("[AuthContext Init] Using hardcoded Firebase config (local development fallback).");
    }
} catch (e) {
    console.error("[AuthContext Init] Error parsing Firebase config from environment. Falling back to hardcoded.", e);
    firebaseConfig = hardcodedFirebaseConfig;
}


let app;
if (!getApps().length) {
    console.log("[AuthContext Init] Initializing Firebase app with provided config.");
    app = initializeApp(firebaseConfig);
} else {
    try {
        app = getApp();
        console.log("[AuthContext Init] Firebase app already exists, retrieving existing app instance.");
    } catch (e) {
        console.error("[AuthContext Init] Error retrieving existing Firebase app:", e);
        throw new Error("AuthContext: Failed to get existing Firebase app. Check for multiple initializations or misconfigurations.");
    }
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

console.log("[AuthContext Init] Firebase Auth, Firestore, and Storage services are ready.");

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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isManuallyLoggedOut, setIsManuallyLoggedOut] = useState(false);

    // Promise and its resolver to signal when auth state has been fully determined/updated
    const authPromiseResolveRef = useRef(null);
    const [authReadyPromise, setAuthReadyPromise] = useState(() => new Promise(resolve => {
        authPromiseResolveRef.current = resolve;
    }));

    // Function to resolve the current authReadyPromise and create a new one for next changes
    const resolveAndResetAuthReadyPromise = useCallback(() => {
        if (authPromiseResolveRef.current) {
            authPromiseResolveRef.current(); // Resolve the current promise
            console.log("[AuthContext Promise] authReadyPromise resolved.");
        }
        // Create a new promise for future state changes
        setAuthReadyPromise(new Promise(resolve => {
            authPromiseResolveRef.current = resolve;
        }));
        console.log("[AuthContext Promise] New authReadyPromise created.");
    }, []);

    const loadUserProfile = useCallback(async (firebaseAuthUser) => {
        console.log(`[loadUserProfile] Called with firebaseAuthUser: ${firebaseAuthUser ? firebaseAuthUser.uid : 'null'}`);
        if (!firebaseAuthUser) {
            setUser(null);
            setIsAuthenticated(false);
            setUserId(null);
            console.log("[loadUserProfile] No Firebase Auth user, clearing states.");
            return;
        }

        const uid = firebaseAuthUser.uid;
        setUserId(uid);
        console.log(`[loadUserProfile] Setting userId: ${uid}`);

        try {
            console.log(`[loadUserProfile] Attempting to load custom profile for UID: ${uid}`);
            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            const userProfileDocSnap = await getDoc(userProfileDocRef);

            if (userProfileDocSnap.exists()) {
                const profileData = userProfileDocSnap.data();
                setUser({ ...profileData, id: uid });
                const newIsAuthenticated = !firebaseAuthUser.isAnonymous;
                setIsAuthenticated(newIsAuthenticated);
                console.log(`[loadUserProfile] Profile loaded for UID: ${uid}. Username: ${profileData.username || 'N/A'}. Setting isAuthenticated: ${newIsAuthenticated}`);
            } else {
                console.warn(`[loadUserProfile] No custom Firestore profile found for UID: ${uid}.`);
                // If no custom profile, set user with basic Firebase Auth data and assume a default role
                setUser({
                    id: uid,
                    username: firebaseAuthUser.displayName || firebaseAuthUser.email || `User_${uid.substring(0, 6)}`,
                    email: firebaseAuthUser.email || null,
                    role: 'user', // Default role
                    date: new Date().toISOString(), // Default registration date
                    bio: '',
                    profileImage: '',
                    socialLinks: {},
                    booksFinished: 0,
                    averageRating: 'N/A',
                    favoriteGenre: 'N/A'
                });
                setIsAuthenticated(!firebaseAuthUser.isAnonymous);
                console.log(`[loadUserProfile] No custom profile, setting user with Firebase Auth data. isAuthenticated: ${!firebaseAuthUser.isAnonymous}`);
            }
        } catch (err) {
            console.error(`[loadUserProfile] Error loading user profile for UID ${uid}:`, err);
            setUser(null);
            setIsAuthenticated(false);
        }
    }, [appId, db]);

    useEffect(() => {
        console.log("[onAuthStateChanged Effect] Initializing listener.");
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log(`[onAuthStateChanged] Callback triggered. Firebase Auth User: ${user ? user.uid : 'None'}`);
            setFirebaseUser(user);

            if (user) {
                console.log('[onAuthStateChanged] Firebase user detected. Calling loadUserProfile.');
                await loadUserProfile(user);
                setIsManuallyLoggedOut(false);
            } else {
                console.log('[onAuthStateChanged] No Firebase user detected. Clearing all auth states.');
                setUser(null);
                setFirebaseUser(null);
                setUserId(null);
                setIsAuthenticated(false);
                setIsManuallyLoggedOut(false);
            }
            setLoading(false);
            console.log(`[onAuthStateChanged] Auth loading set to false. Final isAuthenticated (after loadUserProfile): ${user ? !user.isAnonymous : false}`);
            resolveAndResetAuthReadyPromise();
        });

        return () => {
            console.log("[onAuthStateChanged Effect] Unsubscribing listener.");
            unsubscribe();
        };
    }, [loadUserProfile, resolveAndResetAuthReadyPromise]);

    const register = async ({ username, email, password, phoneNumber }) => {
        setIsRegistering(true);
        try {
            console.log('[AuthContext - Register] Attempting Firebase registration for email:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            console.log('[AuthContext - Register] Firebase user created successfully with UID:', uid);

            const userProfileDocRef = doc(db, `artifacts/${appId}/users`, uid);
            // Ensure all profile fields expected by Profile.jsx and EditProfile.jsx are initialized
            await setDoc(userProfileDocRef, {
                username: username,
                email: email,
                phoneNumber: phoneNumber || null,
                role: 'user', // Default role
                date: new Date().toISOString(), // Registration date
                bio: '',
                profileImage: '', // Initialize with empty string for no image
                socialLinks: { goodreads: '', twitter: '', instagram: '' }, // Initialize as empty object
                booksFinished: 0,
                averageRating: 'N/A',
                favoriteGenre: 'N/A'
            });
            console.log('[AuthContext - Register] User profile saved to Firestore for UID:', uid);

            await authReadyPromise;
            console.log('[AuthContext - Register] Auth state fully propagated after registration.');

            return { success: true, uid: uid };
        } catch (err) {
            console.error('[AuthContext - Register] Firebase registration error:', err.message, err.code);
            throw err;
        } finally {
            setIsRegistering(false);
        }
    };

    const login = async ({ identifier, password }) => {
        setIsLoggingIn(true);
        try {
            console.log('[AuthContext - Login] Attempting Firebase login for identifier:', identifier);
            await signInWithEmailAndPassword(auth, identifier, password);
            console.log('[AuthContext - Login] Firebase login successful.');

            await authReadyPromise;
            console.log('[AuthContext - Login] Auth state fully propagated after login.');

            return { success: true };
        } catch (err) {
            console.error('[AuthContext - Login] Firebase login error:', err.message, err.code);
            throw err;
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = async () => {
        try {
            console.log('[AuthContext - Logout] Attempting Firebase logout.');
            setIsManuallyLoggedOut(true);
            await signOut(auth);
            console.log('[AuthContext - Logout] User logged out successfully from Firebase.');
        } catch (error) {
            console.error('[AuthContext - Logout] Error during logout:', error);
            setIsManuallyLoggedOut(false);
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
        auth,
        storage // Expose storage here
    };

    useEffect(() => {
        console.log(`[AuthContext Provider Value Update] isAuthenticated: ${isAuthenticated}, userId: ${userId}, user: ${user ? user.username : 'null'}, loading: ${loading}`);
    }, [isAuthenticated, userId, user, loading]);


    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
