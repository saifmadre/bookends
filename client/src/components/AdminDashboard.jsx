// src/components/AdminDashboard.jsx
import React from 'react';
import { Alert, Card, Container } from 'react-bootstrap';
// *** CRITICAL VERIFICATION REQUIRED: ***
// Please ensure the folder 'contexts' (all lowercase) exists at:
// your_project_root/src/contexts/
// AND the file 'AuthContext.js' exists inside it (uppercase 'A' and 'C').
// This import path '../contexts/AuthContext' assumes AdminDashboard.jsx is in src/components/
// and AuthContext.js is in src/contexts/.
import { useAuth } from '../contexts/AuthContext'; // To get user role

function AdminDashboard() {
    const { user } = useAuth(); // Get the user object from context

    return (
        <Container className="book-form-container my-5 p-4 rounded shadow-lg text-center">
            <h2 className="book-form-title mb-4">Admin Dashboard</h2>

            {user?.role === 'admin' ? (
                // Content for Admin users
                <>
                    <Card className="text-left mt-4 p-3 book-form-container">
                        <Card.Body>
                            <Card.Title className="book-form-label">Admin Privileges:</Card.Title>
                            <Card.Text className="book-form-text">
                                Welcome, **{user.username || user.email}**! You have admin access.
                                <br />
                                This is where you would manage users, view system logs, or access other admin-specific features.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                    <Alert variant="info" className="mt-4">
                        This content is visible only to users with the 'admin' role.
                    </Alert>
                </>
            ) : (
                // Message for non-admin users who might try to access directly
                <Alert variant="danger" className="mt-4">
                    Access Denied: You do not have administrator privileges to view this page.
                </Alert>
            )}
        </Container>
    );
}

export default AdminDashboard;
