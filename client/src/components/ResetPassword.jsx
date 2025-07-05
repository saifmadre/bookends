// src/components/ResetPassword.jsx

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(null);
    const [isTokenValid, setIsTokenValid] = useState(true); // State to check initial token validity

    // Effect to extract token from URL and validate it (basic check)
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const urlToken = queryParams.get('token');

        if (urlToken) {
            setToken(urlToken);
            // Optional: You could make a quick backend call here to validate the token
            // immediately on component load for a better user experience.
            // For now, we'll rely on the /reset-password endpoint to fully validate.
        } else {
            setIsTokenValid(false);
            setMessage('No password reset token found in the URL. Please ensure you clicked the full link from your email.');
            setIsError(true);
            showToast('Invalid reset link.', 'danger', 'Error');
        }
    }, [location.search, showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        if (!password || !confirmPassword) {
            setMessage('Both password fields are required.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        if (!token) {
            setMessage('Password reset token is missing. Please ensure you are using the correct link.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            // Make the API call to your backend's reset-password endpoint
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
                token, // Send the token received from the URL
                newPassword: password
            });

            setMessage(res.data.msg || 'Your password has been reset successfully!');
            setIsError(false);
            showToast('Password reset successful!', 'success', 'Success');
            setPassword('');
            setConfirmPassword('');
            // Redirect to login page after successful reset
            setTimeout(() => navigate('/login'), 3000);

        } catch (error) {
            console.error("Error during password reset:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.msg || "Network error or server unavailable. Please try again.";
            setMessage(errorMessage);
            setIsError(true);
            showToast(errorMessage, 'danger', 'Reset Error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isTokenValid) {
        return (
            <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
                <Alert variant="danger">{message}</Alert>
                <Button variant="primary" onClick={() => navigate('/login')}>Go to Login</Button>
            </Container>
        );
    }

    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Card className="p-4 book-form-container">
                <Card.Body>
                    <h2 className="text-center mb-4 book-form-title">Reset Your Password</h2>

                    {message && (
                        <Alert variant={isError ? 'danger' : 'success'} className="mb-3">
                            {message}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="newPassword">
                            <Form.Label className="book-form-label">New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                className="book-form-control"
                                disabled={isLoading}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="confirmNewPassword">
                            <Form.Label className="book-form-label">Confirm New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength="6"
                                className="book-form-control"
                                disabled={isLoading}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 book-form-button" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ResetPassword;
