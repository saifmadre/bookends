// src/components/AddBook.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // <--- Make sure this import exists

function AddBook() {
    const { isAuthenticated, user, loading } = useAuth(); // <--- Get these values

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [message, setMessage] = useState(''); // To display the "You must be logged in" message

    // This useEffect ensures the initial message state is correct
    useEffect(() => {
        // Only set the message if we are not loading and not authenticated
        if (!loading && !isAuthenticated) {
            setMessage("You must be logged in to add a book to your list.");
        } else if (!loading && isAuthenticated) {
            setMessage(''); // Clear any previous auth message if now authenticated
        }
    }, [isAuthenticated, loading]); // Re-run if auth status or loading changes

    const handleSearch = async () => {
        // ... (your existing search logic)
        // Assume search itself doesn't require authentication, or it's handled separately.
        setMessage(''); // Clear any previous messages
        try {
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchTerm)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            } else {
                const errorData = await response.json();
                setMessage(`Error searching: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            setMessage('Network error during search.');
            console.error('Search error:', error);
        }
    };

    const handleAddBookToList = async (bookId) => {
        console.log('--- Attempting to Add Book ---');
        console.log('AddBook: isAuthenticated (from useAuth) BEFORE API call:', isAuthenticated);
        console.log('AddBook: user (from useAuth) BEFORE API call:', user);
        console.log('AddBook: loading (from useAuth) BEFORE API call:', loading);

        // Client-side check: Prevent API call if not authenticated
        if (!isAuthenticated) {
            setMessage("You must be logged in to add a book to your list.");
            console.warn("AddBook: Client-side check failed, isAuthenticated is FALSE. Preventing API call.");
            return; // Stop execution here
        }

        // Double-check if the token is available in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage("Missing authentication token in local storage. Please log in again.");
            console.error("AddBook: No token found in localStorage when trying to add a book.");
            // Consider forcing logout here if this happens, as it's an inconsistent state
            // logout(); // Uncomment if you want to force a logout
            return; // Stop execution here
        }

        try {
            // THIS IS THE CRITICAL API CALL FOR ADDING THE BOOK
            const response = await fetch('/api/user/books', { // <-- Verify this endpoint URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <--- THIS HEADER IS ESSENTIAL
                },
                body: JSON.stringify({ bookId }) // <--- Ensure your backend expects this payload
            });

            if (response.ok) {
                setMessage('Book added to your list successfully!');
                console.log('AddBook: Book added successfully to server!');
                // You might want to update the user's local reading list state here
            } else if (response.status === 401 || response.status === 403) {
                // Server explicitly denied access
                setMessage("You must be logged in to add a book to your list. Your session might have expired on the server.");
                console.error(`AddBook: Server responded with ${response.status} (Unauthorized/Forbidden) for add book request.`);
                // The AuthContext's useEffect should handle logging out on refresh,
                // but for immediate feedback, you could also call `logout()` here if needed.
                // For example: if (response.status === 401) { logout(); }
            } else {
                // Handle other server-side errors (e.g., 500 Internal Server Error, 400 Bad Request)
                const errorData = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
                setMessage(`Failed to add book: ${errorData.message || errorData || response.statusText}`);
                console.error('AddBook: Failed to add book (server error response):', errorData);
            }
        } catch (error) {
            // Handles network errors (e.g., server down, no internet)
            setMessage('Network error while attempting to add book. Please check your connection.');
            console.error('AddBook: Network error during add book request:', error);
        }
        console.log('--- Finished Add Book Attempt ---');
    };

    return (
        <div className="container mt-4">
            <h2>Add a Book to Your List</h2>
            {/* This div displays the message. Ensure it's rendered correctly. */}
            {message && (
                <div className={`alert ${message.includes("successfully") ? "alert-success" : "alert-danger"}`} role="alert">
                    {message}
                </div>
            )}

            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search for books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => { // Optional: allow search on Enter key
                        if (e.key === 'Enter') handleSearch();
                    }}
                />
                <button className="btn btn-primary rounded-end" onClick={handleSearch}>Search</button>
            </div>

            <div className="row">
                {loading ? ( // Check loading state here too if you want a spinner within the component
                    <p className="text-center">Loading books...</p>
                ) : searchResults.length > 0 ? (
                    searchResults.map((book) => (
                        <div key={book.id} className="col-md-4 mb-3">
                            <div className="card h-100 rounded">
                                <div className="card-body">
                                    <h5 className="card-title">{book.title}</h5>
                                    <p className="card-text">By: {book.author}</p>
                                    <p className="card-text"><small className="text-muted">Genre: {book.genre}</small></p>
                                    <button
                                        className="btn btn-success rounded"
                                        onClick={() => handleAddBookToList(book.id)}
                                        disabled={!isAuthenticated} // Disable button if not authenticated
                                    >
                                        {isAuthenticated ? "Add to List" : "Log in to Add"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center">No search results yet. Try searching!</p>
                )}
            </div>
        </div>
    );
}

export default AddBook;
