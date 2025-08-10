// src/components/login.jsx
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
    const { login, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

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
            // FIX: Pass an object to the login function as expected by AuthContext
            await login({ identifier: email, password: password, rememberMe: rememberMe });
            showToast('Login successful!', 'success', 'Welcome!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
            let errorMessage = 'Failed to log in. Please check your credentials.';
            // Check for specific error messages from the backend or Firebase Auth
            if (err.response && err.response.data && err.response.data.msg) {
                errorMessage = err.response.data.msg;
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many login attempts. Please try again later.';
            }
            setError(errorMessage);
            showToast(errorMessage, 'danger', 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <Container className="d-flex align-items-center justify-content-center min-vh-100">
                <Card className="login-card">
                    <Card.Body className="p-4 p-md-5">
                        <h2 className="text-center mb-4 login-title">Welcome Back!</h2>
                        <p className="text-center mb-4 login-subtitle">Sign in to continue your reading journey.</p>
                        {error && <Alert variant="danger" className="login-alert">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group id="email" className="mb-3">
                                <Form.Label className="login-label">Email Address</Form.Label>
                                <InputGroup className="login-input-group">
                                    <InputGroup.Text className="login-input-icon"><i className="fas fa-envelope"></i></InputGroup.Text>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="login-input"
                                        placeholder="your.email@example.com"
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group id="password" className="mb-4">
                                <Form.Label className="login-label">Password</Form.Label>
                                <InputGroup className="login-input-group">
                                    <InputGroup.Text className="login-input-icon"><i className="fas fa-lock"></i></InputGroup.Text>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="login-input"
                                        placeholder="Enter your password"
                                    />
                                </InputGroup>
                            </Form.Group>

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Form.Group controlId="rememberMe">
                                    <Form.Check
                                        type="checkbox"
                                        label="Remember Me"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="login-checkbox"
                                    />
                                </Form.Group>
                                <Link to="/reset-password" className="login-link">Forgot Password?</Link>
                            </div>

                            <Button disabled={loading} className="w-100 login-button" type="submit">
                                {loading ? (
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                ) : (
                                    <i className="fas fa-sign-in-alt me-2"></i>
                                )}
                                {loading ? 'Logging In...' : 'Login'}
                            </Button>
                        </Form>

                        <div className="w-100 text-center mt-4 login-footer-text">
                            Don't have an account? <Link to="/register" className="login-link">Register Here</Link>
                        </div>
                    </Card.Body>
                </Card>
            </Container>

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

                .login-page-container {
                    background: linear-gradient(135deg, var(--light-brown-100) 0%, var(--light-brown-50) 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow: hidden;
                    position: relative;
                }

                .login-page-container::before {
                    content: '';
                    position: absolute;
                    top: -50px;
                    left: -50px;
                    width: 200px;
                    height: 200px;
                    background: var(--accent-gold);
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: float1 10s ease-in-out infinite;
                }

                .login-page-container::after {
                    content: '';
                    position: absolute;
                    bottom: -50px;
                    right: -50px;
                    width: 250px;
                    height: 250px;
                    background: var(--secondary-brown);
                    border-radius: 50%;
                    filter: blur(90px);
                    opacity: 0.25;
                    animation: float2 12s ease-in-out infinite reverse;
                }

                @keyframes float1 {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(20px, 30px) rotate(5deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                @keyframes float2 {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(-25px, -35px) rotate(-7deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                .login-card {
                    background-color: #ffffff;
                    border: 1px solid var(--border-color);
                    border-radius: 1.5rem; /* More rounded corners */
                    box-shadow: 0 15px 40px var(--shadow-color);
                    width: 100%;
                    max-width: 450px; /* Slightly wider for better aesthetics */
                    position: relative;
                    z-index: 10; /* Ensure card is above floating elements */
                    overflow: hidden; /* For inner shadow effects */
                    transition: all 0.3s ease-in-out;
                }

                .login-card:hover {
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                }

                .login-title {
                    font-family: 'Playfair Display', serif;
                    color: var(--primary-brown);
                    font-size: 2.5rem; /* Larger and more impactful */
                    margin-bottom: 0.75rem;
                    letter-spacing: 0.03em;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
                }

                .login-subtitle {
                    font-family: 'Lora', serif;
                    color: var(--text-medium);
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }

                .login-label {
                    font-family: 'Lora', serif;
                    color: var(--text-dark);
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                    font-size: 0.95rem;
                }

                .login-input-group .login-input-icon {
                    background-color: var(--light-brown-100);
                    border: 1px solid var(--border-color);
                    border-right: none;
                    color: var(--secondary-brown);
                    padding: 0.75rem 1rem;
                    border-top-left-radius: 0.5rem;
                    border-bottom-left-radius: 0.5rem;
                }

                .login-input {
                    border: 1px solid var(--border-color);
                    border-left: none;
                    border-top-right-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    color: var(--text-dark);
                    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }

                .login-input:focus {
                    border-color: var(--primary-brown);
                    box-shadow: 0 0 0 0.2rem rgba(90, 68, 52, 0.25);
                    background-color: var(--light-brown-50);
                }

                .login-checkbox .form-check-input {
                    border-color: var(--secondary-brown);
                    margin-top: 0.25rem;
                }
                .login-checkbox .form-check-input:checked {
                    background-color: var(--primary-brown);
                    border-color: var(--primary-brown);
                }
                .login-checkbox .form-check-label {
                    color: var(--text-medium);
                    font-size: 0.9rem;
                }

                .login-link {
                    color: var(--primary-brown);
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.2s ease-in-out, text-decoration 0.2s ease-in-out;
                }

                .login-link:hover {
                    color: var(--accent-gold);
                    text-decoration: underline;
                }

                .login-button {
                    background-color: var(--primary-brown);
                    border: none;
                    border-radius: 0.75rem; /* More rounded button */
                    padding: 0.8rem 1.5rem;
                    font-size: 1.1rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    transition: all 0.3s ease-in-out;
                    box-shadow: 0 5px 15px rgba(90, 68, 52, 0.2);
                }

                .login-button:hover {
                    background-color: var(--secondary-brown);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(90, 68, 52, 0.3);
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
