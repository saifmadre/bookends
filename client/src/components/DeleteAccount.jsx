// src/components/DeleteAccount.jsx
import React, { useState } from 'react';
import { Alert, Button, Container, Modal, Spinner } from 'react-bootstrap';
// *** CRITICAL VERIFICATION REQUIRED: ***
// Please ensure the folder 'contexts' (all lowercase) exists at:
// your_project_root/src/contexts/
// AND the file 'AuthContext.js' exists inside it (uppercase 'A' and 'C').
// This import path '../contexts/AuthContext' assumes DeleteAccount.jsx is in src/components/
// and AuthContext.js is in src/contexts/.
import { useAuth } from '../contexts/AuthContext'; // To get the token and logout function

function DeleteAccount({ onNavigate }) {
    const { user, isAuthenticated, logout } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false); // State for confirmation modal

    // Handle modal show/hide
    const handleShowConfirmModal = () => setShowConfirmModal(true);
    const handleCloseConfirmModal = () => setShowConfirmModal(false);

    const handleDeleteAccount = async () => {
        setMessage('');
        setIsError(false);
        setIsSubmitting(true);
        handleCloseConfirmModal(); // Close the modal once deletion starts

        if (!isAuthenticated || !user?.token) {
            setMessage('You must be logged in to delete your account.');
            setIsError(true);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/profile/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token, // Send the JWT
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg || 'Account deleted successfully!');
                setIsError(false);
                // Important: Log the user out after successful deletion
                logout();
                // Redirect to login page after deletion and logout
                // The onNavigate prop is passed from App.js
                setTimeout(() => onNavigate('login'), 1500); // Redirect after a short delay
            } else {
                setMessage(data.msg || 'Failed to delete account.');
                setIsError(true);
            }
        } catch (err) {
            console.error("Error deleting account:", err);
            setMessage("Network error or server unavailable. Please try again later.");
            setIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
            <h2 className="text-center mb-4 book-form-title">Delete Account</h2>

            {message && (
                <Alert variant={isError ? 'danger' : 'success'} className="mb-3">
                    {message}
                </Alert>
            )}

            <p className="book-form-text mb-4">
                Deleting your account is a permanent action. All your data will be removed.
                Please confirm if you wish to proceed.
            </p>

            <Button
                variant="danger"
                className="w-100 book-form-button"
                onClick={handleShowConfirmModal} // Show modal on click
                disabled={isSubmitting}
            >
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
                        Deleting...
                    </>
                ) : (
                    'Delete My Account'
                )}
            </Button>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Account Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you absolutely sure you want to delete your account? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteAccount} disabled={isSubmitting}>
                        Confirm Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default DeleteAccount;
