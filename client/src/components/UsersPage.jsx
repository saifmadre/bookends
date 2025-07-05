// src/components/UsersPage.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Spinner, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import SearchInput from './SearchInput.jsx'; // Reusing the SearchInput component

// Helper component for displaying individual user cards
const UserCard = ({ user, currentUser, relationships, onFollow, onUnfollow, onAccept, onReject, onRemoveFollower, onRespondToRequest }) => {
    // Safely destructure relationship arrays, providing default empty arrays if undefined
    const { following = [], pendingRequests = [], followers = [] } = relationships;

    // Determine the status of the relationship for the current user to the displayed 'user'
    const isFollowing = following.some(f => f._id === user._id);
    const hasSentRequest = following.some(f => f._id === user._id && f.status === 'pending');
    const hasIncomingRequest = pendingRequests.some(r => r._id === user._id);
    const isFollower = followers.some(f => f._id === user._id);

    let buttonContent;
    let buttonVariant;
    let buttonDisabled = false;
    let buttonAction = null;

    if (user._id === currentUser.id) {
        buttonContent = 'Your Profile';
        buttonVariant = 'outline-secondary'; // Changed to outline for user's own profile
        buttonDisabled = true;
    } else if (hasIncomingRequest) {
        buttonContent = (
            <>
                <Button variant="success" size="sm" className="me-2 custom-button-sm" onClick={() => onRespondToRequest(user._id, 'accept')}>Accept</Button>
                <Button variant="danger" size="sm" className="custom-button-sm" onClick={() => onRespondToRequest(user._id, 'reject')}>Reject</Button>
            </>
        );
        buttonVariant = null; // No single variant for a group of buttons
    } else if (hasSentRequest) {
        buttonContent = 'Request Sent';
        buttonVariant = 'outline-info'; // Changed to outline for consistency
        buttonDisabled = true;
    } else if (isFollowing) {
        buttonContent = 'Following';
        buttonVariant = 'outline-primary';
        buttonAction = () => onUnfollow(user._id);
    } else {
        buttonContent = 'Follow';
        buttonVariant = 'primary';
        buttonAction = () => onFollow(user._id);
    }

    // Placeholder for user avatar (e.g., first letter of username)
    const userAvatar = user.username ? user.username.charAt(0).toUpperCase() : '?';

    return (
        <Card className="user-card p-4 shadow-sm rounded-lg h-100 d-flex flex-column justify-content-between hover:shadow-md transition-shadow duration-200 border-light-brown-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
                <div className="user-avatar mb-3">
                    {userAvatar}
                </div>
                <Card.Title className="text-xl font-bold text-brown-800 mb-1">{user.username}</Card.Title>
                <Card.Subtitle className="mb-3 text-muted text-sm">{user.email}</Card.Subtitle>
                {user.role && <span className="badge bg-secondary mb-3">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>}
            </Card.Body>
            <div className="mt-auto pt-3 border-top border-light-brown-100 d-flex justify-content-center">
                {buttonVariant ? (
                    <Button
                        variant={buttonVariant}
                        onClick={buttonAction}
                        disabled={buttonDisabled}
                        className="w-100 custom-button"
                    >
                        {buttonContent}
                    </Button>
                ) : (
                    <div className="d-flex justify-content-between w-100">
                        {buttonContent}
                    </div>
                )}
            </div>
        </Card>
    );
};


const UsersPage = () => {
    const { user, isAuthenticated, token, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [allUsers, setAllUsers] = useState([]);
    const [loadingAllUsers, setLoadingAllUsers] = useState(true);
    const [errorAllUsers, setErrorAllUsers] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [relationships, setRelationships] = useState({
        following: [],
        pendingRequests: [], // Requests *to* the current user
        followers: []
    });
    const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'following', 'followers', 'requests'

    // Log authentication state when component renders or state changes
    console.log('UsersPage: Rendered. isAuthenticated:', isAuthenticated, 'token:', token ? 'Exists' : 'Missing', 'authLoading:', authLoading);
    console.log('UsersPage: Current User:', user);


    // Fetch all discoverable users
    const fetchAllUsers = useCallback(async () => {
        setLoadingAllUsers(true);
        setErrorAllUsers('');

        // CRITICAL FIX: Ensure authLoading is false AND isAuthenticated is true AND token exists
        if (authLoading || !isAuthenticated || !token) {
            console.log('UsersPage: fetchAllUsers skipped - Auth not ready or not authenticated.');
            setErrorAllUsers('You must be logged in to view other users.');
            setLoadingAllUsers(false);
            return;
        }

        try {
            const url = `http://localhost:5000/api/social/users`;
            console.log('UsersPage: Fetching all discoverable users from:', url);
            console.log('UsersPage: Sending x-auth-token:', token.substring(0, 10) + '...'); // Log first 10 chars of token

            const response = await fetch(url, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await response.json();

            if (response.ok) {
                // Filter out the current user from the list of all users
                const usersWithoutCurrentUser = data.filter(u => u._id !== user.id);
                setAllUsers(usersWithoutCurrentUser);
                setFilteredUsers(usersWithoutCurrentUser); // Initialize filtered users with all users
                console.log('UsersPage: Successfully fetched all users. Count:', usersWithoutCurrentUser.length);
            } else {
                console.error('UsersPage: Error fetching all users:', data.msg || response.statusText);
                setErrorAllUsers(data.msg || 'Failed to fetch users for discovery.');
                showToast(data.msg || 'Failed to fetch users for discovery.', 'danger', 'Error');
            }
        } catch (err) {
            console.error('UsersPage: Network/Fetch error for all users:', err);
            setErrorAllUsers('Network error: Could not connect to the server.');
            showToast('Network error: Could not connect to the server.', 'danger', 'Network Error');
        } finally {
            setLoadingAllUsers(false);
        }
    }, [isAuthenticated, user, token, authLoading, showToast]);


    // Fetch current user's relationships (following, followers, pending requests)
    const fetchRelationships = useCallback(async () => {
        if (authLoading || !isAuthenticated || !token || !user?.id) {
            console.log('UsersPage: fetchRelationships skipped - Auth not ready or not authenticated.');
            return;
        }

        try {
            const endpoints = {
                following: `http://localhost:5000/api/social/following`,
                followers: `http://localhost:5000/api/social/followers`,
                pendingRequests: `http://localhost:5000/api/social/pending-requests`
            };

            const [followingRes, followersRes, pendingReqRes] = await Promise.all([
                fetch(endpoints.following, { headers: { 'x-auth-token': token } }),
                fetch(endpoints.followers, { headers: { 'x-auth-token': token } }),
                fetch(endpoints.pendingRequests, { headers: { 'x-auth-token': token } })
            ]);

            const followingData = followingRes.ok ? await followingRes.json() : [];
            const followersData = followersRes.ok ? await followersRes.json() : [];
            const pendingReqData = pendingReqRes.ok ? await pendingReqRes.json() : [];

            setRelationships({
                following: followingData,
                followers: followersData,
                pendingRequests: pendingReqData
            });
            console.log('UsersPage: Relationships fetched successfully.');
        } catch (err) {
            console.error('UsersPage: Error fetching relationships:', err);
            showToast('Failed to load social relationships.', 'danger', 'Error');
        }
    }, [isAuthenticated, user, token, authLoading, showToast]);


    // Effect to fetch initial data
    useEffect(() => {
        console.log('UsersPage: Primary useEffect triggered. Auth status:', isAuthenticated, 'Loading:', authLoading);
        if (!authLoading && isAuthenticated && user?.id && token) {
            fetchAllUsers();
            fetchRelationships();
        } else if (!authLoading && (!isAuthenticated || !user?.id || !token)) {
            // If authentication is not ready or failed after authLoading is done
            setErrorAllUsers('You must be logged in to view other users.');
            setLoadingAllUsers(false);
            setAllUsers([]); // Clear any stale data
            setFilteredUsers([]);
            setRelationships({ following: [], pendingRequests: [], followers: [] });
            console.log('UsersPage: Not authenticated, clearing user data and setting error.');
        }
    }, [isAuthenticated, user, token, authLoading, fetchAllUsers, fetchRelationships]);


    // Handle search input changes
    const handleSearch = useCallback((query) => {
        setSearchTerm(query);
        if (query.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const lowercasedQuery = query.toLowerCase();
            const filtered = allUsers.filter(user =>
                user.username.toLowerCase().includes(lowercasedQuery) ||
                user.email.toLowerCase().includes(lowercasedQuery)
            );
            setFilteredUsers(filtered);
        }
    }, [allUsers]);


    // Social actions
    const handleFollow = async (targetUserId) => {
        if (!isAuthenticated || !token) {
            showToast('Please log in to follow users.', 'danger', 'Authentication Required');
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/social/follow/${targetUserId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.msg, 'success', 'Success');
                fetchRelationships(); // Refresh relationships to update UI
            } else {
                showToast(data.msg || 'Failed to send follow request.', 'danger', 'Error');
            }
        } catch (err) {
            console.error('Error following user:', err);
            showToast('Network error while sending follow request.', 'danger', 'Network Error');
        }
    };

    const handleUnfollow = async (targetUserId) => {
        if (!isAuthenticated || !token) {
            showToast('Please log in to unfollow users.', 'danger', 'Authentication Required');
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/social/unfollow/${targetUserId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.msg, 'success', 'Success');
                fetchRelationships(); // Refresh relationships to update UI
            } else {
                showToast(data.msg || 'Failed to unfollow user.', 'danger', 'Error');
            }
        } catch (err) {
            console.error('Error unfollowing user:', err);
            showToast('Network error while unfollowing user.', 'danger', 'Network Error');
        }
    };

    const handleRespondToRequest = async (requesterId, action) => {
        if (!isAuthenticated || !token) {
            showToast('Please log in to respond to requests.', 'danger', 'Authentication Required');
            return;
        }
        try {
            const endpoint = action === 'accept'
                ? `http://localhost:5000/api/social/accept-follow/${requesterId}`
                : `http://localhost:5000/api/social/reject-follow/${requesterId}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.msg, 'success', 'Success');
                fetchRelationships(); // Refresh relationships to update UI
            } else {
                showToast(data.msg || `Failed to ${action} request.`, 'danger', 'Error');
            }
        } catch (err) {
            console.error(`Error ${action}ing request:`, err);
            showToast(`Network error while ${action}ing request.`, 'danger', 'Network Error');
        }
    };

    const handleRemoveFollower = async (followerId) => {
        if (!isAuthenticated || !token) {
            showToast('Please log in to remove followers.', 'danger', 'Authentication Required');
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/social/remove-follower/${followerId}`, {
                method: 'POST', // Assuming POST for state change
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.msg, 'success', 'Success');
                fetchRelationships(); // Refresh relationships to update UI
            } else {
                showToast(data.msg || 'Failed to remove follower.', 'danger', 'Error');
            }
        } catch (err) {
            console.error('Error removing follower:', err);
            showToast('Network error while removing follower.', 'danger', 'Network Error');
        }
    };


    const renderUserList = (usersToRender, type) => {
        if (loadingAllUsers && type === 'discover') {
            return (
                <div className="text-center p-4">
                    <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                        <span className="visually-hidden">Loading users...</span>
                    </Spinner>
                    <p className="text-gray-700 mt-3">Loading users for discovery...</p>
                </div>
            );
        }

        if (errorAllUsers && type === 'discover') {
            return <Alert variant="danger" className="text-center mt-4">{errorAllUsers}</Alert>;
        }

        if (!isAuthenticated) {
            return (
                <Alert variant="info" className="text-center mt-4">
                    Please log in to view and interact with other users.
                </Alert>
            );
        }

        if (usersToRender.length === 0) {
            let message = 'No users found.';
            if (type === 'discover') message = 'No other users to discover at the moment.';
            if (type === 'following') message = 'You are not following anyone yet.';
            if (type === 'followers') message = 'No one is following you yet.';
            if (type === 'requests') message = 'No pending follow requests.';

            return (
                <div className="text-center p-4 bg-light-brown-100 rounded border border-light-brown mt-4">
                    <p className="text-gray-700">{message}</p>
                </div>
            );
        }

        return (
            <div className="user-list-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {usersToRender.map(u => (
                    <UserCard
                        key={u._id}
                        user={u}
                        currentUser={user}
                        relationships={relationships}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        onAccept={handleRespondToRequest}
                        onReject={handleRespondToRequest}
                        onRemoveFollower={handleRemoveFollower}
                        onRespondToRequest={handleRespondToRequest} // Pass this for accept/reject
                    />
                ))}
            </div>
        );
    };


    return (
        <Container className="my-5 p-4 rounded-xl shadow-lg bg-light-brown-100 text-center">
            <h2 className="mb-5 text-4xl font-extrabold text-brown-900">
                Connect with Other Readers
            </h2>

            {!isAuthenticated && !authLoading ? (
                <Alert variant="warning" className="mt-4 text-lg text-center bg-yellow-100 border-yellow-200 text-yellow-800">
                    Please log in to discover and connect with other users.
                </Alert>
            ) : authLoading ? (
                <div className="text-center p-4">
                    <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                        <span className="visually-hidden">Loading authentication...</span>
                    </Spinner>
                    <p className="text-gray-700 mt-3">Verifying authentication status...</p>
                </div>
            ) : (
                <>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-3 custom-tabs-users"
                        justify
                    >
                        <Tab eventKey="discover" title="Discover Users">
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4">Find New Connections</h4>
                                <SearchInput
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    onSearch={handleSearch}
                                    placeholder="Search by username or email..."
                                />
                                {renderUserList(filteredUsers, 'discover')}
                            </div>
                        </Tab>
                        <Tab eventKey="following" title="Following">
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4">Users You Follow</h4>
                                {renderUserList(relationships.following, 'following')}
                            </div>
                        </Tab>
                        <Tab eventKey="followers" title="Followers">
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4">Your Followers</h4>
                                {renderUserList(relationships.followers, 'followers')}
                            </div>
                        </Tab>
                        <Tab eventKey="requests" title={`Requests (${relationships.pendingRequests.length})`}>
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4">Pending Follow Requests</h4>
                                {renderUserList(relationships.pendingRequests, 'requests')}
                            </div>
                        </Tab>
                    </Tabs>
                </>
            )}

            <style jsx>{`
                /* General Container and Text Styles */
                .bg-light-brown-100 { background-color: #f8f4ed; }
                .text-brown-800 { color: #5a4434; }
                .text-brown-900 { color: #4a382e; }
                .text-gray-700 { color: #4a5568; }
                .text-gray-600 { color: #718096; }
                .text-gray-500 { color: #a0aec0; }
                .border-light-brown { border-color: #d4c7b8; }
                .border-light-brown-100 { border-color: #e0d9c8; }
                .bg-light-brown-50 { background-color: #fdfbf5; }

                /* User Card Styles */
                .user-card {
                    border: 1px solid #e0d9c8;
                    background-color: #ffffff;
                    border-radius: 0.75rem; /* More rounded corners */
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Softer shadow */
                }
                .user-card:hover {
                    transform: translateY(-5px); /* More pronounced lift on hover */
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); /* Stronger shadow on hover */
                }
                .user-avatar {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background-color: #d4c7b8; /* Light brown background for avatar */
                    color: #5a4434; /* Dark brown text */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 2.2rem; /* Larger font for initial */
                    font-weight: bold;
                    border: 2px solid #5a4434; /* Border around avatar */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                /* User List Grid */
                .user-list-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); /* Slightly wider cards */
                    gap: 1.5rem;
                }

                /* Custom Button Styles (consistent with Dashboard) */
                .custom-button {
                    background-color: #5a4434;
                    border-color: #5a4434;
                    color: white;
                    border-radius: 0.5rem; /* More rounded buttons */
                    padding: 0.6rem 1.2rem; /* Slightly larger padding */
                    font-weight: 600;
                    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, transform 0.1s ease-in-out;
                }
                .custom-button:hover {
                    background-color: #7b6a5a;
                    border-color: #7b6a5a;
                    transform: translateY(-2px); /* More lift on hover */
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .custom-button:active {
                    transform: translateY(0);
                }

                .custom-button-sm {
                    font-size: 0.85rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.375rem;
                }

                /* Outline Buttons */
                .btn-outline-primary {
                    color: #5a4434;
                    border-color: #5a4434;
                    background-color: transparent;
                }
                .btn-outline-primary:hover {
                    background-color: #5a4434;
                    color: white;
                }
                .btn-outline-info {
                    color: #17a2b8; /* Bootstrap info color */
                    border-color: #17a2b8;
                    background-color: transparent;
                }
                .btn-outline-info:hover {
                    background-color: #17a2b8;
                    color: white;
                }
                .btn-outline-secondary {
                    color: #6c757d; /* Bootstrap secondary color */
                    border-color: #6c757d;
                    background-color: transparent;
                }
                .btn-outline-secondary:hover {
                    background-color: #6c757d;
                    color: white;
                }

                /* Tab Styles (consistent with Dashboard but slightly adjusted for UsersPage) */
                .custom-tabs-users .nav-link {
                    background-color: #e0d9c8;
                    color: #5a4434;
                    border: 1px solid #c8c0b2;
                    border-bottom: none; /* Remove default bottom border */
                    margin-bottom: -1px; /* Align perfectly with content */
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    font-weight: bold;
                    transition: all 0.2s ease-in-out;
                    padding: 0.75rem 1.25rem;
                }

                .custom-tabs-users .nav-link.active {
                    background-color: #5a4434; /* Darker brown for active tab */
                    color: white;
                    border-color: #5a4434;
                }

                .custom-tabs-users .nav-link:hover:not(.active) {
                    background-color: #d4c7b8; /* Slightly darker on hover for inactive */
                    color: #4a382e;
                }

                .custom-tabs-users .tab-content {
                    background-color: #ffffff; /* Content area background */
                    border: 1px solid #d4c7b8;
                    border-top-left-radius: 0; /* Align with active tab */
                    border-top-right-radius: 0;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 1.5rem;
                }

                /* Search Input Styling */
                .input-group .form-control {
                    border-color: #d4c7b8;
                    border-radius: 0.375rem;
                }
                .input-group .btn-outline-secondary {
                    border-color: #d4c7b8;
                    color: #5a4434;
                }
                .input-group .btn-outline-secondary:hover {
                    background-color: #d4c7b8;
                    color: #4a382e;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .user-list-grid {
                        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* Smaller cards on mobile */
                        gap: 1rem;
                    }
                    .user-card {
                        padding: 1rem;
                    }
                    .user-avatar {
                        width: 60px;
                        height: 60px;
                        font-size: 1.8rem;
                    }
                    .custom-tabs-users .nav-link {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.85rem;
                    }
                }
            `}</style>
        </Container>
    );
};

export default UsersPage;
