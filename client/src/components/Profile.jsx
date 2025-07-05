// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Card, Container, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth to get the token

function Profile() {
    // Destructure user, isAuthenticated, token, and authLoading state from useAuth
    const { user, isAuthenticated, token, loading: authLoading } = useAuth();
    const [profileData, setProfileData] = useState(null); // State to store fetched profile data
    const [loading, setLoading] = useState(true); // Component's internal loading status for profile data fetch
    const [error, setError] = useState(''); // State to store any fetch errors

    useEffect(() => {
        const fetchProfile = async () => {
            // Log for debugging: See what states are when useEffect runs
            console.log("Profile.jsx: useEffect triggered. authLoading:", authLoading, "isAuthenticated:", isAuthenticated, "token:", token ? "Present" : "Absent", "user:", user);

            // 1. If AuthContext is still loading, keep Profile.jsx in its loading state and wait.
            if (authLoading) {
                setLoading(true); // Keep local loading true while auth is loading
                setError(''); // Clear any previous errors
                setProfileData(null); // Clear previous data
                return; // Exit early, wait for auth context to be ready
            }

            // 2. Once authLoading is false, check authentication status.
            if (isAuthenticated && token) {
                console.log("Profile.jsx: AuthContext reports authenticated and token present. Proceeding to fetch profile.");
                setLoading(true); // Set local loading true when actively fetching profile data
                setError('');
                try {
                    const response = await fetch('http://localhost:5000/api/profile', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token, // Send the JWT directly from the 'token' state
                        },
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setProfileData(data); // Set the fetched profile data
                        console.log("Profile.jsx: Profile data fetched successfully.");
                    } else {
                        // Backend returned an error (e.g., 401 if token is actually invalid server-side)
                        console.error("Profile.jsx: Failed to fetch profile data from API.", data);
                        setError(data.msg || 'Failed to fetch profile data. Please ensure you are logged in.');
                    }
                } catch (err) {
                    console.error("Profile.jsx: Network error or server error fetching profile:", err);
                    setError('Network error or server unavailable. Please check your connection and try again.');
                } finally {
                    setLoading(false); // Stop local loading regardless of success or failure
                }
            } else {
                // 3. If not authenticated or no token after authLoading is false, display the "not logged in" message.
                console.log("Profile.jsx: AuthContext reports NOT authenticated or token missing. Displaying login prompt.");
                setLoading(false); // No loading for this state, directly show error
                setError('You are not authenticated to view this profile. Please log in.');
                setProfileData(null); // Clear any previous data
            }
        };

        fetchProfile();
        // Dependencies: Crucially, 'token' is key, as it's the most direct indicator of auth change.
        // 'authLoading' ensures we wait for context to stabilize.
        // 'isAuthenticated' and 'user' are also included for completeness, but 'token' and 'authLoading' are primary.
    }, [token, authLoading, isAuthenticated, user]);

    // Display loading state specifically for AuthContext's initial check
    if (authLoading) {
        return (
            <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
                <Spinner animation="border" role="status" className="book-form-text">
                    <span className="visually-hidden">Loading authentication status...</span>
                </Spinner>
                <p className="book-form-text mt-3">Verifying authentication status...</p>
            </Container>
        );
    }

    // Display loading state for fetching profile data (after auth is resolved)
    if (loading) {
        return (
            <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
                <Spinner animation="border" role="status" className="book-form-text">
                    <span className="visually-hidden">Loading profile...</span>
                </Spinner>
                <p className="book-form-text mt-3">Loading profile data...</p>
            </Container>
        );
    }

    // Display error message if there is one
    if (error) {
        return (
            <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
                <Alert variant="danger" className="mb-0">{error}</Alert>
            </Container>
        );
    }

    // Display profile data if successfully loaded
    return (
        <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
            <h2 className="book-form-title mb-4">Your Profile</h2>
            {profileData ? (
                <Card className="text-left mt-4 p-3 book-form-container">
                    <Card.Body>
                        <Card.Title className="book-form-label">Profile Details:</Card.Title>
                        <Card.Text className="book-form-text">
                            <strong>Username:</strong> {profileData.username || 'N/A'}<br />
                            <strong>Email:</strong> {profileData.email || 'N/A'}<br />
                            <strong>User ID:</strong> {profileData._id || 'N/A'} {/* MongoDB _id */}
                            {profileData.date && ( // Only show if date exists
                                <><strong>Registration Date:</strong> {new Date(profileData.date).toLocaleDateString() || 'N/A'}<br /></>
                            )}
                        </Card.Text>
                    </Card.Body>
                </Card>
            ) : (
                // This case should ideally not be reached if error handling is robust, but kept as a fallback
                <Alert variant="info" className="mb-0">No profile data found.</Alert>
            )}
        </Container>
    );
}

export default Profile;