// src/components/AdminDashboard.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function AdminDashboard() {
    const { user, loading: authLoading, token } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState('');

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewsError, setReviewsError] = useState('');

    // Fetch users for User Management tab
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        setUsersError('');
        try {
            // This endpoint should ideally be /api/admin/users or similar,
            // and protected by an admin middleware on the backend.
            const response = await fetch('http://localhost:5000/api/social/users', { // Reusing existing social/users for demo
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            } else {
                setUsersError(data.msg || 'Failed to fetch users.');
                showToast(data.msg || 'Failed to fetch users.', 'danger', 'Error');
            }
        } catch (err) {
            setUsersError('Network error: Could not fetch users.');
            showToast('Network error: Could not fetch users.', 'danger', 'Network Error');
        } finally {
            setLoadingUsers(false);
        }
    }, [token, showToast]);

    // Fetch reviews for Content Moderation tab
    const fetchReviews = useCallback(async () => {
        setLoadingReviews(true);
        setReviewsError('');
        try {
            // *** IMPORTANT: This is a placeholder API call. ***
            // You will need a backend endpoint (e.g., /api/admin/reviews)
            // that fetches all reviews, possibly with a 'pending' status for moderation.
            // For now, it's mocked.
            const response = await new Promise(resolve => setTimeout(() => {
                resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        { _id: 'rev1', bookTitle: 'The Great Gatsby', reviewer: 'Alice', reviewText: 'A timeless classic! The prose is beautiful and the story captivating.', status: 'pending' },
                        { _id: 'rev2', bookTitle: '1984', reviewer: 'Bob', reviewText: 'A chilling look into a dystopian future. Very thought-provoking.', status: 'approved' },
                        { _id: 'rev3', bookTitle: 'To Kill a Mockingbird', reviewer: 'Charlie', reviewText: 'An essential read for understanding empathy and justice.', status: 'pending' },
                        { _id: 'rev4', bookTitle: 'Dune', reviewer: 'Diana', reviewText: 'Complex world-building but a bit slow at times. Still, a sci-fi masterpiece.', status: 'pending' },
                    ])
                });
            }, 1000)); // Simulate network delay

            const data = await response.json();
            if (response.ok) {
                setReviews(data);
            } else {
                setReviewsError(data.msg || 'Failed to fetch reviews.');
                showToast(data.msg || 'Failed to fetch reviews.', 'danger', 'Error');
            }
        } catch (err) {
            setReviewsError('Network error: Could not fetch reviews.');
            showToast('Network error: Could not fetch reviews.', 'danger', 'Network Error');
        } finally {
            setLoadingReviews(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (user?.role === 'admin') {
            if (activeTab === 'user-management') {
                fetchUsers();
            } else if (activeTab === 'content-moderation') {
                fetchReviews();
            }
        }
    }, [activeTab, user, fetchUsers, fetchReviews]);


    // Placeholder for user action (e.g., changing role, deleting)
    const handleUserAction = (userId, actionType, newValue = null) => {
        // In a real app, this would involve API calls
        console.log(`Admin action: ${actionType} for user ${userId}, new value: ${newValue}`);
        showToast(`${actionType} action simulated for user ${userId}.`, 'info', 'Admin Action');
        // Re-fetch users after action if needed
        // fetchUsers();
    };

    // Placeholder for review moderation action
    const handleReviewModeration = (reviewId, actionType) => {
        // In a real app, this would involve API calls to update review status or delete it
        console.log(`Moderation action: ${actionType} for review ${reviewId}`);
        showToast(`Review ${reviewId} ${actionType}d. (Simulated)`, 'info', 'Moderation Action');
        // Filter out the moderated review or update its status in the state
        setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId)); // For delete/approve and remove from pending
        // If you want to show approved reviews in a separate list, you'd update state accordingly
    };

    return (
        <Container className="profile-container my-5 p-4 rounded-xl shadow-lg bg-light-brown-100 text-center">
            <h2 className="mb-5 text-4xl font-extrabold text-brown-900 profile-title">
                Admin Dashboard
            </h2>

            {authLoading ? (
                <Container className="profile-container my-5 p-4 rounded-xl shadow-lg text-center bg-light-brown-100">
                    <Spinner animation="border" role="status" className="spinner-minimal">
                        <span className="visually-hidden">Loading user data...</span>
                    </Spinner>
                    <p className="loading-text mt-3">Verifying administrator privileges...</p>
                </Container>
            ) : user?.role === 'admin' ? (
                <>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-3 custom-tabs-users" // Reusing custom-tabs-users for consistency
                        justify
                    >
                        <Tab eventKey="overview" title="Overview">
                            <Card className="minimal-card p-4 text-left">
                                <Card.Body>
                                    <h4 className="text-xl font-semibold text-brown-800 mb-3 section-title">Admin Privileges Overview</h4>
                                    <p className="text-gray-700 mb-3">
                                        Welcome, <strong className="text-brown-900">{user.username || user.email}</strong>! You have full administrator access to the BookEnds platform.
                                    </p>
                                    <p className="text-gray-700">
                                        From here, you can perform various administrative tasks such as:
                                    </p>
                                    <ul className="minimal-list-group list-unstyled mt-3">
                                        <li><i className="fas fa-users profile-icon"></i> <span>User Management:</span> View, edit, or delete user accounts.</li>
                                        <li><i className="fas fa-chart-line profile-icon"></i> <span>System Analytics:</span> Monitor application performance and usage statistics.</li>
                                        <li><i className="fas fa-clipboard-list profile-icon"></i> <span>Content Moderation:</span> Manage user-generated content (e.g., reviews, bios).</li>
                                        <li><i className="fas fa-cogs profile-icon"></i> <span>Configuration Settings:</span> Adjust global application settings.</li>
                                    </ul>

                                    <h4 className="text-xl font-semibold text-brown-800 mb-3 mt-5 section-title">Quick Stats (Placeholder)</h4>
                                    <div className="d-flex justify-content-around flex-wrap">
                                        <Card className="minimal-card-sm p-3 m-2 text-center">
                                            <i className="fas fa-users fa-2x text-primary-brown mb-2"></i>
                                            <h5 className="mb-0 text-brown-900">1,234</h5>
                                            <p className="text-muted text-sm">Total Users</p>
                                        </Card>
                                        <Card className="minimal-card-sm p-3 m-2 text-center">
                                            <i className="fas fa-book fa-2x text-primary-brown mb-2"></i>
                                            <h5 className="mb-0 text-brown-900">5,678</h5>
                                            <p className="text-muted text-sm">Total Books Added</p>
                                        </Card>
                                        <Card className="minimal-card-sm p-3 m-2 text-center">
                                            <i className="fas fa-star fa-2x text-primary-brown mb-2"></i>
                                            <h5 className="mb-0 text-brown-900">987</h5>
                                            <p className="text-muted text-sm">Total Reviews</p>
                                        </Card>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="user-management" title="User Management">
                            <Card className="minimal-card p-4 text-left">
                                <Card.Body>
                                    <h4 className="text-xl font-semibold text-brown-800 mb-3 section-title">Manage User Accounts</h4>
                                    {loadingUsers ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" role="status" className="spinner-minimal">
                                                <span className="visually-hidden">Loading users...</span>
                                            </Spinner>
                                            <p className="loading-text mt-3">Fetching user list...</p>
                                        </div>
                                    ) : usersError ? (
                                        <Alert variant="danger" className="alert-minimal alert-danger">{usersError}</Alert>
                                    ) : users.length === 0 ? (
                                        <Alert variant="info" className="alert-minimal">No users found.</Alert>
                                    ) : (
                                        <Table responsive hover className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u) => (
                                                    <tr key={u._id}>
                                                        <td>{u.username}</td>
                                                        <td>{u.email}</td>
                                                        <td>
                                                            <Form.Select
                                                                size="sm"
                                                                value={u.role}
                                                                onChange={(e) => handleUserAction(u._id, 'update-role', e.target.value)}
                                                                className="form-control-minimal" // Apply minimalist style
                                                                disabled={u._id === user.id} // Prevent changing own role
                                                            >
                                                                <option value="user">User</option>
                                                                <option value="admin">Admin</option>
                                                            </Form.Select>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleUserAction(u._id, 'delete')}
                                                                className="custom-button-sm me-2"
                                                                disabled={u._id === user.id} // Prevent deleting own account
                                                            >
                                                                Delete
                                                            </Button>
                                                            <Button
                                                                variant="info"
                                                                size="sm"
                                                                onClick={() => handleUserAction(u._id, 'view-profile')}
                                                                className="custom-button-sm"
                                                            >
                                                                View Profile
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="content-moderation" title="Content Moderation">
                            <Card className="minimal-card p-4 text-left">
                                <Card.Body>
                                    <h4 className="text-xl font-semibold text-brown-800 mb-3 section-title">Review & Moderate Content</h4>
                                    {loadingReviews ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" role="status" className="spinner-minimal">
                                                <span className="visually-hidden">Loading reviews...</span>
                                            </Spinner>
                                            <p className="loading-text mt-3">Fetching reviews for moderation...</p>
                                        </div>
                                    ) : reviewsError ? (
                                        <Alert variant="danger" className="alert-minimal alert-danger">{reviewsError}</Alert>
                                    ) : reviews.length === 0 ? (
                                        <Alert variant="info" className="alert-minimal">No reviews to moderate at this time.</Alert>
                                    ) : (
                                        <Table responsive hover className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Book Title</th>
                                                    <th>Reviewer</th>
                                                    <th>Review Text</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reviews.map((review) => (
                                                    <tr key={review._id}>
                                                        <td>{review.bookTitle}</td>
                                                        <td>{review.reviewer}</td>
                                                        <td>{review.reviewText.substring(0, 100)}{review.reviewText.length > 100 ? '...' : ''}</td>
                                                        <td><span className={`badge ${review.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>{review.status}</span></td>
                                                        <td>
                                                            {review.status === 'pending' && (
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() => handleReviewModeration(review._id, 'approve')}
                                                                    className="custom-button-sm me-2"
                                                                >
                                                                    Approve
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleReviewModeration(review._id, 'delete')}
                                                                className="custom-button-sm"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="system-logs" title="System Logs">
                            <Card className="minimal-card p-4 text-left">
                                <Card.Body>
                                    <h4 className="text-xl font-semibold text-brown-800 mb-3 section-title">View System Activity Logs</h4>
                                    <p className="text-gray-700">
                                        This area will provide access to system logs, allowing administrators to monitor application activity, errors, and security events.
                                    </p>
                                    <ul className="minimal-list-group list-unstyled mt-3">
                                        <li><i className="fas fa-file-alt profile-icon"></i> Access server logs.</li>
                                        <li><i className="fas fa-shield-alt profile-icon"></i> Monitor security events.</li>
                                        <li><i className="fas fa-chart-area profile-icon"></i> Track API usage.</li>
                                    </ul>
                                    <Alert variant="warning" className="alert-minimal alert-warning mt-4">
                                        <i className="fas fa-exclamation-circle me-2"></i>
                                        System logging and monitoring features are currently being implemented.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Tab>

                    </Tabs>
                </>
            ) : (
                <Alert variant="danger" className="mt-4 alert-minimal alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Access Denied: You do not have administrator privileges to view this page.
                    Please log in with an admin account or contact support if you believe this is an error.
                </Alert>
            )}

            <style jsx>{`
                /* Font Imports for a more intriguing look */
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

                /* General Container and Text Styles */
                .profile-container { /* Reusing profile-container for consistent page wrapper */
                    background-color: var(--light-brown-100);
                    padding: 2.5rem !important;
                    border-radius: 1.5rem !important;
                    box-shadow: 0 10px 25px var(--shadow-color);
                    background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e0d9c8" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 54v-4H4v4H0v2h4v4h2v-4h4v-2H6zm0-20v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 14v-4H4v4H0v2h4v4h2v-4h4v-2H6zm30 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM18 54v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM48 54v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM0 36v-2h2v2H0zm0 20v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm0-10v-2h2v2H0zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm12 20v-2h2v2h-2zm0 20v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2zm0-10v-2h2v2h-2z"%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
                    background-repeat: repeat;
                }

                .profile-title { /* Reusing profile-title for consistent page title */
                    font-family: 'Playfair Display', serif;
                    color: var(--text-dark);
                    letter-spacing: 0.05em;
                    font-size: 3.5rem !important;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                }

                .minimal-card {
                    border: 1px solid var(--border-color);
                    background-color: #ffffff;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px var(--shadow-color);
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }

                .minimal-card-sm { /* Smaller cards for quick stats */
                    border: 1px solid var(--border-color);
                    background-color: var(--light-brown-50);
                    border-radius: 0.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    min-width: 150px;
                }

                .section-title { /* Reusing section-title for consistent sub-headings */
                    font-family: 'Playfair Display', serif;
                    color: var(--primary-brown);
                    font-size: 1.8rem !important;
                    margin-bottom: 1.5rem !important;
                    position: relative;
                    padding-bottom: 0.5rem;
                }
                .section-title::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    width: 50px;
                    height: 3px;
                    background-color: var(--accent-gold);
                    border-radius: 2px;
                }

                .text-gray-700 { color: var(--text-medium); }
                .text-brown-900 { color: var(--text-dark); }

                .minimal-list-group .list-unstyled {
                    padding-left: 0; /* Remove default ul padding */
                }
                .minimal-list-group li {
                    display: flex;
                    align-items: flex-start; /* Align icon and text at the top */
                    margin-bottom: 0.75rem;
                    color: var(--text-medium);
                    font-size: 1rem;
                    line-height: 1.5;
                }
                .minimal-list-group li:last-child {
                    margin-bottom: 0;
                }
                .minimal-list-group .profile-icon { /* Reusing profile-icon for consistent icon styling */
                    color: var(--secondary-brown);
                    margin-right: 0.8rem;
                    font-size: 1.2rem;
                    width: 25px; /* Fixed width for alignment */
                    text-align: center;
                    flex-shrink: 0; /* Prevent icon from shrinking */
                }
                .minimal-list-group li span {
                    font-weight: 600;
                    color: var(--primary-brown);
                    margin-right: 0.4rem;
                }

                /* Minimalist Alert Styles (consistent with other components) */
                .alert-minimal {
                    background-color: #f0f8ff; /* Light blue for info */
                    border-color: #d0e8ff;
                    color: #31708f;
                    font-size: 1rem;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    text-align: center;
                }
                .alert-minimal.alert-danger {
                    background-color: #ffe0e0;
                    border-color: #ffc0c0;
                    color: #a94442;
                }
                .alert-minimal.alert-warning {
                    background-color: #fff8e1;
                    border-color: #ffe0b2;
                    color: #8a6d3b;
                }

                /* Minimalist Spinner/Loading Styles (consistent with other components) */
                .spinner-minimal {
                    color: var(--primary-brown) !important;
                }
                .loading-text {
                    color: #777777;
                    margin-top: 1rem;
                }

                /* Tab Styles (consistent with UsersPage) */
                .custom-tabs-users .nav-link {
                    background-color: var(--border-color); /* Light background for tabs */
                    color: var(--primary-brown);
                    border: 1px solid var(--border-color);
                    border-bottom: none;
                    margin-bottom: -1px;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    font-weight: bold;
                    transition: all 0.2s ease-in-out;
                    padding: 0.75rem 1.25rem;
                }

                .custom-tabs-users .nav-link.active {
                    background-color: var(--primary-brown); /* Darker brown for active tab */
                    color: white;
                    border-color: var(--primary-brown);
                }

                .custom-tabs-users .nav-link:hover:not(.active) {
                    background-color: var(--light-brown-100); /* Slightly darker on hover for inactive */
                    color: var(--text-dark);
                }

                .custom-tabs-users .tab-content {
                    background-color: #ffffff;
                    border: 1px solid var(--border-color);
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 1.5rem;
                }

                /* Admin Table Styles */
                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .admin-table th, .admin-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid var(--border-color);
                    text-align: left;
                    color: var(--text-dark);
                }
                .admin-table th {
                    background-color: var(--light-brown-100);
                    font-weight: 600;
                    color: var(--primary-brown);
                    text-transform: uppercase;
                    font-size: 0.9rem;
                }
                .admin-table tbody tr:hover {
                    background-color: var(--light-brown-50);
                }
                .admin-table .form-control-minimal { /* Apply minimalist style to select inside table */
                    padding: 0.375rem 0.75rem;
                    font-size: 0.875rem;
                    height: auto;
                }
                .custom-button-sm { /* Small buttons for table actions */
                    background-color: var(--primary-brown);
                    border-color: var(--primary-brown);
                    color: white;
                    border-radius: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    font-weight: 500;
                    transition: all 0.2s ease-in-out;
                }
                .custom-button-sm:hover {
                    background-color: var(--secondary-brown);
                    border-color: var(--secondary-brown);
                }


                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .profile-container {
                        padding: 1.5rem !important;
                        margin: 1rem auto !important;
                    }
                    .profile-title {
                        font-size: 2.5rem !important;
                    }
                    .minimal-card {
                        padding: 1rem !important;
                    }
                    .section-title {
                        font-size: 1.5rem !important;
                        margin-bottom: 1rem !important;
                    }
                    .minimal-list-group li {
                        font-size: 0.95rem;
                    }
                    .minimal-list-group .profile-icon {
                        font-size: 1rem;
                        width: 20px;
                    }
                    .minimal-card-sm {
                        min-width: 120px;
                        margin: 0.5rem;
                    }
                    .admin-table th, .admin-table td {
                        padding: 8px 10px;
                        font-size: 0.85rem;
                    }
                    .custom-button-sm {
                        padding: 0.25rem 0.5rem;
                        font-size: 0.75rem;
                    }
                }
            `}</style>
        </Container>
    );
}

export default AdminDashboard;