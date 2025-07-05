// src/components/ChangePassword.jsx
import React, { useState } from 'react';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext'; // To get the token

function ChangePassword() {
    const { user, isAuthenticated } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Validation states
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Password validation logic (same as in Register for consistency)
    const validatePassword = (password) => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number.';
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return 'Password must contain at least one special character (!@#$%^&*).';
        }
        return ''; // No error
    };

    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        setNewPasswordError(validatePassword(value));
        // Re-validate confirm password if new password changes
        if (confirmNewPassword) {
            setConfirmPasswordError(value !== confirmNewPassword ? 'Passwords do not match.' : '');
        }
    };

    const handleConfirmNewPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmNewPassword(value);
        setConfirmPasswordError(newPassword !== value ? 'Passwords do not match.' : '');
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSubmitting(true);

        // Frontend validation
        const newPassError = validatePassword(newPassword);
        const confirmPassError = newPassword !== confirmNewPassword ? 'Passwords do not match.' : '';

        setNewPasswordError(newPassError);
        setConfirmPasswordError(confirmPassError);

        if (newPassError || confirmPassError || !oldPassword || !newPassword || !confirmNewPassword) {
            setMessage('Please correct the errors and fill all fields.');
            setIsError(true);
            setIsSubmitting(false);
            return;
        }

        if (!isAuthenticated || !user?.token) {
            setMessage('You must be logged in to change your password.');
            setIsError(true);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token, // Send the JWT
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg || 'Password changed successfully!');
                setIsError(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setNewPasswordError('');
                setConfirmPasswordError('');
            } else {
                setMessage(data.msg || 'Failed to change password. Please check your old password.');
                setIsError(true);
            }
        } catch (err) {
            console.error("Error changing password:", err);
            setMessage("Network error or server unavailable. Please try again later.");
            setIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = oldPassword && newPassword && confirmNewPassword && !newPasswordError && !confirmPasswordError;

    return (
        <Container className="book-form-container my-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 book-form-title">Change Password</h2>

            {message && (
                <Alert variant={isError ? 'danger' : 'success'} className="mb-3">
                    {message}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="oldPassword">
                    <Form.Label className="book-form-label">Old Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter your old password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        className="book-form-control"
                        disabled={isSubmitting}
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label className="book-form-label">New Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        required
                        className={`book-form-control ${newPasswordError ? 'is-invalid' : ''}`}
                        disabled={isSubmitting}
                    />
                    {newPasswordError && <div className="invalid-feedback">{newPasswordError}</div>}
                </Form.Group>

                <Form.Group className="mb-3" controlId="confirmNewPassword">
                    <Form.Label className="book-form-label">Confirm New Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Confirm your new password"
                        value={confirmNewPassword}
                        onChange={handleConfirmNewPasswordChange}
                        required
                        className={`book-form-control ${confirmPasswordError ? 'is-invalid' : ''}`}
                        disabled={isSubmitting}
                    />
                    {confirmPasswordError && <div className="invalid-feedback">{confirmPasswordError}</div>}
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
                            Changing...
                        </>
                    ) : (
                        'Change Password'
                    )}
                </Button>
            </Form>
        </Container>
    );
}

export default ChangePassword;
