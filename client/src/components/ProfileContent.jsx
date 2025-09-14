// src/components/Profile.jsx
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EditProfile from './EditProfile'; // Ensure this import is present and correct

function Profile() {
    // Destructure db from useAuth as well, it's needed for Firestore calls
    const { user: currentUser, isAuthenticated, loading: authLoading, db } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { userId: routeUserId } = useParams(); // Get userId from URL parameters

    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true); // Renamed to differentiate from authLoading
    const [error, setError] = useState('');
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);

    // Determine the ID of the profile to fetch: from URL param or current user
    // Prioritize routeUserId if present, otherwise use currentUser's ID
    const profileToFetchId = routeUserId || currentUser?.id;
    const isCurrentUserProfile = !routeUserId || (currentUser && routeUserId === currentUser.id);

    // This useEffect handles logging for debugging purposes
    useEffect(() => {
        console.log("Profile.jsx: Component Render Cycle. Auth states - authLoading:", authLoading, "isAuthenticated:", isAuthenticated, "currentUser (from AuthContext):", currentUser);
        console.log("Profile.jsx: Determined profileToFetchId:", profileToFetchId, "isCurrentUserProfile:", isCurrentUserProfile);
    }, [isAuthenticated, authLoading, currentUser, profileToFetchId, isCurrentUserProfile]);


    const fetchProfile = useCallback(async () => {
        setLoadingProfile(true); // Start loading for profile data
        setError(''); // Clear previous errors
        setProfileData(null); // Clear previous profile data

        // If auth is still loading, wait for it to complete.
        if (authLoading) {
            console.log("Profile.jsx: Waiting for AuthContext to finish loading before fetching profile.");
            return;
        }

        // If no ID is determined (e.g., not logged in and no userId in URL)
        // Or if it's the current user's profile and they are not authenticated.
        if (!profileToFetchId || (isCurrentUserProfile && !isAuthenticated)) {
            console.log("Profile.jsx: Not authenticated or no target user ID. Showing error.");
            setError('You must be logged in to view your profile or a specific user profile.');
            setLoadingProfile(false);
            return;
        }

        // Check if Firestore DB instance is available
        if (!db) {
            console.warn("Profile.jsx: Firestore DB instance is not available. Cannot fetch profile.");
            setError('Database not initialized. Please ensure Firebase is configured and authenticated.');
            setLoadingProfile(false);
            return;
        }

        try {
            console.log(`Profile.jsx: Attempting to fetch profile from Firestore for UID: ${profileToFetchId}`);
            // Firestore path for user profiles: artifacts/{appId}/users/{userId}
            // Use the global __app_id variable
            const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const userProfileDocRef = doc(db, `artifacts/${currentAppId}/users`, profileToFetchId);
            const userProfileDocSnap = await getDoc(userProfileDocRef);

            if (userProfileDocSnap.exists()) {
                const fetchedProfileData = { id: userProfileDocSnap.id, ...userProfileDocSnap.data() };
                setProfileData(fetchedProfileData);
                console.log("Profile.jsx: Successfully fetched profile from Firestore:", fetchedProfileData);
            } else {
                setError(`Profile not found for user ID: ${profileToFetchId}.`);
                console.log("Profile.jsx: Profile document does not exist in Firestore for ID:", profileToFetchId);
            }
        } catch (err) {
            console.error("Profile.jsx: Error fetching user profile from Firestore:", err);
            setError(err.message || 'Failed to load profile. Please try again. Ensure Firestore rules allow access.');
        } finally {
            setLoadingProfile(false);
        }
    }, [profileToFetchId, isCurrentUserProfile, isAuthenticated, authLoading, db, currentUser?.id]); // Added db to dependencies

    // This effect triggers the fetchProfile whenever authLoading or profileToFetchId changes.
    useEffect(() => {
        // Fetch only when auth loading is complete AND we have a target ID OR it's a current user's profile and they're authenticated.
        if (!authLoading) {
            console.log("Profile.jsx: Auth loading complete. Initiating profile fetch via useEffect.");
            fetchProfile();
        } else {
            console.log("Profile.jsx: Auth is still loading, deferring profile fetch.");
        }
    }, [authLoading, fetchProfile]);


    const handleEditProfileClick = () => {
        setShowEditProfileModal(true); // Open the modal
    };

    const handleCloseEditProfileModal = () => {
        setShowEditProfileModal(false); // Close the modal
        fetchProfile(); // Re-fetch profile data after modal closes to ensure latest data is shown
    };

    // Derived state for avatar initial (ensures it's reactive to profileData)
    const userAvatarInitial = profileData?.username ? profileData.username.charAt(0).toUpperCase() : '?';
    const defaultProfileImage = `https://placehold.co/100x100/d4c7b8/5a4434?text=${userAvatarInitial}`;

    // Function to add a cache-busting timestamp to the image URL (for locally served images or if caching is aggressive)
    const getCacheBustedImageUrl = (url) => {
        if (!url) return defaultProfileImage;
        // Check if the URL is an absolute URL pointing to your backend
        // If your backend serves images, they might be at /uploads/images/xyz.jpg
        // Change '/api/' prefix to match your backend's image serving path if different.
        if (url.startsWith('/uploads/') || url.startsWith('/images/')) {
            const baseUrl = ''; // Use relative path for Vercel, or your deployed backend URL if separate
            const separator = url.includes('?') ? '&' : '?';
            return `${baseUrl}${url}${separator}_t=${new Date().getTime()}`;
        }
        return url; // For external URLs (like social media profile pics), no cache busting needed
    };

    // New function to copy text to clipboard
    const handleCopyToClipboard = (text, fieldName) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(`${fieldName} copied to clipboard!`, 'info', 'Copied!');
        } catch (err) {
            console.error('Failed to copy text:', err);
            showToast('Failed to copy. Please try manually.', 'danger', 'Copy Error');
        }
    };

    // Function to calculate "Member since"
    const getMemberSince = (dateString) => {
        if (!dateString) return 'N/A';
        const registrationDate = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - registrationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months !== 1 ? 's' : ''} ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            const remainingDays = diffDays % 365;
            const months = Math.floor(remainingDays / 30);
            let result = `${years} year${years !== 1 ? 's' : ''}`;
            if (months > 0) {
                result += ` and ${months} month${months !== 1 ? 's' : ''}`;
            }
            return result;
        }
    };

    // Check if social links exist to conditionally render the section
    const hasSocialLinks = profileData?.socialLinks && (
        profileData.socialLinks.goodreads ||
        profileData.socialLinks.twitter ||
        profileData.socialLinks.instagram
    );

    // Determine if the reading snapshot has any meaningful data
    const hasReadingStats = (profileData?.booksFinished > 0) ||
        (profileData?.averageRating && profileData.averageRating !== 'N/A' && profileData.averageRating !== 0) ||
        (profileData?.favoriteGenre && profileData.favoriteGenre !== 'N/A');

    // Conditional rendering based on loading and error states
    if (authLoading || loadingProfile) {
        return (
            <Container className="profile-container my-5 p-4 rounded-xl shadow-lg text-center bg-light-brown-100">
                <Spinner animation="border" role="status" className="spinner-minimal">
                    <span className="visually-hidden">Loading profile...</span>
                </Spinner>
                <p className="loading-text mt-3">Verifying authentication status and loading profile data...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="profile-container my-5 p-4 rounded-xl shadow-lg text-center bg-light-brown-100">
                <Alert variant="danger" className="alert-minimal alert-danger mb-0">{error}</Alert>
            </Container>
        );
    }

    // If no profileData despite no errors, and not authenticated, show specific message.
    if (!profileData && !isAuthenticated) {
        return (
            <Container className="profile-container my-5 p-4 rounded-xl shadow-lg text-center bg-light-brown-100">
                <Alert variant="info" className="alert-minimal mb-0 text-center">
                    Please log in to view your profile or a specific user's profile.
                </Alert>
            </Container>
        );
    }

    // If no profileData despite no errors and being authenticated (meaning profile doesn't exist in Firestore)
    if (!profileData) {
        return (
            <Container className="profile-container my-5 p-4 rounded-xl shadow-lg text-center bg-light-brown-100">
                <Alert variant="info" className="alert-minimal mb-0 text-center">
                    No profile data found for this user.
                </Alert>
            </Container>
        );
    }


    return (
        <Container className="profile-container my-5 p-4 rounded-xl shadow-lg bg-light-brown-100 text-center">
            <h2 className="mb-5 text-4xl font-extrabold text-brown-900 profile-title">
                {isCurrentUserProfile ? 'Your Profile' : `${profileData?.username || 'User'}'s Profile`}
            </h2>

            <Card className="profile-card p-0 shadow-sm rounded-lg border-light-brown-100">
                {/* Profile Header Section */}
                <div className="profile-header-section p-4 bg-light-brown-50 rounded-top-lg">
                    <div className="profile-avatar mb-3">
                        {console.log("Profile.jsx: Image src being rendered:", getCacheBustedImageUrl(profileData.profileImage))}
                        <img
                            src={getCacheBustedImageUrl(profileData.profileImage)}
                            alt="User Avatar"
                            className="img-fluid rounded-circle profile-img"
                            onError={(e) => { e.target.onerror = null; e.target.src = defaultProfileImage; }}
                        />
                    </div>
                    <h3 className="profile-username-display text-3xl font-bold text-brown-800 mb-2">
                        {profileData.username || 'N/A'}
                    </h3>
                    {profileData.bio && <p className="text-gray-600 mb-3 profile-bio">"{profileData.bio}"</p>}
                </div>

                {/* Profile Details Section */}
                <Card.Body className="profile-details-section p-4 text-left">
                    <h4 className="text-xl font-semibold text-brown-800 mb-3 section-title">Account Details</h4>
                    <ul className="list-unstyled profile-details-list">
                        <li>
                            <i className="fas fa-envelope profile-icon"></i>
                            <strong>Email:</strong> <span className="detail-value">{profileData.email || 'N/A'}</span>
                            {isCurrentUserProfile && profileData.email && (
                                <i
                                    className="fas fa-copy copy-icon ms-2"
                                    onClick={() => handleCopyToClipboard(profileData.email, 'Email')}
                                    title="Copy Email"
                                ></i>
                            )}
                        </li>
                        <li>
                            <i className="fas fa-id-badge profile-icon"></i>
                            <strong>User ID:</strong> <span className="detail-value">{profileData.id || 'N/A'}</span> {/* Use profileData.id as set from Firestore doc.id */}
                            {isCurrentUserProfile && profileData.id && (
                                <i
                                    className="fas fa-copy copy-icon ms-2"
                                    onClick={() => handleCopyToClipboard(profileData.id, 'User ID')}
                                    title="Copy User ID"
                                ></i>
                            )}
                        </li>
                        {profileData.date && (
                            <li>
                                <i className="fas fa-calendar-alt profile-icon"></i>
                                <strong>Member Since:</strong> <span className="detail-value">{getMemberSince(profileData.date)}</span>
                            </li>
                        )}
                        {profileData.role && (
                            <li>
                                <i className="fas fa-user-tag profile-icon"></i>
                                <strong>Role:</strong> <span className="detail-value">{profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}</span>
                            </li>
                        )}
                        {profileData.phoneNumber && ( // Display phone number if available
                            <li>
                                <i className="fas fa-phone profile-icon"></i>
                                <strong>Phone:</strong> <span className="detail-value">{profileData.phoneNumber}</span>
                            </li>
                        )}
                    </ul>

                    {/* Social Links Section - Conditionally rendered */}
                    {hasSocialLinks && (
                        <>
                            <h4 className="text-xl font-semibold text-brown-800 mt-4 mb-3 section-title">Social Links</h4>
                            <ul className="list-unstyled profile-details-list social-links-list">
                                {profileData.socialLinks.goodreads && (
                                    <li>
                                        <i className="fab fa-goodreads profile-icon social-icon goodreads-icon"></i>
                                        <strong>Goodreads:</strong> <a href={profileData.socialLinks.goodreads} target="_blank" rel="noopener noreferrer" className="profile-link">{profileData.socialLinks.goodreads}</a>
                                    </li>
                                )}
                                {profileData.socialLinks.twitter && (
                                    <li>
                                        <i className="fab fa-twitter profile-icon social-icon twitter-icon"></i>
                                        <strong>Twitter:</strong> <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="profile-link">{profileData.socialLinks.twitter}</a>
                                    </li>
                                )}
                                {profileData.socialLinks.instagram && (
                                    <li>
                                        <i className="fab fa-instagram profile-icon social-icon instagram-icon"></i>
                                        <strong>Instagram:</strong> <a href={profileData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="profile-link">{profileData.socialLinks.instagram}</a>
                                    </li>
                                )}
                            </ul>
                        </>
                    )}

                    {/* Reading Snapshot Section */}
                    <h4 className="text-xl font-semibold text-brown-800 mt-4 mb-3 section-title">Reading Snapshot</h4>
                    {!hasReadingStats && (
                        <div className="text-center p-3 bg-light-brown-50 rounded border border-light-brown-100 mb-3">
                            <p className="text-gray-700 mb-0">
                                <i className="fas fa-book-reader me-2"></i>
                                Looks like your reading journey is just beginning!
                                Start logging books to see your amazing stats here.
                            </p>
                        </div>
                    )}
                    <ul className="list-unstyled profile-details-list">
                        <li>
                            <i className="fas fa-book-open profile-icon"></i>
                            <strong>Books Finished:</strong> <span className="detail-value">{profileData.booksFinished || 0}</span>
                        </li>
                        <li>
                            <i className="fas fa-star profile-icon"></i>
                            <strong>Average Rating:</strong> <span className="detail-value">{profileData.averageRating || 'N/A'}</span>
                        </li>
                        <li>
                            <i className="fas fa-bookmark profile-icon"></i>
                            <strong>Favorite Genre:</strong> <span className="detail-value">{profileData.favoriteGenre || 'N/A'}</span>
                        </li>
                    </ul>
                </Card.Body>

                {/* Profile Actions Section - Only show Edit Profile for the current user */}
                {isCurrentUserProfile && (
                    <div className="profile-actions-section p-4 border-top border-light-brown-100 d-flex justify-content-center">
                        <Button
                            variant="primary"
                            onClick={handleEditProfileClick}
                            className="custom-button w-50 profile-edit-button"
                        >
                            <i className="fas fa-user-edit me-2"></i> Edit Profile
                        </Button>
                    </div>
                )}
            </Card>

            {/* Edit Profile Modal (only shown for current user) */}
            {isCurrentUserProfile && (
                <EditProfile
                    show={showEditProfileModal}
                    onHide={handleCloseEditProfileModal}
                />
            )}

            <style jsx>{`
                /* Font Imports for a more intriguing look */
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:wght@400;600&display=swap');

                /* Color Palette Variables */
                :root {
                    --primary-brown: #5A4434; /* Dark Brown */
                    --secondary-brown: #7B6A5A; /* Medium Brown */
                    --light-brown-100: #F8F4ED; /* Lightest Beige */
                    --light-brown-50: #FDFBF5;  /* Off-white */
                    --border-color: #E0D9C8;    /* Muted border */
                    --accent-gold: #D4AF37;     /* Gold for highlights */
                    --text-dark: #4A382E;       /* Very dark brown for main text */
                    --text-medium: #4A5568;     /* Grayish-brown for secondary text */
                    --text-light: #718096;      /* Lighter gray for subtle text */
                    --shadow-color: rgba(0, 0, 0, 0.1);
                }

                /* General Container and Text Styles */
                .profile-container {
                    background-color: var(--light-brown-100);
                    padding: 2.5rem !important; /* Increased padding */
                    border-radius: 1.5rem !important; /* More rounded */
                    box-shadow: 0 10px 25px var(--shadow-color); /* Deeper shadow */
                    background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e0d9c8" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 54v-4H4v4H0v2h4v4h2v-4h4v-2H6zm0-20v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 14v-4H4v4H0v2h4v4h2v-4h4v-2H6zm30 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM18 54v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM48 54v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM0 36v-2h2v2H0zm0 20v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2z"%3E%3C/g%3E%3C/g%3E%3C/svg%3E'); /* Subtle pattern */
                    background-repeat: repeat;
                }

                .profile-title {
                    font-family: 'Playfair Display', serif; /* More elegant font */
                    color: var(--text-dark);
                    letter-spacing: 0.05em; /* Add some spacing */
                    font-size: 3.5rem !important; /* Larger title */
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                }

                /* Profile Card Styles */
                .profile-card {
                    border: 1px solid var(--border-color);
                    background-color: #ffffff;
                    border-radius: 1rem !important; /* More rounded */
                    box-shadow: 0 8px 20px var(--shadow-color); /* Deeper shadow */
                    max-width: 700px; /* Slightly wider card */
                    margin: 0 auto;
                    overflow: hidden; /* Ensures rounded corners are respected */
                }

                .profile-header-section {
                    background-color: var(--light-brown-50);
                    border-bottom: 2px solid var(--border-color); /* More prominent border */
                    padding-bottom: 2rem !important;
                    position: relative; /* For potential overlay effects */
                }

                .profile-avatar {
                    width: 120px; /* Larger avatar */
                    height: 120px;
                    border-radius: 50%;
                    background-color: var(--secondary-brown); /* Medium brown background */
                    color: white; /* White initial */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 3.5rem; /* Larger font for initial */
                    font-weight: bold;
                    border: 4px solid var(--accent-gold); /* Gold border */
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2); /* Stronger shadow */
                    margin: 0 auto 1.5rem auto;
                    overflow: hidden;
                    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
                }
                .profile-avatar:hover {
                    transform: scale(1.05) rotate(2deg); /* Subtle hover effect */
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                }

                .profile-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .profile-username-display {
                    font-family: 'Lora', serif; /* Elegant font for username */
                    color: var(--text-dark);
                    font-size: 2.5rem !important; /* Slightly larger username */
                    font-weight: 600;
                    margin-bottom: 0.5rem !important;
                }

                .profile-bio {
                    font-family: 'Lora', serif;
                    color: var(--text-medium);
                    font-style: italic;
                    max-width: 80%;
                    margin: 0.5rem auto 0 auto;
                    line-height: 1.6;
                }

                /* Profile Details Section */
                .profile-details-section {
                    padding: 2.5rem !important; /* Increased padding */
                }

                .section-title {
                    font-family: 'Playfair Display', serif;
                    color: var(--primary-brown);
                    font-size: 1.8rem !important;
                    margin-bottom: 1.5rem !important;
                    position: relative;
                    padding-bottom: 0.5rem;
                }
                .section-title::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    width: 50px; /* Short underline */
                    height: 3px;
                    background-color: var(--accent-gold);
                    border-radius: 2px;
                }

                .profile-details-list li {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem; /* More spacing */
                    color: var(--text-medium);
                    font-size: 1.1rem; /* Slightly larger text */
                    padding: 0.5rem 0;
                    border-bottom: 1px dashed var(--border-color); /* Dashed separator */
                }
                .profile-details-list li:last-child {
                    border-bottom: none;
                }

                .profile-details-list li strong {
                    color: var(--text-dark);
                    margin-right: 0.75rem;
                    min-width: 150px; /* Align labels better */
                    font-weight: 600;
                }

                .detail-value {
                    font-family: 'Lora', serif;
                    color: var(--text-dark);
                }

                .profile-icon {
                    color: var(--secondary-brown); /* Icon color */
                    margin-right: 1.2rem; /* More space */
                    font-size: 1.5rem; /* Larger icons */
                    width: 30px; /* Fixed width for alignment */
                    text-align: center;
                    transition: transform 0.2s ease-in-out;
                }
                .profile-details-list li:hover .profile-icon {
                    transform: translateX(5px); /* Slide effect on hover */
                }

                .copy-icon {
                    color: var(--secondary-brown);
                    cursor: pointer;
                    font-size: 1rem;
                    margin-left: 0.5rem;
                    transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;
                }
                .copy-icon:hover {
                    color: var(--primary-brown);
                    transform: scale(1.1);
                }

                .social-links-list .social-icon {
                    font-size: 1.8rem; /* Larger social icons */
                }
                .social-links-list .goodreads-icon { color: #633318; } /* Goodreads brown */
                .social-links-list .twitter-icon { color: #1DA1F2; }  /* Twitter blue */
                .social-links-list .instagram-icon {
                    background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .social-links-list li:hover .profile-link {
                    color: var(--primary-brown); /* Darker on hover */
                }
                .social-links-list li:hover .social-icon {
                    transform: scale(1.1); /* Slight zoom on hover */
                }


                .profile-link {
                    color: var(--secondary-brown);
                    text-decoration: underline;
                    font-weight: 600;
                    transition: color 0.2s ease-in-out;
                }
                .profile-link:hover {
                    color: var(--primary-brown);
                    text-decoration: none;
                }

                /* Profile Actions Section */
                .profile-actions-section {
                    background-color: var(--light-brown-50);
                    border-top: 2px solid var(--border-color); /* More prominent border */
                    padding: 2rem !important;
                }

                .profile-edit-button {
                    background: linear-gradient(135deg, var(--primary-brown) 0%, var(--secondary-brown) 100%);
                    border: none;
                    color: white;
                    border-radius: 0.75rem !important; /* Very rounded */
                    padding: 0.8rem 2rem !important; /* Larger button */
                    font-size: 1.1rem;
                    font-weight: bold;
                    letter-spacing: 0.03em;
                    transition: all 0.3s ease-in-out;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                }
                .profile-edit-button:hover {
                    background: linear-gradient(135deg, var(--secondary-brown) 0%, var(--primary-brown) 100%);
                    transform: translateY(-3px) scale(1.02); /* Lift and slight scale */
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
                }
                .profile-edit-button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }

                /* Minimalist Alert Styles (copied from Dashboard/Login) */
                .alert-minimal {
                    background-color: #f0f8ff; /* Light blue for info */
                    border-color: #d0e8ff;
                    color: #31708f;
                    font-size: 1rem;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    text-align: center;
                }
                .alert-minimal.alert-danger {
                    background-color: #ffe0e0;
                    border-color: #ffc0c0;
                    color: #a94442;
                }
                .alert-minimal.alert-warning {
                    background-color: #fff8e1;
                    border-color: #ffe0b2;
                    color: #8a6d3b;
                }

                /* Minimalist Spinner/Loading Styles (copied from Dashboard) */
                .spinner-minimal {
                    color: #5a4434 !important; /* Match primary brown */
                }
                .loading-text {
                    color: #777777;
                    margin-top: 1rem;
                }


                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .profile-container {
                        padding: 1.5rem !important;
                        margin: 1rem auto !important;
                    }
                    .profile-title {
                        font-size: 2.5rem !important;
                    }
                    .profile-card {
                        border-radius: 0.75rem !important;
                    }
                    .profile-avatar {
                        width: 90px;
                        height: 90px;
                        font-size: 2.8rem;
                        border-width: 3px;
                    }
                    .profile-username-display {
                        font-size: 2rem !important;
                    }
                    .profile-bio {
                        font-size: 0.95rem;
                        max-width: 95%;
                    }
                    .profile-details-section {
                        padding: 1.5rem !important;
                    }
                    .section-title {
                        font-size: 1.5rem !important;
                        margin-bottom: 1rem !important;
                    }
                    .profile-details-list li {
                        font-size: 1rem;
                        margin-bottom: 0.75rem;
                    }
                    .profile-details-list li strong {
                        min-width: 100px;
                    }
                    .profile-icon {
                        font-size: 1.3rem;
                        margin-right: 0.8rem;
                        width: 25px;
                    }
                    .social-links-list .social-icon {
                        font-size: 1.5rem;
                    }
                    .profile-actions-section {
                        padding: 1.5rem !important;
                    }
                    .profile-edit-button {
                        width: 80% !important;
                        padding: 0.7rem 1.5rem !important;
                        font-size: 1rem;
                    }
                }
            `}</style>
        </Container>
    );
}

export default Profile;
