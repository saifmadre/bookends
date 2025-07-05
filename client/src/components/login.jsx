// src/components/login.jsx

import axios from 'axios'; // Import axios for consistent API calls
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Container, Form, Modal, Spinner } from 'react-bootstrap'; // Added Modal
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Login() {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- New states for client-side rate limiting ---
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(0); // Timestamp when lockout ends
    const lockoutTimerRef = useRef(null); // Ref to store the lockout timer ID

    const MAX_ATTEMPTS = 5; // Maximum failed attempts before lockout
    const LOCKOUT_DURATION = 60 * 1000; // 1 minute lockout in milliseconds

    // --- New states for password reset modal ---
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
    const [resetEmailMessage, setResetEmailMessage] = useState('');


    const { login } = useAuth();
    const { showToast } = useToast();

    // Clear lockout timer on component unmount
    useEffect(() => {
        return () => {
            if (lockoutTimerRef.current) {
                clearInterval(lockoutTimerRef.current);
            }
        };
    }, []);

    // Effect to manage the countdown during lockout
    useEffect(() => {
        if (lockoutTime > Date.now()) {
            // Set up an interval to update remaining time
            const interval = setInterval(() => {
                if (lockoutTime <= Date.now()) {
                    setLockoutTime(0); // Clear lockout
                    setFailedAttempts(0); // Reset attempts after lockout
                    setMessage(''); // Clear lockout message
                    clearInterval(interval);
                }
            }, 1000); // Update every second
            lockoutTimerRef.current = interval;
            return () => clearInterval(interval); // Clean up on unmount or if lockout ends
        } else if (lockoutTime > 0 && lockoutTime <= Date.now()) {
            // If lockoutTime was set in the past, clear it immediately
            setLockoutTime(0);
            setFailedAttempts(0);
            setMessage('');
        }
    }, [lockoutTime]);


    const handleIdentifierChange = (e) => {
        setIdentifier(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        // Check for active lockout
        if (lockoutTime > Date.now()) {
            const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000);
            setMessage(`Too many failed attempts. Please try again in ${remainingSeconds} seconds.`);
            setIsError(true);
            showToast(`Login temporarily disabled. Try again in ${remainingSeconds} seconds.`, 'warning', 'Rate Limited');
            return;
        }

        if (!identifier || !password) {
            setMessage('Both identifier (email or phone number) and password are required.');
            setIsError(true);
            showToast('Both identifier and password are required.', 'danger', 'Login Error');
            return;
        }

        setIsLoading(true);

        try {
            await login({ identifier, password, rememberMe });

            setMessage('Login successful!');
            setIsError(false);
            showToast('Login successful!', 'success', 'Success');

            setIdentifier('');
            setPassword('');
            setFailedAttempts(0); // Reset attempts on successful login
            setLockoutTime(0); // Clear any pending lockout

            navigate('/dashboard');

        } catch (error) {
            console.error("Error during login:", error);
            const errorMessage = error.response?.data?.msg || "Network error or server unavailable. Please check your connection and try again.";
            setMessage(errorMessage);
            setIsError(true);

            // --- Rate Limiting Logic on Failure ---
            setFailedAttempts(prev => prev + 1);
            if (failedAttempts + 1 >= MAX_ATTEMPTS) {
                const newLockoutTime = Date.now() + LOCKOUT_DURATION;
                setLockoutTime(newLockoutTime);
                const remainingSeconds = Math.ceil(LOCKOUT_DURATION / 1000);
                setMessage(`Too many failed login attempts. Please try again in ${remainingSeconds} seconds.`);
                showToast(`Too many failed attempts. Login disabled for ${remainingSeconds} seconds.`, 'error', 'Login Blocked');
            } else {
                showToast(errorMessage, 'danger', 'Login Error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setResetEmailMessage('');
        setIsSendingResetEmail(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!forgotPasswordEmail || !emailRegex.test(forgotPasswordEmail)) {
            setResetEmailMessage('Please enter a valid email address.');
            setIsSendingResetEmail(false);
            return;
        }

        try {
            // Using axios for consistency and better error handling capabilities
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: forgotPasswordEmail });

            setResetEmailMessage(res.data.msg || 'Password reset link sent to your email if an account exists.');
            showToast('Password reset email sent!', 'success', 'Success');
            setShowForgotPasswordModal(false); // Close modal on success
            setForgotPasswordEmail(''); // Clear email field

        } catch (error) {
            console.error("Error sending reset email:", error);
            // axios errors typically have response.data for backend messages
            const errorMessage = error.response?.data?.msg || "Network error or server unavailable. Please try again.";
            setResetEmailMessage(errorMessage);
            showToast(errorMessage, 'danger', 'Error');
        } finally {
            setIsSendingResetEmail(false);
        }
    };


    const isFormValid = identifier && password && lockoutTime <= Date.now(); // Disable if locked out

    const getRemainingLockoutTime = () => {
        if (lockoutTime <= Date.now()) return 0;
        return Math.ceil((lockoutTime - Date.now()) / 1000);
    };

    return (
        <Container className="book-form-container my-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 book-form-title">Login to Your Account</h2>

            {message && (
                <Alert variant={isError ? 'danger' : 'success'} className="mb-3">
                    {message}
                </Alert>
            )}
            {lockoutTime > Date.now() && (
                <Alert variant="warning" className="mb-3 text-center">
                    Login disabled for {getRemainingLockoutTime()} seconds due to too many failed attempts.
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginFormIdentifier">
                    <Form.Label className="book-form-label">Email or Phone Number</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter your email or phone number"
                        value={identifier}
                        onChange={handleIdentifierChange}
                        required
                        className="book-form-control"
                        disabled={isLoading || lockoutTime > Date.now()} // Disable during lockout
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="loginFormPassword">
                    <Form.Label className="book-form-label">Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="book-form-control"
                        disabled={isLoading || lockoutTime > Date.now()} // Disable during lockout
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="loginFormRememberMe">
                    <Form.Check
                        type="checkbox"
                        label="Remember Me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="text-gray-700 font-medium cursor-pointer"
                        style={{ accentColor: '#5a4434' }}
                        disabled={isLoading || lockoutTime > Date.now()} // Disable during lockout
                    />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Button variant="link" className="book-form-link p-0" onClick={() => setShowForgotPasswordModal(true)} disabled={isLoading || lockoutTime > Date.now()}>
                        Forgot Password?
                    </Button>
                </div>


                <Button variant="primary" type="submit" className="w-100 book-form-button" disabled={isLoading || !isFormValid || lockoutTime > Date.now()}>
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
                            Logging in...
                        </>
                    ) : (
                        'Login'
                    )}
                </Button>
            </Form>

            <p className="text-center mt-3 book-form-text">
                Don't have an account?
                <a href="#" className="book-form-link" onClick={() => navigate('/register')}>
                    Register
                </a>
            </p>

            {/* Forgot Password Modal */}
            <Modal show={showForgotPasswordModal} onHide={() => {
                setShowForgotPasswordModal(false);
                setForgotPasswordEmail('');
                setResetEmailMessage('');
            }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Forgot Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">Enter your email address to receive a password reset link.</p>
                    {resetEmailMessage && (
                        <Alert variant={resetEmailMessage.includes('sent') ? 'success' : 'danger'} className="mb-3">
                            {resetEmailMessage}
                        </Alert>
                    )}
                    <Form onSubmit={handleForgotPasswordSubmit}>
                        <Form.Group className="mb-3" controlId="forgotPasswordEmail">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                required
                                disabled={isSendingResetEmail}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={() => {
                                setShowForgotPasswordModal(false);
                                setForgotPasswordEmail('');
                                setResetEmailMessage('');
                            }} className="me-2" disabled={isSendingResetEmail}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={isSendingResetEmail}>
                                {isSendingResetEmail ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default Login;
