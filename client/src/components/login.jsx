// src/components/Login.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false); // State for rememberMe checkbox
    const { login, isAuthenticated, loading: authLoading } = useAuth(); // Destructure authLoading from useAuth
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Redirect if already authenticated or if isAuthenticated becomes true after login attempt
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            console.log("Login.jsx: isAuthenticated is true, redirecting to /dashboard.");
            showToast('Logged in successfully!', 'success', 'Welcome!'); // Moved success toast here for better timing
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate, authLoading, showToast]); // Added showToast to dependencies for useEffect clean up

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true);

        if (!email || !password) {
            setError('Please fill in both email and password.');
            showToast('Please fill in both email and password.', 'danger', 'Login Error');
            setLoading(false);
            return;
        }

        try {
            await login({ identifier: email, password: password });
            // The redirection and success toast now primarily happen in the useEffect
        } catch (err) {
            console.error("Login.jsx: Login error:", err);
            let errorMessage = "Failed to log in. Please check your credentials.";
            if (err.code) {
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'Invalid email or password.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address format.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many login attempts. Please try again later.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                    default:
                        errorMessage = err.message;
                }
            }
            setError(errorMessage);
            showToast(errorMessage, 'danger', 'Login Failed');
        } finally {
            setLoading(false); // Ensure loading spinner is hidden even on error
        }
    };

    return (
        <div className="login-background d-flex justify-content-center align-items-center min-vh-100 py-4">
            <Container>
                <Card className="login-card p-4 shadow-lg rounded-xl">
                    <Card.Body className="p-sm-5">
                        <h2 className="login-title mb-2 text-center">Welcome Back!</h2>
                        <p className="login-subtitle mb-4 text-center">Sign in to continue your reading journey.</p>

                        {error && <Alert variant="danger" className="login-alert text-center">{error}</Alert>}

                        {/* Display an info alert if AuthContext is still loading initial auth state */}
                        {authLoading && !isAuthenticated && (
                            <Alert variant="info" className="login-alert text-center">
                                Verifying authentication status...
                            </Alert>
                        )}


                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="email">
                                <Form.Label className="login-label">Email Address</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="login-input-icon"><i className="fas fa-envelope"></i></InputGroup.Text>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="login-input"
                                        disabled={loading || authLoading}
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="password">
                                <Form.Label className="login-label">Password</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="login-input-icon"><i className="fas fa-lock"></i></InputGroup.Text>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="login-input"
                                        disabled={loading || authLoading}
                                    />
                                </InputGroup>
                            </Form.Group>

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="rememberMe"
                                    label="Remember Me"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="login-checkbox-label"
                                />
                                <Link to="/forgot-password" className="login-forgot-password-link">Forgot Password?</Link>
                            </div>

                            <Button variant="primary" type="submit" className="login-button w-100" disabled={loading || authLoading}>
                                {loading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Logging In...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </Button>
                        </Form>

                        <p className="login-footer-text text-center mt-4">
                            Don't have an account? <Link to="/register" className="login-register-link">Register Here</Link>
                        </p>
                    </Card.Body>
                </Card>
            </Container>

            <style jsx>{`
                /* Font Imports */
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:wght@400;600&display=swap');

                /* Color Palette Variables (consistent with Dashboard and Profile) */
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

                .login-background {
                    background-color: var(--light-brown-100);
                    background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e0d9c8" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 54v-4H4v4H0v2h4v4h2v-4h4v-2H6zm0-20v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 14v-4H4v4H0v2h4v4h2v-4h4v-2H6zm30 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM18 54v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM48 54v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM0 36v-2h2v2H0zm0 20v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2z"%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
                    background-repeat: repeat;
                }

                .login-card {
                    max-width: 450px;
                    width: 100%;
                    border: none;
                    border-radius: 1.5rem;
                    background-color: var(--light-brown-50);
                    box-shadow: 0 15px 30px var(--shadow-color);
                }

                .login-title {
                    font-family: 'Playfair Display', serif;
                    color: var(--primary-brown);
                    font-size: 2.5rem;
                    font-weight: 700;
                }

                .login-subtitle {
                    font-family: 'Lora', serif;
                    color: var(--text-medium);
                    font-size: 1.1rem;
                }

                .login-label {
                    color: var(--text-dark);
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .login-input, .login-input-password {
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    padding: 0.8rem 1rem;
                    font-size: 1rem;
                    color: var(--text-dark);
                    background-color: white;
                    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .login-input:focus, .login-input-password:focus {
                    border-color: var(--primary-brown);
                    box-shadow: 0 0 0 0.25rem rgba(90, 68, 52, 0.25);
                    outline: none;
                }

                .login-input-group .login-input-icon {
                    background-color: var(--border-color);
                    border-color: var(--border-color);
                    color: var(--primary-brown);
                    border-top-left-radius: 0.5rem;
                    border-bottom-left-radius: 0.5rem;
                    padding: 0.8rem 1rem;
                }
                .login-input-group .form-control {
                    border-top-left-radius: 0 !important;
                    border-bottom-left-radius: 0 !important;
                }

                .login-checkbox-label .form-check-input {
                    border-color: var(--primary-brown);
                    margin-right: 0.5rem;
                }
                .login-checkbox-label .form-check-input:checked {
                    background-color: var(--primary-brown);
                    border-color: var(--primary-brown);
                }
                .login-checkbox-label .form-check-label {
                    color: var(--text-medium);
                }

                .login-forgot-password-link, .login-register-link {
                    color: var(--primary-brown);
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.2s ease-in-out;
                }
                .login-forgot-password-link:hover, .login-register-link:hover {
                    color: var(--secondary-brown);
                    text-decoration: underline;
                }

                .login-button {
                    background-color: var(--primary-brown);
                    border-color: var(--primary-brown);
                    color: white;
                    border-radius: 0.75rem;
                    padding: 0.9rem 1.5rem;
                    font-size: 1.1rem;
                    font-weight: 700;
                    transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .login-button:hover {
                    background-color: var(--secondary-brown);
                    border-color: var(--secondary-brown);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(90, 68, 52, 0.25);
                }
                .login-button:active {
                    transform: translateY(0);
                    box-shadow: 0 3px 10px rgba(90, 68, 52, 0.2);
                }

                .login-button .spinner-border {
                    color: white !important;
                }

                .login-footer-text {
                    color: var(--text-medium);
                    font-size: 0.95rem;
                }

                .login-alert {
                    font-size: 0.9rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                /* Responsive Adjustments */
                @media (max-width: 576px) {
                    .login-card {
                        padding: 1.5rem;
                        border-radius: 1rem;
                    }
                    .login-title {
                        font-size: 2rem;
                    }
                    .login-subtitle {
                        font-size: 1rem;
                    }
                    .login-button {
                        padding: 0.7rem 1.2rem;
                        font-size: 1rem;
                    }
                    .login-input {
                        padding: 0.6rem 0.8rem;
                    }
                    .login-input-group .login-input-icon {
                        padding: 0.6rem 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default Login;