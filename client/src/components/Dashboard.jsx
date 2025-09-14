import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Main App Component
import { useAuth } from '../contexts/AuthContext';

// Importing custom components for a better UI/UX
import CustomAlert from './CustomAlert';
import CustomToast from './CustomToast';
import DashboardLayout from './DashboardLayout';
import DiscoverBooks from './DiscoverBooks';
import HomeContent from './HomeContent';
import MyReadingList from './MyReadingList';
import ProfileContent from './ProfileContent';
import ReadingStatistics from './ReadingStatistics';
import RecommendedBooks from './RecommendedBooks';

// Import Modals
import BookDetailsModal from './modals/BookDetailsModal';
import ConfirmRemoveModal from './modals/ConfirmRemoveModal';
import EditBookModal from './modals/EditBookModal';
import SetGoalModal from './modals/SetGoalModal';

function Dashboard() {
    const { auth, db, userId, loading: authLoading, user, isAuthenticated } = useAuth();
    const [toast, setToast] = useState({ show: false, message: '', variant: 'info', title: '' });

    const showToast = useCallback((message, variant = 'info', title = 'Notification') => {
        setToast({ show: true, message, variant, title });
    }, []);

    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const [activeTab, setActiveTab] = useState('home');
    const [myBooks, setMyBooks] = useState([]);
    const [externalBooks, setExternalBooks] = useState([]);
    const [loadingMyBooks, setLoadingMyBooks] = useState(true);
    const [loadingExternalBooks, setLoadingExternalBooks] = useState(false);
    const [errorMyBooks, setErrorMyBooks] = useState('');
    const [errorExternalBooks, setErrorExternalBooks] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [bookToEdit, setBookToEdit] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: '', author: '', genre: '', coverImageUrl: '', status: '',
        currentPage: '', totalPages: '',
        rating: '',
        reviewText: '',
        notes: '',
        highlights: ''
    });
    const [editFormErrors, setEditFormErrors] = useState({});

    const [confirmRemoveBook, setConfirmRemoveBook] = useState(null);
    const [currentPageInput, setCurrentPageInput] = useState({});

    const [sortCriteria, setSortCriteria] = useState('addedDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterGenre, setFilterGenre] = useState('All');
    const [filterAuthor, setFilterAuthor] = useState('All');
    const [minRatingFilter, setMinRatingFilter] = useState('0');
    const [hasNotesFilter, setHasNotesFilter] = useState('All');
    const [filterPageCount, setFilterPageCount] = useState('All');

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [newGoalType, setNewGoalType] = useState('books');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalPeriod, setNewGoalPeriod] = useState('yearly');
    const [goalFormErrors, setGoalFormErrors] = useState({});
    const [currentGoals, setCurrentGoals] = useState(() => {
        try {
            const storedGoals = localStorage.getItem('readingGoals');
            return storedGoals ? JSON.parse(storedGoals) : [];
        } catch (error) {
            console.error("Failed to parse reading goals from localStorage:", error);
            return [];
        }
    });

    const [recommendedBooks, setRecommendedBooks] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [errorRecommendations, setErrorRecommendations] = useState('');
    const [selectedRecommendationSeedBook, setSelectedRecommendationSeedBook] = useState(null);
    const [hasFetchedRecommendations, setHasFetchedRecommendations] = useState(false);

    const [categorizedRecommendations, setCategorizedRecommendations] = useState({});
    const [loadingCategorizedRecommendations, setLoadingCategorizedRecommendations] = useState(false);
    const [errorCategorizedRecommendations, setErrorCategorizedRecommendations] = useState('');
    const [hasFetchedCategorizedRecommendations, setHasFetchedCategorizedRecommendations] = useState(false);

    const [notInterestedBooks, setNotInterestedBooks] = useState(new Set());

    const handleCurrentPageInputChange = useCallback((bookId, value) => {
        setCurrentPageInput(prevState => ({
            ...prevState,
            [bookId]: value
        }));
    }, []);

    const fetchBooksFromGoogleAPI = useCallback(async (query, maxResults = 10, startIndex = 0) => {
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.items) {
                return data.items.map(item => {
                    const volumeInfo = item.volumeInfo;
                    return {
                        id: item.id,
                        title: volumeInfo.title || 'N/A',
                        author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'N/A',
                        description: volumeInfo.description || 'No description available.',
                        genre: volumeInfo.categories ? volumeInfo.categories.join(', ') : 'General',
                        coverImageUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover',
                        averageRating: volumeInfo.averageRating || 0,
                        ratingsCount: volumeInfo.ratingsCount || 0,
                        pageCount: volumeInfo.pageCount || 0,
                        publishedDate: volumeInfo.publishedDate || 'N/A'
                    };
                });
            }
            return [];
        } catch (error) {
            console.error("Error fetching from Google Books API:", error);
            showToast("Failed to fetch books from Google Books. Please try again later.", 'danger', 'API Error');
            return [];
        }
    }, [showToast]);

    const searchExternalBooks = useCallback(async (query) => {
        setLoadingExternalBooks(true);
        setErrorExternalBooks('');
        const books = await fetchBooksFromGoogleAPI(query, 20);
        setExternalBooks(books);
        setLoadingExternalBooks(false);
    }, [fetchBooksFromGoogleAPI]);

    const fetchRecommendations = useCallback(async () => {
        if (loadingRecommendations) return;
        setLoadingRecommendations(true);
        setErrorRecommendations('');
        setHasFetchedRecommendations(true);

        let currentRecs = [];
        const isExcluded = (book) => {
            const inMyBooks = myBooks.some(b =>
                b.title.toLowerCase() === book.title.toLowerCase() &&
                b.author?.toLowerCase() === book.author?.toLowerCase()
            );
            const isNotInterested = notInterestedBooks.has(book.id);
            return inMyBooks || isNotInterested;
        };

        if (selectedRecommendationSeedBook) {
            const seedGenres = selectedRecommendationSeedBook.genre ? selectedRecommendationSeedBook.genre.split(',').map(g => g.trim()) : [];
            const seedAuthors = selectedRecommendationSeedBook.author ? selectedRecommendationSeedBook.author.split(',').map(a => a.trim()) : [];

            let queryParts = [];
            if (seedGenres.length > 0) queryParts.push(`subject:${seedGenres[0]}`);
            if (seedAuthors.length > 0) queryParts.push(`inauthor:"${seedAuthors[0]}"`);
            if (queryParts.length === 0) queryParts.push("fiction");

            let startIndex = 0;
            const maxAttempts = 3;
            const booksPerFetch = 10;
            const targetRecs = 10;

            for (let attempt = 0; attempt < maxAttempts && currentRecs.length < targetRecs; attempt++) {
                const fetched = await fetchBooksFromGoogleAPI(queryParts.join(' '), booksPerFetch, startIndex);
                const filteredFetched = fetched.filter(book => !isExcluded(book) && !currentRecs.some(r => r.id === book.id));
                currentRecs = [...currentRecs, ...filteredFetched];
                startIndex += booksPerFetch;
            }
            currentRecs = currentRecs.slice(0, targetRecs);

            currentRecs.forEach(recBook => {
                let similarityScore = 0;
                const recGenres = recBook.genre ? recBook.genre.split(',').map(g => g.trim()) : [];
                const recAuthors = recBook.author ? recBook.author.split(',').map(a => a.trim()) : [];

                if (seedGenres.some(g => recGenres.includes(g))) similarityScore += 50;
                if (seedAuthors.some(a => recAuthors.includes(a))) similarityScore += 40;
                if (Math.abs((selectedRecommendationSeedBook.averageRating || selectedRecommendationSeedBook.rating || 0) - (recBook.averageRating || 0)) < 0.5) {
                    similarityScore += 10;
                }
                recBook.similarityScore = similarityScore;
            });
            currentRecs.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));

        } else {
            let startIndex = 0;
            const maxAttempts = 3;
            const booksPerFetch = 10;
            const targetRecs = 10;

            for (let attempt = 0; attempt < maxAttempts && currentRecs.length < targetRecs; attempt++) {
                const fetched = await fetchBooksFromGoogleAPI("bestsellers fiction", booksPerFetch, startIndex);
                const filteredFetched = fetched.filter(book => !isExcluded(book) && !currentRecs.some(r => r.id === book.id));
                currentRecs = [...currentRecs, ...filteredFetched];
                startIndex += booksPerFetch;
            }
            currentRecs = currentRecs.slice(0, targetRecs);
        }

        setRecommendedBooks(currentRecs);
        setLoadingRecommendations(false);
    }, [myBooks, selectedRecommendationSeedBook, notInterestedBooks, fetchBooksFromGoogleAPI, loadingRecommendations]);

    const fetchCategorizedRecommendations = useCallback(async () => {
        if (loadingCategorizedRecommendations) return;
        setLoadingCategorizedRecommendations(true);
        setErrorCategorizedRecommendations('');
        setHasFetchedCategorizedRecommendations(true);

        const categorizedData = {};
        const genresToDisplay = ["Fantasy", "Science Fiction", "Mystery", "Thriller", "Horror", "Romance", "Historical Fiction", "Biography", "Young Adult", "Fiction", "Nonfiction", "Self-Help", "Business"];

        const isExcluded = (book) => {
            const inMyBooks = myBooks.some(b =>
                b.title.toLowerCase() === book.title.toLowerCase() &&
                b.author?.toLowerCase() === b.author?.toLowerCase()
            );
            const isNotInterested = notInterestedBooks.has(book.id);
            return inMyBooks || isNotInterested;
        };

        for (const genre of genresToDisplay) {
            let fetchedBooksForCategory = [];
            let startIndex = 0;
            const maxAttempts = 3;
            const booksPerFetch = 10;
            const targetBooksPerCategory = 4;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const query = `subject:${genre}`;
                const books = await fetchBooksFromGoogleAPI(query, booksPerFetch, startIndex);

                const newUniqueBooks = books.filter(book => {
                    return !isExcluded(book) &&
                        !fetchedBooksForCategory.some(existingBook => existingBook.id === book.id);
                });

                fetchedBooksForCategory = [...fetchedBooksForCategory, ...newUniqueBooks];

                if (fetchedBooksForCategory.length >= targetBooksPerCategory) {
                    break;
                }

                startIndex += booksPerFetch;
            }

            if (fetchedBooksForCategory.length > 0) {
                categorizedData[genre] = fetchedBooksForCategory.slice(0, targetBooksPerCategory);
            }
        }

        setCategorizedRecommendations(categorizedData);
        setLoadingCategorizedRecommendations(false);
    }, [myBooks, notInterestedBooks, fetchBooksFromGoogleAPI, loadingCategorizedRecommendations]);

    const handleExternalSearch = useCallback((e) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        const trimmedSearchTerm = searchTerm.trim();

        if (trimmedSearchTerm.length < 3) {
            setExternalBooks([]);
            setErrorExternalBooks('');
            showToast('Please enter at least 3 characters to search.', 'info', 'Info');
            return;
        }
        searchExternalBooks(trimmedSearchTerm);
    }, [searchTerm, searchExternalBooks, showToast]);

    const handleShowDetails = useCallback((book) => {
        setSelectedBook(book);
        setShowDetailsModal(true);
    }, []);

    const handleAddToList = useCallback(async (bookToAdd) => {
        if (!isAuthenticated || !user?.id || !db || !userId) {
            showToast('You must be logged in to add a book to your list.', 'danger', 'Authentication Error');
            return;
        }

        const isAlreadyInMyBooks = myBooks.some(book =>
            book.title.toLowerCase() === bookToAdd.title.toLowerCase() &&
            book.author.toLowerCase() === bookToAdd.author.toLowerCase()
        );

        if (isAlreadyInMyBooks) {
            showToast(`"${bookToAdd.title}" is already in your reading list!`, 'info', 'Duplicate Book');
            setShowDetailsModal(false);
            return;
        }

        try {
            const newBookData = {
                title: bookToAdd.title,
                author: bookToAdd.author || 'N/A',
                description: bookToAdd.description,
                genre: bookToAdd.genre || 'General',
                coverImageUrl: bookToAdd.coverImageUrl,
                status: 'Planned',
                user: userId,
                currentPage: 0,
                totalPages: bookToAdd.pageCount || 0,
                notes: '',
                highlights: '',
                rating: null,
                reviewText: '',
                addedDate: new Date().toISOString()
            };

            const collectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/books`);
            await addDoc(collectionRef, newBookData);

            showToast(`"${bookToAdd.title}" added to your reading list!`, 'success', 'Success');
            setShowDetailsModal(false);
            setHasFetchedRecommendations(false);
            setHasFetchedCategorizedRecommendations(false);
        } catch (err) {
            console.error("Error adding book to list (Firestore):", err);
            showToast("Failed to add book to list.", 'danger', 'Error');
        }
    }, [isAuthenticated, user?.id, db, userId, myBooks, currentAppId, showToast]);

    const handleEditClick = useCallback((book) => {
        setBookToEdit(book);
        setEditFormData({
            title: book.title || '',
            author: book.author || '',
            genre: book.genre || '',
            coverImageUrl: book.coverImageUrl || '',
            status: book.status || 'Planned',
            currentPage: book.currentPage || 0,
            totalPages: book.totalPages || 0,
            rating: book.rating || '',
            reviewText: book.reviewText || '',
            notes: book.notes || '',
            highlights: ''
        });
        setEditFormErrors({});
        setShowEditModal(true);
    }, []);

    const handleEditFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        setEditFormErrors(prevErrors => ({
            ...prevErrors,
            [name]: undefined
        }));
    }, []);

    const validateEditForm = useCallback(() => {
        const errors = {};
        if (!editFormData.title.trim()) {
            errors.title = 'Title is required.';
        }
        if (!editFormData.author.trim()) {
            errors.author = 'Author is required.';
        }
        const currentPageNum = parseInt(editFormData.currentPage);
        const totalPagesNum = parseInt(editFormData.totalPages);

        if (isNaN(totalPagesNum) || totalPagesNum <= 0) {
            errors.totalPages = 'Total pages must be a positive number.';
        }
        if (isNaN(currentPageNum) || currentPageNum < 0) {
            errors.currentPage = 'Current page must be a non-negative number.';
        } else if (totalPagesNum > 0 && currentPageNum > totalPagesNum) {
            errors.currentPage = 'Current page cannot exceed total pages.';
        }

        setEditFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [editFormData, setEditFormErrors]);

    const handleUpdateBook = useCallback(async (e) => {
        e.preventDefault();
        if (!validateEditForm()) {
            showToast('Please correct the errors in the form.', 'danger', 'Validation Error');
            return;
        }

        if (!isAuthenticated || !user?.id || !db || !userId) {
            showToast('You must be logged in to edit a book.', 'danger', 'Authentication Error');
            return;
        }
        if (!bookToEdit?._id) {
            showToast('Error: Book ID not found for update.', 'danger', 'Error');
            return;
        }

        try {
            const ratingValue = editFormData.rating !== '' ? parseFloat(editFormData.rating) : null;
            const currentPageValue = editFormData.currentPage !== '' ? parseInt(editFormData.currentPage, 10) : null;
            const totalPagesValue = editFormData.totalPages !== '' ? parseInt(editFormData.totalPages, 10) : null;

            const updatedBookData = {
                ...editFormData,
                rating: ratingValue,
                currentPage: currentPageValue,
                totalPages: totalPagesValue
            };

            const bookDocRef = doc(db, `artifacts/${currentAppId}/users/${userId}/books`, bookToEdit._id);
            await updateDoc(bookDocRef, updatedBookData);

            showToast(`"${editFormData.title}" updated successfully!`, 'success', 'Success');
            setShowEditModal(false);
        } catch (err) {
            console.error("Error updating book (Firestore):", err);
            showToast("Failed to update book.", 'danger', 'Error');
        }
    }, [isAuthenticated, user?.id, db, userId, bookToEdit, editFormData, currentAppId, showToast, validateEditForm]);

    const handleConfirmRemove = useCallback((book) => {
        setConfirmRemoveBook(book);
    }, []);

    const handleRemoveFromMyList = useCallback(async () => {
        if (!confirmRemoveBook) return;
        if (!isAuthenticated || !user?.id || !db || !userId) {
            showToast('You must be logged in to remove a book.', 'danger', 'Authentication Error');
            setConfirmRemoveBook(null);
            return;
        }

        try {
            const bookDocRef = doc(db, `artifacts/${currentAppId}/users/${userId}/books`, confirmRemoveBook._id);
            await deleteDoc(bookDocRef);
            showToast(`"${confirmRemoveBook.title}" removed from your reading list.`, 'success', 'Success');
        } catch (err) {
            console.error("Error removing book (Firestore):", err);
            showToast("Failed to remove book.", 'danger', 'Error');
        } finally {
            setConfirmRemoveBook(null);
        }
    }, [isAuthenticated, user?.id, db, userId, confirmRemoveBook, currentAppId, showToast]);

    const handleSetGoal = useCallback(async (e) => {
        e.preventDefault();
        const errors = {};
        const targetNum = parseInt(newGoalTarget);
        if (isNaN(targetNum) || targetNum <= 0) {
            errors.newGoalTarget = 'Target must be a positive number.';
        }
        setGoalFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            showToast('Please correct the errors in the goal form.', 'danger', 'Validation Error');
            return;
        }

        const newGoal = {
            id: Date.now(),
            type: newGoalType,
            target: parseInt(newGoalTarget),
            period: newGoalPeriod,
        };

        setCurrentGoals(prevGoals => [...prevGoals, newGoal]);
        showToast('Reading goal set successfully!', 'success', 'Goal Set');
        setShowGoalModal(false);
        setNewGoalTarget('');
        setGoalFormErrors({});
    }, [newGoalType, newGoalTarget, newGoalPeriod, showToast, setGoalFormErrors]);

    const handleWantToRead = useCallback(async (book) => {
        if (!isAuthenticated || !user?.id || !db || !userId) {
            showToast('You must be logged in to add a book to your list.', 'danger', 'Authentication Error');
            return;
        }

        const isAlreadyInMyBooks = myBooks.some(b =>
            b.title.toLowerCase() === book.title.toLowerCase() &&
            b.author.toLowerCase() === book.author.toLowerCase()
        );

        if (isAlreadyInMyBooks) {
            showToast(`"${book.title}" is already in your reading list!`, 'info', 'Duplicate Book');
            return;
        }

        try {
            const newBookData = {
                title: book.title,
                author: book.author || 'N/A',
                description: book.description,
                genre: book.genre || 'General',
                coverImageUrl: book.coverImageUrl,
                status: 'Planned',
                user: userId,
                currentPage: 0,
                totalPages: book.pageCount || 0,
                notes: '',
                highlights: '',
                rating: null,
                reviewText: '',
                addedDate: new Date().toISOString()
            };

            const collectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/books`);
            await addDoc(collectionRef, newBookData);
            showToast(`"${book.title}" added to your "Want to Read" list!`, 'success', 'Success');
            setHasFetchedCategorizedRecommendations(false);
            setHasFetchedRecommendations(false);
        } catch (err) {
            console.error("Error adding book to 'Want to Read' (Firestore):", err);
            showToast("Failed to add book to 'Want to Read'.", 'danger', 'Error');
        }
    }, [isAuthenticated, user?.id, db, userId, myBooks, currentAppId, showToast]);

    const handleNotInterested = useCallback(async (book) => {
        if (!isAuthenticated || !user?.id) {
            showToast('You must be logged in to mark a book as "Not Interested".', 'danger', 'Authentication Error');
            return;
        }
        showToast(`"${book.title}" marked as "Not Interested".`, 'info', 'Preference Saved');
        setNotInterestedBooks(prev => new Set(prev).add(book.id));
        setCategorizedRecommendations(prevRecs => {
            const newRecs = { ...prevRecs };
            for (const category in newRecs) {
                newRecs[category] = newRecs[category].filter(rec => rec.id !== book.id);
            }
            return newRecs;
        });
        setRecommendedBooks(prevRecs => prevRecs.filter(rec => rec.id !== book.id));
    }, [isAuthenticated, user?.id, showToast]);

    const handleUpdateBookField = useCallback(async (bookId, fieldName, value) => {
        if (!isAuthenticated || !user?.id || !db || !userId) {
            showToast('You must be logged in to update a book.', 'danger', 'Authentication Error');
            return;
        }

        const bookToUpdate = myBooks.find(b => b._id === bookId);
        if (!bookToUpdate) {
            showToast('Book not found for update.', 'danger', 'Error');
            return;
        }

        let updatedValue = value;
        let errors = {};

        if (fieldName === 'currentPage') {
            const numericValue = parseInt(value, 10);
            if (isNaN(numericValue) || numericValue < 0) {
                errors.currentPage = 'Must be a non-negative number.';
            } else if (bookToUpdate.totalPages > 0 && numericValue > bookToUpdate.totalPages) {
                errors.currentPage = `Cannot exceed total pages (${bookToUpdate.totalPages}).`;
            }
            updatedValue = Math.min(Math.max(0, numericValue || 0), bookToUpdate.totalPages || (numericValue || 0));
        } else if (fieldName === 'rating') {
            const numericRating = parseFloat(value);
            if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
                console.error("Invalid rating value:", value);
                return;
            }
            updatedValue = numericRating;
        }

        if (Object.keys(errors).length > 0) {
            showToast(errors.currentPage || 'Invalid input for page number.', 'danger', 'Input Error');
            return;
        }

        try {
            const bookDocRef = doc(db, `artifacts/${currentAppId}/users/${userId}/books`, bookId);
            await updateDoc(bookDocRef, { [fieldName]: updatedValue });

            setMyBooks(prevBooks => prevBooks.map(b =>
                b._id === bookId ? { ...b, [fieldName]: updatedValue } : b
            ));

            if (fieldName === 'currentPage') {
                setCurrentPageInput(prevState => ({ ...prevState, [bookId]: updatedValue }));
            }
            showToast(`Book ${fieldName} updated successfully!`, 'success', 'Success');
        } catch (err) {
            console.error("Error updating book field (Firestore):", err);
            showToast("Failed to update book field.", 'danger', 'Error');
        }
    }, [isAuthenticated, user?.id, db, userId, myBooks, currentAppId, showToast]);


    useEffect(() => {
        localStorage.setItem('readingGoals', JSON.stringify(currentGoals));
    }, [currentGoals]);

    useEffect(() => {
        const initialInputState = {};
        myBooks.forEach(book => {
            initialInputState[book._id] = book.currentPage || '';
        });
        setCurrentPageInput(initialInputState);
    }, [myBooks]);

    useEffect(() => {
        if (!db || !userId) {
            console.log("Firestore: Not ready to fetch books yet (db not set or userId missing).");
            setLoadingMyBooks(false);
            setErrorMyBooks('Authentication required to load your reading list.');
            return;
        }

        setLoadingMyBooks(true);
        setErrorMyBooks('');

        const booksCollectionPath = `artifacts/${currentAppId}/users/${userId}/books`;
        const booksCollectionRef = collection(db, booksCollectionPath);
        const q = query(booksCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const booksData = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            setMyBooks(booksData);
            setLoadingMyBooks(false);
        }, (error) => {
            console.error("Firestore: Error fetching real-time books:", error);
            setErrorMyBooks('Failed to load your reading list from the database.');
            setLoadingMyBooks(false);
        });

        return () => unsubscribe();
    }, [db, userId, currentAppId]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            if (activeTab === 'recommendations' && !hasFetchedRecommendations) {
                fetchRecommendations();
            } else if (activeTab === 'discoverBooks' && !hasFetchedCategorizedRecommendations) {
                fetchCategorizedRecommendations();
            }
        }
    }, [activeTab, authLoading, isAuthenticated, fetchRecommendations, fetchCategorizedRecommendations, hasFetchedRecommendations, hasFetchedCategorizedRecommendations]);

    const computedReadingStatistics = useMemo(() => {
        let totalBooksFinished = 0;
        let totalPagesReadAcrossAllBooks = 0;
        let totalWordsRead = 0;

        const genreCounts = {};
        const authorCounts = {};
        let totalRating = 0;
        let ratedBooksCount = 0;
        const booksByStatus = {
            'Planned': 0,
            'Reading': 0,
            'Finished': 0
        };

        myBooks.forEach(book => {
            if (book.status === 'Finished') {
                totalBooksFinished += 1;
                totalPagesReadAcrossAllBooks += book.totalPages || 0;
                totalWordsRead += (book.totalPages || 0) * 250;
                if (book.rating !== null && book.rating !== undefined && !isNaN(book.rating)) {
                    totalRating += book.rating;
                    ratedBooksCount += 1;
                }
            } else if (book.status === 'Reading') {
                totalPagesReadAcrossAllBooks += book.currentPage || 0;
                totalWordsRead += (book.currentPage || 0) * 250;
            }

            if (book.genre) {
                book.genre.split(',').forEach(g => {
                    const trimmedGenre = g.trim();
                    if (trimmedGenre) {
                        genreCounts[trimmedGenre] = (genreCounts[trimmedGenre] || 0) + 1;
                    }
                });
            }

            if (book.author) {
                book.author.split(',').forEach(a => {
                    const trimmedAuthor = a.trim();
                    if (trimmedAuthor) {
                        authorCounts[trimmedAuthor] = (authorCounts[trimmedAuthor] || 0) + 1;
                    }
                });
            }

            if (booksByStatus[book.status]) {
                booksByStatus[book.status] += 1;
            }
        });

        const mostCommonGenre = Object.entries(genreCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] || 'N/A';
        const mostCommonAuthor = Object.entries(authorCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] || 'N/A';
        const averageRating = ratedBooksCount > 0 ? (totalRating / ratedBooksCount).toFixed(1) : 'N/A';
        const averagePagesPerFinishedBook = totalBooksFinished > 0 ? (totalPagesReadAcrossAllBooks / totalBooksFinished).toFixed(0) : 'N/A';

        return {
            totalBooksInList: myBooks.length,
            totalBooksFinished,
            totalPagesReadAcrossAllBooks,
            totalWordsRead,
            booksCompleted: totalBooksFinished,
            mostCommonGenre,
            mostCommonAuthor,
            averageRating,
            genreCounts,
            authorCounts,
            booksByStatus,
            averagePagesPerFinishedBook
        };
    }, [myBooks]);


    if (authLoading || !db || !userId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                <p className="mt-4 text-center text-lg font-medium">Loading authentication status...</p>
            </div>
        );
    }

    return (
        <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {isAuthenticated ? (
                <>
                    {activeTab === 'home' && (
                        <HomeContent
                            user={user}
                            currentGoals={currentGoals}
                            readingStatistics={computedReadingStatistics}
                            setShowGoalModal={setShowGoalModal}
                        />
                    )}
                    {activeTab === 'readingList' && (
                        <MyReadingList
                            myBooks={myBooks}
                            isAuthenticated={isAuthenticated}
                            userId={userId}
                            loadingMyBooks={loadingMyBooks}
                            errorMyBooks={errorMyBooks}
                            sortCriteria={sortCriteria}
                            setSortCriteria={setSortCriteria}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            filterGenre={filterGenre}
                            setFilterGenre={setFilterGenre}
                            filterAuthor={filterAuthor}
                            setFilterAuthor={setFilterAuthor}
                            minRatingFilter={minRatingFilter}
                            setMinRatingFilter={setMinRatingFilter}
                            hasNotesFilter={hasNotesFilter}
                            setHasNotesFilter={setHasNotesFilter}
                            filterPageCount={filterPageCount}
                            setFilterPageCount={setFilterPageCount}
                            handleShowDetails={handleShowDetails}
                            handleEditClick={handleEditClick}
                            handleConfirmRemove={handleConfirmRemove}
                            handleUpdateBookField={handleUpdateBookField}
                            currentPageInput={currentPageInput}
                            onCurrentPageInputChange={handleCurrentPageInputChange}
                        />
                    )}
                    {activeTab === 'discoverBooks' && (
                        <DiscoverBooks
                            isAuthenticated={isAuthenticated}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            handleExternalSearch={handleExternalSearch}
                            loadingExternalBooks={loadingExternalBooks}
                            errorExternalBooks={errorExternalBooks}
                            categorizedRecommendations={categorizedRecommendations}
                            handleWantToRead={handleWantToRead}
                            handleNotInterested={handleNotInterested}
                            searchExternalBooks={searchExternalBooks}
                            setActiveTab={setActiveTab}
                            handleShowDetails={handleShowDetails}
                            externalBooks={externalBooks}
                            loadingCategorizedRecommendations={loadingCategorizedRecommendations}
                            errorCategorizedRecommendations={errorCategorizedRecommendations}
                        />
                    )}
                    {activeTab === 'recommendations' && (
                        <RecommendedBooks
                            myBooks={myBooks}
                            recommendedBooks={recommendedBooks}
                            selectedRecommendationSeedBook={selectedRecommendationSeedBook}
                            setSelectedRecommendationSeedBook={setSelectedRecommendationSeedBook}
                            loadingRecommendations={loadingRecommendations}
                            errorRecommendations={errorRecommendations}
                            fetchRecommendations={fetchRecommendations}
                            handleAddToList={handleAddToList}
                            handleShowDetails={handleShowDetails}
                            notInterestedBooks={notInterestedBooks}
                        />
                    )}
                    {activeTab === 'readingStatistics' && (
                        <ReadingStatistics
                            stats={computedReadingStatistics}
                            myBooks={myBooks}
                        />
                    )}
                    {activeTab === 'profile' && (
                        <ProfileContent />
                    )}
                </>
            ) : (
                <CustomAlert message="Please log in or register to access the full dashboard features." />
            )}

            <BookDetailsModal
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                selectedBook={selectedBook}
                isAuthenticated={isAuthenticated}
                handleAddToList={handleAddToList}
            />

            <EditBookModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                bookToEdit={bookToEdit}
                editFormData={editFormData}
                editFormErrors={editFormErrors}
                handleEditFormChange={handleEditFormChange}
                handleUpdateBook={handleUpdateBook}
            />

            <ConfirmRemoveModal
                show={!!confirmRemoveBook}
                onHide={() => setConfirmRemoveBook(null)}
                bookToRemove={confirmRemoveBook}
                onConfirmRemove={handleRemoveFromMyList}
            />

            <SetGoalModal
                show={showGoalModal}
                onHide={() => { setShowGoalModal(false); setGoalFormErrors({}); }}
                newGoalType={newGoalType}
                setNewGoalType={setNewGoalType}
                newGoalTarget={newGoalTarget}
                setNewGoalTarget={setNewGoalTarget}
                newGoalPeriod={newGoalPeriod}
                setNewGoalPeriod={setNewGoalPeriod}
                goalFormErrors={goalFormErrors}
                handleSetGoal={handleSetGoal}
            />

            <CustomToast
                show={toast.show}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
                title={toast.title}
                message={toast.message}
                variant={toast.variant}
            />
        </DashboardLayout>
    );
}

export default Dashboard;