// src/components/UsersPage.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Import Link for clickable user cards
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

    let buttonContent;
    let buttonVariant;
    let buttonDisabled = false;
    let buttonAction = null;

    if (user._id === currentUser.id) {
        buttonContent = 'Your Profile';
        buttonVariant = 'outline-secondary';
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
        buttonVariant = 'outline-info';
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
                {/* Make the user avatar and username clickable to view profile */}
                <Link to={`/profile/${user._id}`} className="user-card-link">
                    <div className="user-avatar mb-3">
                        {userAvatar}
                    </div>
                    <Card.Title className="text-xl font-bold text-brown-800 mb-1 user-card-username">{user.username}</Card.Title>
                </Link>
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

        if (authLoading || !isAuthenticated || !token) {
            console.log('UsersPage: fetchAllUsers skipped - Auth not ready or not authenticated.');
            setErrorAllUsers('You must be logged in to view other users.');
            setLoadingAllUsers(false);
            return;
        }

        try {
            const url = `http://localhost:5000/api/social/users`;
            console.log('UsersPage: Fetching all discoverable users from:', url);
            console.log('UsersPage: Sending x-auth-token:', token.substring(0, 10) + '...');

            const response = await fetch(url, {
                headers: {
                    'x-auth-token': token,
                },
            });
            const data = await response.json();

            if (response.ok) {
                const usersWithoutCurrentUser = data.filter(u => u._id !== user.id);
                setAllUsers(usersWithoutCurrentUser);
                setFilteredUsers(usersWithoutCurrentUser);
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
            setErrorAllUsers('You must be logged in to view other users.');
            setLoadingAllUsers(false);
            setAllUsers([]);
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
                fetchRelationships();
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
                fetchRelationships();
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
                fetchRelationships();
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
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.msg, 'success', 'Success');
                fetchRelationships();
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
                    <Spinner animation="border" role="status" className="spinner-minimal">
                        <span className="visually-hidden">Loading users...</span>
                    </Spinner>
                    <p className="loading-text mt-3">Loading users for discovery...</p>
                </div>
            );
        }

        if (errorAllUsers && type === 'discover') {
            return <Alert variant="danger" className="alert-minimal alert-danger text-center mt-4">{errorAllUsers}</Alert>;
        }

        if (!isAuthenticated) {
            return (
                <Alert variant="info" className="alert-minimal text-center mt-4">
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
                <div className="text-center p-4 bg-light-brown-50 rounded border border-light-brown-100 mt-4">
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
                        onRespondToRequest={handleRespondToRequest}
                    />
                ))}
            </div>
        );
    };


    return (
        <Container className="profile-container my-5 p-4 rounded-xl shadow-lg bg-light-brown-100 text-center">
            <h2 className="mb-5 text-4xl font-extrabold text-brown-900 profile-title">
                Connect with Other Readers
            </h2>

            {!isAuthenticated && !authLoading ? (
                <Alert variant="warning" className="alert-minimal alert-warning mt-4 text-center">
                    Please log in to discover and connect with other users.
                </Alert>
            ) : authLoading ? (
                <div className="text-center p-4">
                    <Spinner animation="border" role="status" className="spinner-minimal">
                        <span className="visually-hidden">Loading authentication...</span>
                    </Spinner>
                    <p className="loading-text mt-3">Verifying authentication status...</p>
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
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4 section-title">Find New Connections</h4>
                                <SearchInput
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    onSearch={handleSearch}
                                    placeholder="Search by username or email..."
                                    className="form-control-minimal"
                                />
                                {renderUserList(filteredUsers, 'discover')}
                            </div>
                        </Tab>
                        <Tab eventKey="following" title="Following">
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4 section-title">Users You Follow</h4>
                                {renderUserList(relationships.following, 'following')}
                            </div>
                        </Tab>
                        <Tab eventKey="followers" title="Followers">
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4 section-title">Your Followers</h4>
                                {renderUserList(relationships.followers, 'followers')}
                            </div>
                        </Tab>
                        <Tab eventKey="requests" title={`Requests (${relationships.pendingRequests.length})`}>
                            <div className="p-4 bg-white rounded shadow-md border-0 text-left">
                                <h4 className="text-2xl font-semibold text-brown-800 mb-4 section-title">Pending Follow Requests</h4>
                                {renderUserList(relationships.pendingRequests, 'requests')}
                            </div>
                        </Tab>
                    </Tabs>
                </>
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

                /* User Card Styles */
                .user-card {
                    border: 1px solid var(--border-color); /* Consistent border */
                    background-color: #ffffff;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px var(--shadow-color);
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; /* Smooth transitions */
                }
                .user-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                }
                .user-avatar {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background-color: var(--secondary-brown); /* Consistent with profile avatar fallback */
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 2.2rem;
                    font-weight: bold;
                    border: 2px solid var(--primary-brown); /* Consistent border */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                /* Style for the clickable link area within the card */
                .user-card-link {
                    text-decoration: none; /* Remove underline */
                    color: inherit; /* Inherit text color */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%; /* Make the link take full width */
                }
                .user-card-link:hover .user-card-username {
                    color: var(--primary-brown); /* Change color on hover */
                }
                .user-card-username {
                    transition: color 0.2s ease-in-out;
                }


                /* User List Grid */
                .user-list-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 1.5rem;
                }

                /* Custom Button Styles (consistent with Dashboard and Profile) */
                .custom-button {
                    background-color: var(--primary-brown);
                    border-color: var(--primary-brown);
                    color: white;
                    border-radius: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    font-weight: 600;
                    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, transform 0.1s ease-in-out;
                }
                .custom-button:hover {
                    background-color: var(--secondary-brown);
                    border-color: var(--secondary-brown);
                    transform: translateY(-2px);
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

                /* Outline Buttons (consistent with Dashboard and Profile) */
                .btn-outline-primary {
                    color: var(--primary-brown);
                    border-color: var(--primary-brown);
                    background-color: transparent;
                }
                .btn-outline-primary:hover {
                    background-color: var(--primary-brown);
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
                    color: var(--text-medium); /* Use a text color for secondary */
                    border-color: var(--border-color);
                    background-color: transparent;
                }
                .btn-outline-secondary:hover {
                    background-color: var(--border-color);
                    color: var(--text-dark);
                }

                /* Tab Styles (consistent with Dashboard) */
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

                /* Search Input Styling (consistent with Login/Register) */
                .form-control-minimal { /* Re-using the class from Login/Register */
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    padding: 0.6rem 0.8rem;
                    font-size: 0.95rem;
                    color: #444444;
                    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .form-control-minimal:focus {
                    border-color: var(--primary-brown);
                    box-shadow: 0 0 0 2px rgba(90, 68, 52, 0.1);
                    outline: none;
                }
                .input-group .btn-outline-secondary { /* For the clear button in SearchInput */
                    border-color: var(--border-color);
                    color: var(--primary-brown);
                }
                .input-group .btn-outline-secondary:hover {
                    background-color: var(--light-brown-100);
                    color: var(--text-dark);
                }

                /* Minimalist Alert Styles (copied from Dashboard/Login/Profile) */
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

                /* Minimalist Spinner/Loading Styles (copied from Dashboard/Profile) */
                .spinner-minimal {
                    color: var(--primary-brown) !important;
                }
                .loading-text {
                    color: #777777;
                    margin-top: 1rem;
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
                    .user-list-grid {
                        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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