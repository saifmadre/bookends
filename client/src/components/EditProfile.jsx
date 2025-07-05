// src/components/EditProfile.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function EditProfile() {
    // Destructure token and authLoading directly from useAuth, and the new refreshUser function
    const { user, isAuthenticated, token, loading: authLoading, refreshUser } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const [loading, setLoading] = useState(true); // Component's internal loading state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // New state for specific validation errors
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');

    // Define state for fetch-related errors
    const [fetchError, setFetchError] = useState('');

    // Fetch current profile data on component mount
    useEffect(() => {
        const fetchCurrentProfile = async () => {
            // First, check if AuthContext is still loading
            if (authLoading) {
                setLoading(true); // Keep local loading true while auth is loading
                return; // Exit early, wait for auth context to be ready
            }

            // Once authLoading is false, proceed with authentication check
            if (isAuthenticated && token) { // Correctly check for isAuthenticated AND token
                setLoading(true);
                setFetchError(''); // Clear previous fetch errors
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
                        setUsername(data.username || '');
                        setEmail(data.email || '');
                    } else {
                        setMessage(data.msg || 'Failed to load current profile data.');
                        setIsError(true); // Still use isError for overall form message
                        setFetchError(data.msg || 'Failed to load current profile data.'); // Set specific fetch error
                    }
                } catch (err) {
                    console.error("Error fetching current profile:", err);
                    setMessage("Network error or server unavailable.");
                    setIsError(true);
                    setFetchError("Network error or server unavailable."); // Set specific fetch error
                } finally {
                    setLoading(false);
                }
            } else {
                // If not authenticated or no token after authLoading is false, inform the user they need to log in
                setLoading(false); // No loading for this state, directly show error
                setMessage("You need to be logged in to edit your profile.");
                setIsError(true);
                setFetchError("You need to be logged in to edit your profile.");
            }
        };
        fetchCurrentProfile();
    }, [isAuthenticated, user, token, authLoading]); // Depend on isAuthenticated, user object, token, and authLoading

    // Validation functions
    const validateUsername = (name) => {
        if (!name.trim()) {
            setUsernameError('Username cannot be empty.');
            return false;
        }
        if (name.length < 3) {
            setUsernameError('Username must be at least 3 characters.');
            return false;
        }
        setUsernameError('');
        return true;
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Invalid email format (e.g., user@example.com)');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        validateUsername(value);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSubmitting(true);

        const isUsernameValid = validateUsername(username);
        const isEmailValid = validateEmail(email);

        if (!isUsernameValid || !isEmailValid) {
            setMessage('Please correct the errors in the form.');
            setIsError(true);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, // Send the JWT directly from the 'token' state
                },
                body: JSON.stringify({ username, email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg || 'Profile updated successfully!');
                setIsError(false);
                // After successful update, explicitly refresh the user data in AuthContext
                await refreshUser(); // Call the new refreshUser function
            } else {
                setMessage(data.msg || 'Failed to update profile.');
                setIsError(true);
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setMessage("Network error or server unavailable. Please try again later.");
            setIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <p className="book-form-text mt-3">Loading current profile data...</p>
            </Container>
        );
    }

    // Display initial fetch error if present
    if (fetchError) {
        return (
            <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
                <Alert variant="danger" className="mb-0">{fetchError}</Alert>
            </Container>
        );
    }

    const isFormValid = username && email && !usernameError && !emailError;

    return (
        <Container className="book-form-container my-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 book-form-title">Edit Your Profile</h2>

            {message && (
                <Alert variant={isError ? 'danger' : 'success'} className="mb-3">
                    {message}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="editProfileUsername">
                    <Form.Label className="book-form-label">Username</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter new username"
                        value={username}
                        onChange={handleUsernameChange}
                        required
                        className={`book-form-control ${usernameError ? 'is-invalid' : ''}`}
                        disabled={isSubmitting}
                    />
                    {usernameError && <div className="invalid-feedback">{usernameError}</div>}
                </Form.Group>

                <Form.Group className="mb-3" controlId="editProfileEmail">
                    <Form.Label className="book-form-label">Email address</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Enter new email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                        className={`book-form-control ${emailError ? 'is-invalid' : ''}`}
                        disabled={isSubmitting}
                    />
                    {emailError && <div className="invalid-feedback">{emailError}</div>}
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 book-form-button" disabled={isSubmitting || !isFormValid}>
                    {isSubmitting ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Updating...
                        </>
                    ) : (
                        'Update Profile'
                    )}
                </Button>
            </Form>
        </Container>
    );
}

export default EditProfile;
