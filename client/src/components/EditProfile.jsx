// src/components/EditProfile.jsx
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'; // Import Storage functions
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Image, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// EditProfile component now accepts props for modal control
function EditProfile({ show, onHide }) {
    // Destructure db, storage, and firebaseUser from useAuth
    const { user, isAuthenticated, loading: authLoading, refreshUser, db, storage, firebaseUser } = useAuth();
    const { showToast } = useToast();

    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null); // Current image URL from profileData
    const [newProfileImageFile, setNewProfileImageFile] = useState(null); // New file selected by user
    const [newProfileImagePreview, setNewProfileImagePreview] = useState(null); // URL for preview of new image

    const [socialLinks, setSocialLinks] = useState({
        goodreads: '',
        twitter: '',
        instagram: ''
    });

    const [loading, setLoading] = useState(true); // Loading for fetching initial profile data
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading for form submission
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [bioError, setBioError] = useState('');
    const [profileImageError, setProfileImageError] = useState('');

    const [fetchError, setFetchError] = useState('');

    // Fetch current profile data from Firestore
    const fetchCurrentProfile = useCallback(async () => {
        if (!show || authLoading || !db || !isAuthenticated || !user?.id) {
            // Defer fetching if modal is not shown, auth is loading, or not authenticated/db not ready
            if (show && !isAuthenticated) {
                setFetchError("You need to be logged in to edit your profile.");
                setLoading(false);
            } else if (!db) {
                setFetchError("Database not initialized. Please ensure Firebase is configured.");
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        setFetchError('');
        setMessage(''); // Clear messages on new fetch

        try {
            console.log(`EditProfile: Attempting to fetch profile for UID: ${user.id}`);
            const userProfileDocRef = doc(db, `artifacts/${currentAppId}/users`, user.id);
            const userProfileDocSnap = await getDoc(userProfileDocRef);

            if (userProfileDocSnap.exists()) {
                const data = userProfileDocSnap.data();
                setUsername(data.username || '');
                setEmail(data.email || '');
                setBio(data.bio || '');
                setProfileImage(data.profileImage || null); // Set current profile image URL
                setSocialLinks(data.socialLinks || { goodreads: '', twitter: '', instagram: '' });
                setNewProfileImageFile(null); // Clear any pending new file
                setNewProfileImagePreview(null); // Clear preview of new file
                console.log("EditProfile: Successfully loaded profile data from Firestore:", data);
            } else {
                setFetchError('Your profile data was not found in Firestore. Please ensure you are registered correctly.');
                console.warn("EditProfile: Profile document not found for current user in Firestore.");
                // Fallback to basic user data if Firestore doc doesn't exist but Firebase Auth user does
                if (user) {
                    setUsername(user.username || user.email || '');
                    setEmail(user.email || '');
                    setBio('');
                    setProfileImage(null);
                    setSocialLinks({ goodreads: '', twitter: '', instagram: '' });
                }
            }
        } catch (err) {
            console.error("EditProfile: Error fetching current profile from Firestore:", err);
            setFetchError(err.message || "Failed to load current profile data. Please check network or Firestore rules.");
        } finally {
            setLoading(false);
        }
    }, [show, isAuthenticated, user, authLoading, db, currentAppId]); // Added db and currentAppId to dependencies


    // Effect to trigger fetching profile when modal shows or auth state changes
    useEffect(() => {
        fetchCurrentProfile();
    }, [fetchCurrentProfile]);


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
                showToast('File size exceeds 2MB limit.', 'danger', 'Image Error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProfileImagePreview(reader.result); // For immediate visual preview
                setNewProfileImageFile(file); // Store the actual file object
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

        // Client-side validation
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

        if (!isAuthenticated || !user?.id || !db || !storage || !firebaseUser) {
            setMessage("You need to be logged in to update your profile.");
            setIsError(true);
            setIsSubmitting(false);
            showToast("You need to be logged in to update your profile.", 'danger', 'Authentication Error');
            return;
        }

        let newProfileImageUrl = profileImage; // Start with current image URL

        try {
            // Step 1: Handle profile image upload to Firebase Storage
            if (newProfileImageFile) {
                console.log("EditProfile: Uploading new profile image to Firebase Storage...");
                const storageRef = ref(storage, `artifacts/${currentAppId}/user_profile_images/${user.id}/${newProfileImageFile.name}`);
                await uploadBytes(storageRef, newProfileImageFile);
                newProfileImageUrl = await getDownloadURL(storageRef);
                console.log("EditProfile: New profile image uploaded. URL:", newProfileImageUrl);

                // Optional: Delete old image from Storage if it's different and exists (to save space)
                // This requires careful consideration if the old image URL could be shared or default
                if (profileImage && profileImage !== defaultProfileImage && profileImage !== newProfileImageUrl) {
                    try {
                        const oldImageRef = ref(storage, profileImage);
                        await deleteObject(oldImageRef);
                        console.log("EditProfile: Old profile image deleted from Storage:", profileImage);
                    } catch (deleteError) {
                        console.warn("EditProfile: Could not delete old profile image (might not exist or different path):", deleteError);
                    }
                }
            } else if (profileImage === null && newProfileImagePreview === null) {
                // If user cleared the image or there was no image, explicitly set to empty string
                newProfileImageUrl = '';
            }


            // Step 2: Update user profile document in Firestore
            console.log("EditProfile: Updating user profile document in Firestore...");
            const userProfileDocRef = doc(db, `artifacts/${currentAppId}/users`, user.id);
            await updateDoc(userProfileDocRef, {
                username: username,
                email: email, // Note: Changing email in Firestore does not change Firebase Auth email
                bio: bio,
                profileImage: newProfileImageUrl, // Save the new image URL
                socialLinks: socialLinks,
                // The current user object from AuthContext already contains id, date, role, phoneNumber
                // No need to explicitly update them here unless they are part of the editable form.
            });
            console.log("EditProfile: Profile document updated in Firestore.");

            // Step 3: Refresh user data in AuthContext to propagate changes
            if (refreshUser && typeof refreshUser === 'function') {
                console.log("EditProfile: Refreshing user data in AuthContext.");
                await refreshUser(); // Assuming refreshUser updates the 'user' state in AuthContext
            }

            setMessage('Profile updated successfully!');
            setIsError(false);
            showToast('Profile updated successfully!', 'success', 'Success');
            setNewProfileImageFile(null);
            setNewProfileImagePreview(null);
            onHide(); // Close the modal on success

        } catch (err) {
            console.error("EditProfile: Error updating profile (Firestore/Storage):", err);
            setMessage(err.message || "Failed to update profile. Please try again.");
            setIsError(true);
            showToast(err.message || "Failed to update profile.", 'danger', 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = username && email && !usernameError && !emailError && !bioError && !profileImageError;

    // Placeholder for user avatar (e.g., first letter of username)
    // Use the currently selected preview or the existing profileImage or default
    const currentDisplayedImage = newProfileImagePreview || profileImage;
    const userAvatarInitial = user?.username ? user.username.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?');
    const defaultProfileImagePlaceholder = `https://placehold.co/120x120/d4c7b8/5a4434?text=${userAvatarInitial}`;


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
                    <Container className="book-form-container p-4 rounded shadow-md bg-white">
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
                                        src={currentDisplayedImage || defaultProfileImagePlaceholder}
                                        alt="Profile Preview"
                                        className="profile-upload-preview"
                                        roundedCircle
                                        onError={(e) => { e.target.onerror = null; e.target.src = defaultProfileImagePlaceholder; }}
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
                                    {currentDisplayedImage && (
                                        <Button
                                            variant="link"
                                            onClick={() => {
                                                setProfileImage(null); // Clear current image
                                                setNewProfileImageFile(null); // Clear selected file
                                                setNewProfileImagePreview(null); // Clear preview
                                                showToast("Profile image cleared. It will be removed on save.", 'info', 'Image Removed');
                                            }}
                                            className="ms-2 text-danger"
                                            size="sm"
                                        >
                                            Remove current image
                                        </Button>
                                    )}
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
