// src/components/register.jsx

import React, { useState } from 'react';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Register() {
    // State for form data, including a new 'phoneNumber' field
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '', // New state for phone number
        password: '',
        password2: ''
    });

    // Destructure form data for easier access
    const { username, email, phoneNumber, password, password2 } = formData;

    // State for loading and error handling
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Access authentication context and toast notification
    const { register } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Handle input changes
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Handle form submission
    const onSubmit = async e => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true); // Set loading state

        if (password !== password2) {
            setError('Passwords do not match');
            showToast('Passwords do not match', 'danger', 'Registration Error');
            setLoading(false);
            return;
        }

        try {
            // Call the register function from AuthContext
            // Include phoneNumber in the registration data
            await register({ username, email, phoneNumber, password });
            showToast('Registration successful! Please log in.', 'success', 'Success');
            navigate('/login'); // Redirect to login page upon successful registration
        } catch (err) {
            // Handle registration errors
            console.error('Registration error:', err);
            const errorMessage = err.response?.data?.msg || 'Registration failed. Please try again.';
            setError(errorMessage);
            showToast(errorMessage, 'danger', 'Registration Error');
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Card className="p-4 book-form-container">
                <Card.Body>
                    <h2 className="text-center mb-4 book-form-title">Register for BookEnds</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={onSubmit}>
                        {/* Username Field */}
                        <Form.Group id="username" className="mb-3">
                            <Form.Label className="book-form-label">Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                name="username"
                                value={username}
                                onChange={onChange}
                                required
                                className="book-input"
                            />
                        </Form.Group>

                        {/* Email Field */}
                        <Form.Group id="email" className="mb-3">
                            <Form.Label className="book-form-label">Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                className="book-input"
                            />
                        </Form.Group>

                        {/* NEW: Phone Number Field */}
                        <Form.Group id="phoneNumber" className="mb-3">
                            <Form.Label className="book-form-label">Phone Number (Optional)</Form.Label>
                            <Form.Control
                                type="tel" // Use type="tel" for phone numbers
                                placeholder="Enter phone number"
                                name="phoneNumber"
                                value={phoneNumber}
                                onChange={onChange}
                                className="book-input"
                            // Optional: add pattern for basic validation if needed, e.g., pattern="[0-9]{10}"
                            />
                            <Form.Text className="text-muted book-form-text">
                                Adding a phone number is optional.
                            </Form.Text>
                        </Form.Group>

                        {/* Password Field */}
                        <Form.Group id="password" className="mb-3">
                            <Form.Label className="book-form-label">Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                minLength="6"
                                className="book-input"
                            />
                        </Form.Group>

                        {/* Confirm Password Field */}
                        <Form.Group id="password2" className="mb-4">
                            <Form.Label className="book-form-label">Confirm Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirm Password"
                                name="password2"
                                value={password2}
                                onChange={onChange}
                                required
                                className="book-input"
                            />
                        </Form.Group>

                        {/* Submit Button */}
                        <Button disabled={loading} className="w-100 book-form-button" type="submit">
                            {loading ? 'Registering...' : 'Register'}
                        </Button>
                    </Form>
                    <div className="w-100 text-center mt-3 book-form-text">
                        Already have an account? <Link to="/login" className="book-link">Log In</Link>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Register;
