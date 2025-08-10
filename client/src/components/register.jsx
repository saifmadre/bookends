import React, { useState } from 'react';
import { Alert, Button, Card, Container, Form, InputGroup, Spinner } from 'react-bootstrap'; // Added Spinner and InputGroup
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

    const { register } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            showToast('Passwords do not match.', 'danger', 'Registration Error');
            return;
        }

        try {
            await register({ username, email, password, phoneNumber });
            showToast('Registration successful! You can now log in.', 'success', 'Registration Success');
            navigate('/login');
        } catch (err) {
            console.error('Registration failed:', err);
            let errorMessage = 'Failed to register. Please try again.';
            if (err.response && err.response.data && err.response.data.msg) {
                errorMessage = err.response.data.msg;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            showToast('Failed to register: ' + errorMessage, 'danger', 'Registration Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page-container"> {/* Changed class name for consistency */}
            <Container className="d-flex align-items-center justify-content-center min-vh-100">
                <Card className="register-card"> {/* Changed class name for consistency */}
                    <Card.Body className="p-4 p-md-5">
                        <h2 className="text-center mb-4 register-title">Create Your Account</h2> {/* Consistent title style */}
                        <p className="text-center mb-4 register-subtitle">Join us and start your reading journey!</p> {/* Consistent subtitle style */}
                        {error && <Alert variant="danger" className="register-alert">{error}</Alert>} {/* Consistent alert style */}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group id="username" className="mb-3">
                                <Form.Label className="register-label">Username</Form.Label>
                                <InputGroup className="register-input-group">
                                    <InputGroup.Text className="register-input-icon"><i className="fas fa-user"></i></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="register-input"
                                        placeholder="Choose a username"
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group id="email" className="mb-3">
                                <Form.Label className="register-label">Email Address</Form.Label>
                                <InputGroup className="register-input-group">
                                    <InputGroup.Text className="register-input-icon"><i className="fas fa-envelope"></i></InputGroup.Text>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="register-input"
                                        placeholder="your.email@example.com"
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group id="phoneNumber" className="mb-3">
                                <Form.Label className="register-label">Phone Number (Optional)</Form.Label>
                                <InputGroup className="register-input-group">
                                    <InputGroup.Text className="register-input-icon"><i className="fas fa-phone"></i></InputGroup.Text>
                                    <Form.Control
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="register-input"
                                        placeholder="e.g., +1 234 567 8900"
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group id="password" className="mb-3">
                                <Form.Label className="register-label">Password</Form.Label>
                                <InputGroup className="register-input-group">
                                    <InputGroup.Text className="register-input-icon"><i className="fas fa-lock"></i></InputGroup.Text>
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="register-input-password"
                                        placeholder="Create a password"
                                    />
                                    <InputGroup.Text
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle-addon"
                                    >
                                        <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group id="confirm-password" className="mb-4">
                                <Form.Label className="register-label">Confirm Password</Form.Label>
                                <InputGroup className="register-input-group">
                                    <InputGroup.Text className="register-input-icon"><i className="fas fa-lock"></i></InputGroup.Text>
                                    <Form.Control
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="register-input-password"
                                        placeholder="Confirm your password"
                                    />
                                    <InputGroup.Text
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="password-toggle-addon"
                                    >
                                        <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>

                            <Button disabled={loading} className="w-100 register-button" type="submit">
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
                                        Registering...
                                    </>
                                ) : (
                                    <i className="fas fa-user-plus me-2"></i>
                                )}
                                {loading ? 'Registering...' : 'Register'}
                            </Button>
                        </Form>

                        <div className="w-100 text-center mt-4 register-footer-text">
                            Already have an account? <Link to="/login" className="register-link">Log In</Link>
                        </div>
                    </Card.Body>
                </Card>
            </Container>

            <style jsx>{`
                /* Font Imports for a more intriguing look */
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:wght@400;600&display=swap');

                /* Color Palette Variables (consistent with Login.jsx) */
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

                .register-page-container { /* Consistent container styling */
                    background: linear-gradient(135deg, var(--light-brown-100) 0%, var(--light-brown-50) 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow: hidden;
                    position: relative;
                }

                .register-page-container::before { /* Consistent animated background */
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

                .register-page-container::after { /* Consistent animated background */
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

                @keyframes float1 { /* Consistent animation keyframes */
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(20px, 30px) rotate(5deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                @keyframes float2 { /* Consistent animation keyframes */
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(-25px, -35px) rotate(-7deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                .register-card { /* Consistent card styling */
                    background-color: #ffffff;
                    border: 1px solid var(--border-color);
                    border-radius: 1.5rem;
                    box-shadow: 0 15px 40px var(--shadow-color);
                    width: 100%;
                    max-width: 450px;
                    position: relative;
                    z-index: 10;
                    overflow: hidden;
                    transition: all 0.3s ease-in-out;
                }

                .register-card:hover { /* Consistent card hover effect */
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                }

                .register-title { /* Consistent title style */
                    font-family: 'Playfair Display', serif;
                    color: var(--primary-brown);
                    font-size: 2.5rem;
                    margin-bottom: 0.75rem;
                    letter-spacing: 0.03em;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
                }

                .register-subtitle { /* Consistent subtitle style */
                    font-family: 'Lora', serif;
                    color: var(--text-medium);
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }

                .register-label { /* Consistent label style */
                    font-family: 'Lora', serif;
                    color: var(--text-dark);
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                    font-size: 0.95rem;
                }

                .register-input-group .register-input-icon { /* Consistent input icon style */
                    background-color: var(--light-brown-100);
                    border: 1px solid var(--border-color);
                    border-right: none;
                    color: var(--secondary-brown);
                    padding: 0.75rem 1rem;
                    border-top-left-radius: 0.5rem;
                    border-bottom-left-radius: 0.5rem;
                }

                .register-input { /* Consistent input style for username, email, phone */
                    border: 1px solid var(--border-color);
                    border-left: none;
                    border-top-right-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    color: var(--text-dark);
                    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }

                .register-input-password { /* Specific style for password inputs within InputGroup */
                    border: 1px solid var(--border-color);
                    border-left: none;
                    border-right: none; /* No right border to connect with toggle button */
                    border-radius: 0; /* No border-radius in the middle */
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    color: var(--text-dark);
                    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                    flex: 1 1 auto; /* Allow it to grow and shrink */
                    width: 1%; /* Needed for flex-grow to work correctly in some browsers */
                    min-width: 0; /* Prevent content from overflowing */
                }

                .register-input:focus, .register-input-password:focus { /* Consistent focus style */
                    border-color: var(--primary-brown);
                    box-shadow: 0 0 0 0.2rem rgba(90, 68, 52, 0.25);
                    background-color: var(--light-brown-50);
                }

                .register-button { /* Consistent button style */
                    background-color: var(--primary-brown);
                    border: none;
                    border-radius: 0.75rem;
                    padding: 0.8rem 1.5rem;
                    font-size: 1.1rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    transition: all 0.3s ease-in-out;
                    box-shadow: 0 5px 15px rgba(90, 68, 52, 0.2);
                }

                .register-button:hover { /* Consistent button hover effect */
                    background-color: var(--secondary-brown);
                    border-color: var(--secondary-brown);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(90, 68, 52, 0.3);
                }

                .register-button:active { /* Consistent button active effect */
                    transform: translateY(0);
                    box-shadow: 0 3px 10px rgba(90, 68, 52, 0.2);
                }

                .register-button .spinner-border { /* Consistent spinner color */
                    color: white !important;
                }

                .register-footer-text { /* Consistent footer text style */
                    color: var(--text-medium);
                    font-size: 0.95rem;
                }

                .register-alert { /* Consistent alert style */
                    font-size: 0.9rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                .password-toggle-addon { /* Consistent password toggle addon style */
                    background-color: var(--light-brown-100);
                    border: 1px solid var(--border-color);
                    border-left: none; /* No left border to connect with input */
                    color: var(--secondary-brown);
                    padding: 0.75rem 1rem;
                    border-top-right-radius: 0.5rem; /* Rounded on the right */
                    border-bottom-right-radius: 0.5rem; /* Rounded on the right */
                    cursor: pointer;
                    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
                }

                .password-toggle-addon:hover { /* Consistent password toggle hover effect */
                    background-color: var(--secondary-brown);
                    color: white;
                    border-color: var(--secondary-brown);
                }

                /* Responsive Adjustments (consistent with Login.jsx) */
                @media (max-width: 576px) {
                    .register-card {
                        padding: 1.5rem;
                        border-radius: 1rem;
                    }
                    .register-title {
                        font-size: 2rem;
                    }
                    .register-subtitle {
                        font-size: 1rem;
                    }
                    .register-button {
                        padding: 0.7rem 1.2rem;
                        font-size: 1rem;
                    }
                    .register-input, .register-input-password {
                        padding: 0.6rem 0.8rem;
                    }
                    .register-input-group .register-input-icon {
                        padding: 0.6rem 0.8rem;
                    }
                    .password-toggle-addon {
                        padding: 0.6rem 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default Register;
