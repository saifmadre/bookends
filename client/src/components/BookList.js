import { addDoc, collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore'; // Import Firestore functions
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Assuming your AuthContext provides db and userId

function BookList() {
    // Get userId and db (Firestore instance) from your existing AuthContext
    const { userId, loadingAuth, db } = useAuth();
    const [books, setBooks] = useState([]);
    const [newBookTitle, setNewBookTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // Function to show custom modal messages (replaces alert())
    const showCustomModal = (message) => {
        setModalMessage(message);
        setShowModal(true);
    };

    // Fetch books for the current user in real-time
    useEffect(() => {
        // Ensure auth is loaded, userId is available, and db is initialized
        if (!loadingAuth && userId && db) {
            // Define the user-specific collection path
            // This is crucial for isolating data per user
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // Use __app_id from Canvas
            const userBooksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);

            // Set up a real-time listener for the user's books
            const q = query(userBooksCollectionRef);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedBooks = [];
                snapshot.forEach((doc) => {
                    fetchedBooks.push({ id: doc.id, ...doc.data() });
                });
                setBooks(fetchedBooks);
            }, (error) => {
                console.error("Error fetching books:", error);
                setErrorMessage("Failed to load books. Please try again.");
            });

            return () => unsubscribe(); // Clean up the listener on unmount
        }
    }, [userId, loadingAuth, db]); // Dependencies: Re-run when userId or db changes

    const handleAddBook = async () => {
        if (!newBookTitle.trim()) {
            showCustomModal("Book title cannot be empty.");
            return;
        }
        if (!userId) {
            showCustomModal("User not authenticated. Cannot add book.");
            return;
        }
        if (!db) {
            showCustomModal("Database not initialized. Cannot add book.");
            return;
        }

        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // Add the book to the user's specific collection
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/books`), {
                title: newBookTitle,
                createdAt: new Date().toISOString(),
                ownerId: userId // Explicitly store owner ID for clarity and security rules
            });
            setNewBookTitle('');
            showCustomModal("Book added successfully!");
        } catch (e) {
            console.error("Error adding document: ", e);
            setErrorMessage("Error adding book: " + e.message);
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (!userId) {
            showCustomModal("User not authenticated. Cannot delete book.");
            return;
        }
        if (!db) {
            showCustomModal("Database not initialized. Cannot delete book.");
            return;
        }

        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // Delete the book from the user's specific collection
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/books`, bookId));
            showCustomModal("Book deleted successfully!");
        } catch (e) {
            console.error("Error deleting document: ", e);
            setErrorMessage("Error deleting book: " + e.message);
        }
    };

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl text-gray-700">Loading authentication...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 font-inter">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl p-8 my-8 border border-gray-200">
                <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6">My Reading List</h1>
                <p className="text-center text-gray-600 mb-8">
                    Welcome! Your User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded-md text-sm text-gray-700 select-all">{userId || 'N/A'}</span>
                </p>

                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {errorMessage}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input
                        type="text"
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                        placeholder="Enter new book title"
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleAddBook(); }}
                    />
                    <button
                        onClick={handleAddBook}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Add Book
                    </button>
                </div>

                {books.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg py-10">No books in your reading list yet. Add one!</p>
                ) : (
                    <ul className="space-y-4">
                        {books.map((book) => (
                            <li key={book.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                                <span className="text-lg text-gray-800 font-medium">{book.title}</span>
                                <button
                                    onClick={() => handleDeleteBook(book.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition duration-300 ease-in-out text-sm"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Custom Modal for Alerts */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-4">{modalMessage}</p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BookList;
