// src/components/EditProfile.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Image, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// EditProfile component now accepts props for modal control
function EditProfile({ show, onHide }) {
    const { user, isAuthenticated, token, loading: authLoading, refreshUser } = useAuth();
    const { showToast } = useToast();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [newProfileImageFile, setNewProfileImageFile] = useState(null);
    const [newProfileImagePreview, setNewProfileImagePreview] = useState(null);

    const [socialLinks, setSocialLinks] = useState({
        goodreads: '',
        twitter: '',
        instagram: ''
    });

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [bioError, setBioError] = useState('');
    const [profileImageError, setProfileImageError] = useState('');

    const [fetchError, setFetchError] = useState('');

    // Fetch current profile data on component mount or when modal is shown
    useEffect(() => {
        const fetchCurrentProfile = async () => {
            if (!show || authLoading) {
                setLoading(true);
                return;
            }

            if (isAuthenticated && token) {
                setLoading(true);
                setFetchError('');
                try {
                    const response = await fetch('http://localhost:5000/api/profile', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token,
                        },
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setUsername(data.username || '');
                        setEmail(data.email || '');
                        setBio(data.bio || '');
                        setProfileImage(data.profileImage || null);
                        setSocialLinks({
                            goodreads: data.socialLinks?.goodreads || '',
                            twitter: data.socialLinks?.twitter || '',
                            instagram: data.socialLinks?.instagram || ''
                        });
                        setNewProfileImageFile(null);
                        setNewProfileImagePreview(null);
                    } else {
                        setMessage(data.msg || 'Failed to load current profile data.');
                        setIsError(true);
                        setFetchError(data.msg || 'Failed to load current profile data.');
                    }
                } catch (err) {
                    console.error("Error fetching current profile:", err);
                    setMessage("Network error or server unavailable.");
                    setIsError(true);
                    setFetchError("Network error or server unavailable.");
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                setMessage("You need to be logged in to edit your profile.");
                setIsError(true);
                setFetchError("You need to be logged in to edit your profile.");
            }
        };
        fetchCurrentProfile();
    }, [show, isAuthenticated, user, token, authLoading]);

    // Validation functions
    const validateUsername = (name) => {
        if (!name.trim()) {
            setUsernameError('Username cannot be empty.');
            return false;
        }
        if (name.length < 3) {
            setUsernameError('Username must be at least 3 characters.');
            return false;
        }
        setUsernameError('');
        return true;
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Invalid email format (e.g., user@example.com)');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validateBio = (bioText) => {
        if (bioText.length > 500) {
            setBioError('Bio cannot exceed 500 characters.');
            return false;
        }
        setBioError('');
        return true;
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        validateUsername(value);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    const handleBioChange = (e) => {
        const value = e.target.value;
        setBio(value);
        validateBio(value);
    };

    const handleSocialLinkChange = (platform, value) => {
        setSocialLinks(prev => ({ ...prev, [platform]: value }));
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setProfileImageError('File size exceeds 2MB limit.');
                setNewProfileImageFile(null);
                setNewProfileImagePreview(null);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProfileImagePreview(reader.result);
                setNewProfileImageFile(file);
                setProfileImageError('');
            };
            reader.readAsDataURL(file);
        } else {
            setNewProfileImageFile(null);
            setNewProfileImagePreview(null);
            setProfileImageError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSubmitting(true);

        const isUsernameValid = validateUsername(username);
        const isEmailValid = validateEmail(email);
        const isBioValid = validateBio(bio);

        if (!isUsernameValid || !isEmailValid || !isBioValid) {
            setMessage('Please correct the errors in the form.');
            setIsError(true);
            setIsSubmitting(false);
            showToast('Please correct the errors in the form.', 'danger', 'Validation Error');
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('bio', bio);
        formData.append('socialLinks', JSON.stringify(socialLinks));

        if (newProfileImageFile) {
            formData.append('profileImage', newProfileImageFile);
        }

        try {
            const response = await fetch('http://localhost:5000/api/profile/update', {
                method: 'PUT',
                headers: {
                    'x-auth-token': token,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg || 'Profile updated successfully!');
                setIsError(false);
                showToast(data.msg || 'Profile updated successfully!', 'success', 'Success');
                await refreshUser();
                setNewProfileImageFile(null);
                setNewProfileImagePreview(null);
                if (data.profileImage) {
                    setProfileImage(data.profileImage);
                }
                onHide(); // Close the modal on success
            } else {
                setMessage(data.msg || 'Failed to update profile.');
                setIsError(true);
                showToast(data.msg || 'Failed to update profile.', 'danger', 'Error');
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setMessage("Network error or server unavailable. Please try again later.");
            setIsError(true);
            showToast("Network error or server unavailable. Please try again later.", 'danger', 'Network Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = username && email && !usernameError && !emailError && !bioError && !profileImageError;

    // Placeholder for user avatar (e.g., first letter of username)
    const userAvatarInitial = user?.username ? user.username.charAt(0).toUpperCase() : '?';
    const defaultProfileImage = `https://placehold.co/100x100/d4c7b8/5a4434?text=${userAvatarInitial}`;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="modal-header-custom">
                <Modal.Title className="modal-title-custom">Edit Your Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-body-custom">
                {authLoading || loading ? (
                    <Container className="text-center p-4">
                        <Spinner animation="border" role="status" className="book-form-text">
                            <span className="visually-hidden">Loading profile...</span>
                        </Spinner>
                        <p className="book-form-text mt-3">Loading current profile data...</p>
                    </Container>
                ) : fetchError ? (
                    <Alert variant="danger" className="mb-0">{fetchError}</Alert>
                ) : (
                    <Container className="book-form-container p-4 rounded shadow-md bg-white"> {/* Added Container here */}
                        {message && (
                            <Alert variant={isError ? 'danger' : 'success'} className="mb-3">
                                {message}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            {/* Profile Image Section */}
                            <Form.Group controlId="profileImage" className="mb-4 text-center">
                                <Form.Label className="book-form-label mb-3">Profile Avatar</Form.Label>
                                <div className="profile-image-upload-area mb-3">
                                    <Image
                                        src={newProfileImagePreview || profileImage || defaultProfileImage}
                                        alt="Profile Preview"
                                        className="profile-upload-preview"
                                        roundedCircle
                                    />
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfileImageChange}
                                        className="mt-3"
                                    />
                                </div>
                                {profileImageError && <div className="invalid-feedback d-block">{profileImageError}</div>}
                                <Form.Text className="text-muted">
                                    Upload a new profile picture (Max 2MB).
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="editProfileUsername">
                                <Form.Label className="book-form-label">Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter new username"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    required
                                    className={`book-form-control ${usernameError ? 'is-invalid' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {usernameError && <div className="invalid-feedback">{usernameError}</div>}
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="editProfileEmail">
                                <Form.Label className="book-form-label">Email address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter new email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    className={`book-form-control ${emailError ? 'is-invalid' : ''}`}
                                    disabled={isSubmitting}
                                />
                                {emailError && <div className="invalid-feedback">{emailError}</div>}
                            </Form.Group>

                            {/* Bio Section */}
                            <Form.Group className="mb-3" controlId="editProfileBio">
                                <Form.Label className="book-form-label">Bio / About Me</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Tell us a bit about yourself and your reading interests..."
                                    value={bio}
                                    onChange={handleBioChange}
                                    maxLength={500}
                                    className={`book-form-control ${bioError ? 'is-invalid' : ''}`}
                                    disabled={isSubmitting}
                                />
                                <Form.Text className="text-muted">
                                    {bio.length}/500 characters
                                </Form.Text>
                                {bioError && <div className="invalid-feedback d-block">{bioError}</div>}
                            </Form.Group>

                            {/* Social Links Section */}
                            <h4 className="text-xl font-semibold text-brown-800 mb-3 mt-4">Social Links (Optional)</h4>
                            <Form.Group className="mb-3" controlId="socialGoodreads">
                                <Form.Label className="book-form-label">Goodreads Profile URL</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><i className="fab fa-goodreads"></i></InputGroup.Text>
                                    <Form.Control
                                        type="url"
                                        placeholder="e.g., https://www.goodreads.com/yourprofile"
                                        value={socialLinks.goodreads}
                                        onChange={(e) => handleSocialLinkChange('goodreads', e.target.value)}
                                        className="book-form-control"
                                        disabled={isSubmitting}
                                    />
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="socialTwitter">
                                <Form.Label className="book-form-label">Twitter Profile URL</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><i className="fab fa-twitter"></i></InputGroup.Text>
                                    <Form.Control
                                        type="url"
                                        placeholder="e.g., https://twitter.com/yourhandle"
                                        value={socialLinks.twitter}
                                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                        className="book-form-control"
                                        disabled={isSubmitting}
                                    />
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-4" controlId="socialInstagram">
                                <Form.Label className="book-form-label">Instagram Profile URL</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><i className="fab fa-instagram"></i></InputGroup.Text>
                                    <Form.Control
                                        type="url"
                                        placeholder="e.g., https://www.instagram.com/yourhandle"
                                        value={socialLinks.instagram}
                                        onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                        className="book-form-control"
                                        disabled={isSubmitting}
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100 custom-button" disabled={isSubmitting || !isFormValid}>
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
                                        Updating Profile...
                                    </>
                                ) : (
                                    'Update Profile'
                                )}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={onHide}
                                className="w-100 custom-button mt-2"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        </Form>
                    </Container>
                )}
            </Modal.Body>
            <style jsx>{`
                /* General Container and Text Styles */
                .bg-light-brown-100 { background-color: #f8f4ed; }
                .text-brown-800 { color: #5a4434; }
                .text-brown-900 { color: #4a382e; }
                .book-form-label { color: #5a4434; font-weight: 600; }
                .book-form-control { border-color: #d4c7b8; border-radius: 0.375rem; }
                .book-form-control:focus { border-color: #7b6a5a; box-shadow: 0 0 0 0.25rem rgba(90, 68, 52, 0.25); }
                .invalid-feedback { color: #dc3545; font-size: 0.875em; }

                /* Profile Image Upload Area */
                .profile-image-upload-area {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                }

                .profile-upload-preview {
                    width: 120px;
                    height: 120px;
                    object-fit: cover;
                    border: 3px solid #5a4434;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    margin-bottom: 1rem;
                }

                /* Custom Button Styles (consistent with Dashboard) */
                .custom-button {
                    background-color: #5a4434;
                    border-color: #5a4434;
                    color: white;
                    border-radius: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, transform 0.1s ease-in-out;
                }
                .custom-button:hover {
                    background-color: #7b6a5a;
                    border-color: #7b6a5a;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .custom-button:active {
                    transform: translateY(0);
                }

                /* Input Group for Social Links */
                .input-group-text {
                    background-color: #e0d9c8;
                    border-color: #d4c7b8;
                    color: #5a4434;
                    border-top-left-radius: 0.375rem;
                    border-bottom-left-radius: 0.375rem;
                }
                .input-group .form-control {
                    border-top-left-radius: 0 !important;
                    border-bottom-left-radius: 0 !important;
                }

                /* Modal Specific Styles */
                .modal-header-custom {
                    background-color: #f8f4ed;
                    border-bottom: 1px solid #d4c7b8;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
                .modal-title-custom {
                    color: #5a4434;
                    font-weight: bold;
                }
                .modal-body-custom {
                    background-color: #fdfbf5;
                    color: #5a4434;
                }
                .modal-content {
                    border-radius: 0.5rem;
                    overflow: hidden;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .book-form-container {
                        margin: 0 1rem;
                        padding: 1rem;
                    }
                    .custom-button {
                        width: 100%;
                    }
                }
            `}</style>
        </Modal>
    );
}

export default EditProfile;
