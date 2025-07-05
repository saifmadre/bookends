// src/components/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, ListGroup, Modal, ProgressBar, Row, Spinner, Tab, Tabs } from 'react-bootstrap'; // Added Spinner
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
// import UsersPage from './UsersPage.jsx'; // Removed: Import the UsersPage component

// Firebase imports for Firestore and Auth (using npm package imports)
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, query, updateDoc } from 'firebase/firestore';

// StarRatingInput Component: Allows selecting ratings with half-star increments and displays stars.
const StarRatingInput = ({ value, onChange, readOnly = false, size = '1.2em' }) => {
    const [hoverValue, setHoverValue] = useState(0);

    // Array to map through for rendering stars
    const starValues = [1, 2, 3, 4, 5];

    const handleClick = (starNum) => {
        if (readOnly) return;
        const newValue = (value === starNum && starNum % 1 === 0) ? starNum - 0.5 : starNum;
        onChange(newValue);
    };

    const handleMouseMove = (starNum, event) => {
        if (readOnly) return;
        const starElement = event.target.closest('.star-icon');
        if (!starElement) return;

        const rect = starElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;

        if (x < width / 2) {
            setHoverValue(starNum - 0.5);
        } else {
            setHoverValue(starNum);
        }
    };

    const getStarType = (starNum) => {
        const displayValue = hoverValue > 0 ? hoverValue : value;

        if (displayValue >= starNum) {
            return 'full';
        } else if (displayValue >= starNum - 0.5) {
            return 'half';
        }
        return 'empty';
    };

    const getStarIcon = (type) => {
        switch (type) {
            case 'full': return '⭐';
            case 'half': return '★';
            case 'empty': return '☆';
            default: return '☆';
        }
    };

    return (
        <div className="d-inline-flex" onMouseLeave={() => !readOnly && setHoverValue(0)} style={{ fontSize: size }}>
            {starValues.map((starNum) => (
                <span
                    key={starNum}
                    className="star-icon"
                    onClick={() => handleClick(starNum)}
                    onMouseMove={(e) => handleMouseMove(starNum, e)}
                    style={{ cursor: readOnly ? 'default' : 'pointer', color: '#FFD700', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                    {getStarIcon(getStarType(starNum))}
                </span>
            ))}
        </div>
    );
};

// SearchInput Component: A reusable search input component with an optional clear button.
const SearchInput = ({ searchTerm, onSearchTermChange, onSearch, placeholder = "Search...", className = "", showClearButton = true }) => {
    const handleClear = () => {
        onSearchTermChange('');
        if (onSearch) {
            onSearch('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && onSearch) {
            e.preventDefault();
            onSearch(searchTerm);
        }
    };

    return (
        <InputGroup className="mb-3">
            <Form.Control
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className={className}
                aria-label="Search input"
            />
            {showClearButton && searchTerm && (
                <Button variant="outline-secondary" onClick={handleClear} className="custom-button-secondary">
                    Clear
                </Button>
            )}
            {onSearch && (
                <Button variant="primary" onClick={() => onSearch(searchTerm)} className="custom-button-primary ms-2">
                    Search
                </Button>
            )}
        </InputGroup>
    );
};

// ReadingStatistics Component: Displays various reading statistics for the user.
const ReadingStatistics = ({ stats }) => {
    const getTopItems = (counts, num = 3) => {
        return Object.entries(counts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, num);
    };

    const topGenres = getTopItems(stats.genreCounts);
    const topAuthors = getTopItems(stats.authorCounts);

    return (
        <Card className="bg-white my-4 p-4 rounded shadow-md border-0 text-left">
            <Card.Title className="mb-4 text-2xl font-bold text-brown-800">Your Reading Journey at a Glance</Card.Title>
            <Row className="g-4">
                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-light-brown-100">
                        <Card.Body>
                            <Card.Subtitle className="mb-2 text-brown-800">Overall Progress</Card.Subtitle>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Total Books in List: <strong>{stats.totalBooksInList}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Books Finished: <strong>{stats.totalBooksFinished}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Total Pages Read: <strong>{stats.totalPagesReadAcrossAllBooks}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Estimated Words Read: <strong>{(stats.totalWordsRead / 1000).toFixed(1)}k</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Avg. Rating (Finished Books): <strong>{stats.averageRating} ⭐</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Avg. Pages/Finished Book: <strong>{stats.averagePagesPerFinishedBook}</strong>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-light-brown-100">
                        <Card.Body>
                            <Card.Subtitle className="mb-2 text-brown-800">Books by Status</Card.Subtitle>
                            <ListGroup variant="flush">
                                {Object.entries(stats.booksByStatus).map(([status, count]) => {
                                    const percentage = stats.totalBooksInList > 0 ? (count / stats.totalBooksInList) * 100 : 0;
                                    return (
                                        <ListGroup.Item key={status}>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span>{status}: <strong>{count}</strong></span>
                                                <span>{percentage.toFixed(0)}%</span>
                                            </div>
                                            <ProgressBar now={percentage} variant={
                                                status === 'Reading' ? 'primary' :
                                                    status === 'Finished' ? 'success' :
                                                        'info'
                                            } style={{ height: '15px' }} />
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-light-brown-100">
                        <Card.Body>
                            <Card.Subtitle className="mb-2 text-brown-800">Your Top Interests</Card.Subtitle>
                            <ListGroup variant="flush">
                                <ListGroup.Item>
                                    Most Common Genre: <strong>{stats.mostCommonGenre}</strong>
                                </ListGroup.Item>
                                {topGenres.length > 0 && (
                                    <ListGroup.Item>
                                        Top Genres:
                                        <ul className="list-unstyled mb-0 ms-3">
                                            {topGenres.map(([genre, count]) => (
                                                <li key={genre} className="text-sm text-gray-700">{genre} ({count} books)</li>
                                            ))}
                                        </ul>
                                    </ListGroup.Item>
                                )}
                                <ListGroup.Item>
                                    Most Common Author: <strong>{stats.mostCommonAuthor}</strong>
                                </ListGroup.Item>
                                {topAuthors.length > 0 && (
                                    <ListGroup.Item>
                                        Top Authors:
                                        <ul className="list-unstyled mb-0 ms-3">
                                            {topAuthors.map(([author, count]) => (
                                                <li key={author} className="text-sm text-gray-700">{author} ({count} books)</li>
                                            ))}
                                        </ul>
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};


function Dashboard() {
    const { user, isAuthenticated, loading: authLoading, token } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate(); // 'navigate' is used

    // HARDCODED GLOBAL VARIABLES FOR CANVAS ENVIRONMENT
    const __app_id = 'bookends-app';
    const __firebase_config = JSON.parse('{"apiKey":"AIzaSyCHsj6GgNIz123WiXdHoNZn57mqGbCrBCI","authDomain":"bookends-e027a.firebaseapp.com","projectId":"bookends-e027a","storageBucket":"bookends-e027a.appspot.com","messagingSenderId":"693810748587","appId":"1:693810748587:web:c1c6ac0602c9c7e74f2bee","measurementId":"G-EKPDKZZSJL"}');
    const __initial_auth_token = null;

    // Firebase state
    const [db, setDb] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [activeTab, setActiveTab] = useState('readingList');
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
        title: '', author: '', description: '', genre: '', coverImageUrl: '', status: '',
        currentPage: '', totalPages: '',
        notes: '', highlights: '',
        rating: '',
        reviewText: ''
    });

    const [confirmRemoveBook, setConfirmRemoveBook] = useState(null);
    const [currentPageInput, setCurrentPageInput] = useState({});

    const [sortCriteria, setSortCriteria] = useState('addedDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterGenre, setFilterGenre] = useState('All');
    const [filterAuthor, setFilterAuthor] = useState('All'); // 'filterAuthor' is used
    const [minRatingFilter, setMinRatingFilter] = useState('0');
    const [hasNotesFilter, setHasNotesFilter] = useState('All');
    const [filterPageCount, setFilterPageCount] = useState('All');

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [newGoalType, setNewGoalType] = useState('books');
    const [newGoalTarget, setNewGoalTarget] = useState(''); // 'newGoalTarget' is used
    const [newGoalPeriod, setNewGoalPeriod] = useState('yearly');
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

    const [categorizedRecommendations, setCategorizedRecommendations] = useState({});
    const [loadingCategorizedRecommendations, setLoadingCategorizedRecommendations] = useState(false);
    const [errorCategorizedRecommendations, setErrorCategorizedRecommendations] = useState('');

    // New state to track books explicitly marked as "Not Interested" (in-memory for session)
    const [notInterestedBooks, setNotInterestedBooks] = useState(new Set());

    // Firebase Initialization Effect
    useEffect(() => {
        const appId = __app_id;
        const firebaseConfig = __firebase_config;
        const initialAuthToken = __initial_auth_token;

        console.log("Firebase Init: Using firebaseConfig:", firebaseConfig);

        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is missing or empty. Cannot initialize Firestore.");
            setErrorMyBooks('Firebase configuration is missing. Cannot load data.');
            return;
        }

        let appInstance;
        let firestoreDbInstance;
        let authInstance;

        try {
            appInstance = initializeApp(firebaseConfig);
            firestoreDbInstance = getFirestore(appInstance);
            authInstance = getAuth(appInstance);

            setDb(firestoreDbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
                let userIdToSet = null;
                if (firebaseUser) {
                    userIdToSet = firebaseUser.uid;
                    console.log("Firebase Auth: User signed in:", userIdToSet);
                } else {
                    console.log("Firebase Auth: No user signed in, attempting anonymous sign-in.");
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(authInstance, initialAuthToken);
                            userIdToSet = authInstance.currentUser.uid;
                            console.log("Firebase Auth: Signed in with custom token.");
                        } else {
                            await signInAnonymously(authInstance);
                            userIdToSet = authInstance.currentUser.uid;
                            console.log("Firebase Auth: Signed in anonymously.");
                        }
                    } catch (signInError) {
                        console.error("Firebase Auth: Error during sign-in:", signInError);
                        userIdToSet = crypto.randomUUID(); // Fallback to random ID
                    }
                }
                setCurrentUserId(userIdToSet);
                console.log("Firebase Init: db instance available:", !!firestoreDbInstance, "userId available:", !!userIdToSet);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization error:", error);
            setDb(null);
            setCurrentUserId(null);
            setErrorMyBooks('Failed to initialize Firebase. Please check console for details.');
        }
    }, [__app_id, __firebase_config, __initial_auth_token]); // Added dependencies to useEffect

    // Effect to save goals to local storage
    useEffect(() => {
        localStorage.setItem('readingGoals', JSON.stringify(currentGoals));
    }, [currentGoals]);

    // Effect to initialize current page input state
    useEffect(() => {
        const initialInputState = {};
        myBooks.forEach(book => {
            initialInputState[book._id] = book.currentPage || '';
        });
        setCurrentPageInput(initialInputState);
    }, [myBooks]);

    const handleCurrentPageInputChange = (bookId, value) => {
        setCurrentPageInput(prevState => ({
            ...prevState,
            [bookId]: value
        }));
    };

    // Effect to fetch books from Firestore when db and currentUserId are available
    useEffect(() => {
        if (!db || !currentUserId) {
            console.log("Firestore: Not ready to fetch books yet (db not set or userId missing).");
            setLoadingMyBooks(false);
            setErrorMyBooks('Authentication required to load your reading list.');
            return;
        }

        console.log("DEBUG: fetchMyBooks - Value of 'db' before calling collection:", db);
        console.log("DEBUG: fetchMyBooks - Type of 'db' before calling collection:", typeof db);
        console.log("DEBUG: fetchMyBooks - Does 'db' have a 'collection' method?", typeof db.collection === 'function');

        setLoadingMyBooks(true);
        setErrorMyBooks('');

        const appId = __app_id;
        const booksCollectionPath = `artifacts/${appId}/users/${currentUserId}/books`;
        console.log("Firestore: Attempting to fetch from path:", booksCollectionPath, "with userId:", currentUserId);
        const booksCollectionRef = collection(db, booksCollectionPath);
        const q = query(booksCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const booksData = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data()
            }));
            setMyBooks(booksData);
            setLoadingMyBooks(false);
            console.log("Firestore: Books fetched and updated in real-time. Count:", booksData.length);
        }, (error) => {
            console.error("Firestore: Error fetching real-time books:", error);
            setErrorMyBooks('Failed to load your reading list from the database.');
            setLoadingMyBooks(false);
        });

        return () => unsubscribe();
    }, [db, currentUserId, __app_id]);

    const fetchBooksFromGoogleAPI = useCallback(async (query, maxResults = 10, startIndex = 0) => { // 'fetchBooksFromGoogleAPI' is used
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
    }, [showToast]); // Added showToast to dependencies

    const searchExternalBooks = useCallback(async (query) => {
        setLoadingExternalBooks(true);
        setErrorExternalBooks('');
        const books = await fetchBooksFromGoogleAPI(query, 20);
        setExternalBooks(books);
        setLoadingExternalBooks(false);
    }, [fetchBooksFromGoogleAPI]);

    const fetchRecommendations = useCallback(async () => {
        setLoadingRecommendations(true);
        setErrorRecommendations('');

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
                const filteredFetched = fetched.filter(book => !isExcluded(book));
                currentRecs = [...currentRecs, ...filteredFetched.filter(book => !currentRecs.some(r => r.id === book.id))];
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
                const filteredFetched = fetched.filter(book => !isExcluded(book));
                currentRecs = [...currentRecs, ...filteredFetched.filter(book => !currentRecs.some(r => r.id === book.id))];
                startIndex += booksPerFetch;
            }
            currentRecs = currentRecs.slice(0, targetRecs);
        }

        setRecommendedBooks(currentRecs);
        setLoadingRecommendations(false);
    }, [myBooks, selectedRecommendationSeedBook, notInterestedBooks, fetchBooksFromGoogleAPI]); // Added fetchBooksFromGoogleAPI to dependencies

    const fetchCategorizedRecommendations = useCallback(async () => {
        setLoadingCategorizedRecommendations(true);
        setErrorCategorizedRecommendations('');

        const categorizedData = {};
        const genresToDisplay = ["Fantasy", "Science Fiction", "Mystery", "Thriller", "Horror", "Romance", "Historical Fiction", "Biography", "Young Adult", "Fiction", "Nonfiction", "Self-Help", "Business"];

        const isExcluded = (book) => {
            const inMyBooks = myBooks.some(b =>
                b.title.toLowerCase() === book.title.toLowerCase() &&
                b.author?.toLowerCase() === book.author?.toLowerCase()
            );
            const isNotInterested = notInterestedBooks.has(book.id);
            return inMyBooks || isNotInterested;
        };

        // Use Promise.all to fetch categories concurrently
        const fetchPromises = genresToDisplay.map(async (genre) => {
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
        });

        await Promise.all(fetchPromises);

        setCategorizedRecommendations(categorizedData);
        setLoadingCategorizedRecommendations(false);
    }, [myBooks, notInterestedBooks, fetchBooksFromGoogleAPI]); // Added fetchBooksFromGoogleAPI to dependencies


    useEffect(() => {
        if (activeTab === 'recommendations' && !authLoading && isAuthenticated) {
            fetchRecommendations();
        } else if (activeTab === 'discoverBooks' && !authLoading && isAuthenticated) {
            fetchCategorizedRecommendations();
        }
    }, [activeTab, authLoading, isAuthenticated, fetchRecommendations, fetchCategorizedRecommendations]);


    const readingStatistics = useMemo(() => {
        let totalBooksFinished = 0;
        let totalPagesReadAcrossAllBooks = 0;
        let totalWordsRead = 0;
        let timeSpentReading = 0;
        let averageReadingSpeed = 250;

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
                timeSpentReading += (book.totalPages || 0) * 250 / averageReadingSpeed / 60;
                if (book.rating !== null && book.rating !== undefined && !isNaN(book.rating)) {
                    totalRating += book.rating;
                    ratedBooksCount += 1;
                }
            } else if (book.status === 'Reading') {
                totalPagesReadAcrossAllBooks += book.currentPage || 0;
                totalWordsRead += (book.currentPage || 0) * 250;
                timeSpentReading += (book.currentPage || 0) * 250 / averageReadingSpeed / 60;
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
        const averagePagesPerFinishedBook = totalBooksFinished > 0 ? (totalPagesReadAcrossAllBooks / totalBooksFinished).toFixed(0) : 'N/A'; // 'averagePagesPerFinishedBook' is used


        return {
            totalBooksInList: myBooks.length,
            totalBooksFinished,
            totalPagesReadAcrossAllBooks,
            totalWordsRead,
            booksCompleted: totalBooksFinished,
            averageReadingSpeed,
            timeSpentReading,
            mostCommonGenre,
            mostCommonAuthor,
            averageRating,
            genreCounts,
            authorCounts,
            booksByStatus
        };
    }, [myBooks]);


    useEffect(() => {
        currentGoals.forEach(goal => {
            let currentProgressValue = 0; // 'currentProgressValue' is used
            let targetValue = goal.target; // 'targetValue' is used

            if (goal.type === 'books') {
                currentProgressValue = readingStatistics.totalBooksFinished;
            } else if (goal.type === 'pages') {
                currentProgressValue = readingStatistics.totalPagesReadAcrossAllBooks;
            }
        });
    }, [currentGoals, readingStatistics]);


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


    const handleShowDetails = (book) => {
        setSelectedBook(book);
        setShowDetailsModal(true);
    };

    const handleEditClick = (book) => {
        setBookToEdit(book);
        setEditFormData({
            title: book.title || '', // Initialize with existing book data
            author: book.author || '',
            description: book.description || '',
            genre: book.genre || '',
            coverImageUrl: book.coverImageUrl || '',
            status: book.status || '',
            currentPage: book.currentPage || '',
            totalPages: book.totalPages || '',
            notes: book.notes || '',
            highlights: book.highlights || '',
            rating: book.rating !== null && book.rating !== undefined ? book.rating : '', // Handle null rating
            reviewText: book.reviewText || ''
        });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleRatingChange = (newRating) => {
        setEditFormData(prevData => ({
            ...prevData,
            rating: newRating
        }));
    };

    const handleUpdateBook = async (e) => {
        e.preventDefault();
        if (!isAuthenticated || !user?.id || !db || !currentUserId) {
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

            const appId = __app_id;
            const bookDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/books`, bookToEdit._id);
            await updateDoc(bookDocRef, updatedBookData);

            showToast(`"${editFormData.title}" updated successfully!`, 'success', 'Success');
            setShowEditModal(false);
        } catch (err) {
            console.error("Error updating book (Firestore):", err);
            showToast("Failed to update book.", 'danger', 'Error');
        }
    };

    const handleAddToList = async (bookToAdd) => {
        if (!isAuthenticated || !user?.id || !db || !currentUserId) {
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
                user: currentUserId,
                currentPage: 0,
                totalPages: bookToAdd.pageCount || 0,
                notes: '',
                highlights: '',
                rating: null,
                reviewText: '',
                addedDate: new Date().toISOString()
            };

            console.log("DEBUG: handleAddToList - Value of 'db' before calling collection:", db);
            console.log("DEBUG: handleAddToList - Type of 'db' before calling collection:", typeof db);
            console.log("DEBUG: handleAddToList - Does 'db' have a 'collection' method?", typeof db.collection === 'function');

            const appId = __app_id;
            await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/books`), newBookData);

            showToast(`"${bookToAdd.title}" added to your reading list!`, 'success', 'Success');
            setShowDetailsModal(false);
            fetchRecommendations();
            fetchCategorizedRecommendations();
        } catch (err) {
            console.error("Error adding book to list (Firestore):", err);
            showToast("Failed to add book to list.", 'danger', 'Error');
        }
    };

    const handleWantToRead = async (book) => {
        if (!isAuthenticated || !user?.id || !db || !currentUserId) {
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
                user: currentUserId,
                currentPage: 0,
                totalPages: book.pageCount || 0,
                notes: '',
                highlights: '',
                rating: null,
                reviewText: '',
                addedDate: new Date().toISOString()
            };

            console.log("DEBUG: handleWantToRead - Value of 'db' before calling collection:", db);
            console.log("DEBUG: handleWantToRead - Type of 'db' before calling collection:", typeof db);
            console.log("DEBUG: handleWantToRead - Does 'db' have a 'collection' method?", typeof db.collection === 'function');

            const appId = __app_id;
            await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/books`), newBookData);
            showToast(`"${book.title}" added to your "Want to Read" list!`, 'success', 'Success');
            fetchCategorizedRecommendations();
        } catch (err) {
            console.error("Error adding book to 'Want to Read' (Firestore):", err);
            showToast("Failed to add book to 'Want to Read'.", 'danger', 'Error');
        }
    };

    const handleNotInterested = async (book) => {
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
    };


    const handleConfirmRemove = (book) => {
        setConfirmRemoveBook(book);
    };

    const handleRemoveFromMyList = async () => {
        if (!confirmRemoveBook) return;
        if (!isAuthenticated || !user?.id || !db || !currentUserId) {
            showToast('You must be logged in to remove a book.', 'danger', 'Authentication Error');
            setConfirmRemoveBook(null);
            return;
        }

        try {
            const appId = __app_id;
            const bookDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/books`, confirmRemoveBook._id);
            await deleteDoc(bookDocRef);
            showToast(`"${confirmRemoveBook.title}" removed from your reading list.`, 'success', 'Success');
        } catch (err) {
            console.error("Error removing book (Firestore):", err);
            showToast("Failed to remove book.", 'danger', 'Error');
        } finally {
            setConfirmRemoveBook(null);
        }
    };

    const handleUpdateBookField = async (bookId, fieldName, value) => {
        if (!isAuthenticated || !user?.id || !db || !currentUserId) {
            showToast('You must be logged in to update a book.', 'danger', 'Authentication Error');
            return;
        }

        const bookToUpdate = myBooks.find(b => b._id === bookId);
        if (!bookToUpdate) {
            showToast('Book not found for update.', 'danger', 'Error');
            return;
        }

        let updatedValue = value;
        if (fieldName === 'currentPage') {
            const numericValue = Math.max(0, parseInt(value, 10) || 0);
            updatedValue = Math.min(numericValue, bookToUpdate.totalPages || numericValue);
        } else if (fieldName === 'rating') {
            updatedValue = parseFloat(value);
        }

        try {
            const appId = __app_id;
            const bookDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/books`, bookId);
            await updateDoc(bookDocRef, { [fieldName]: updatedValue });

            if (fieldName === 'currentPage') {
                setCurrentPageInput(prevState => ({ ...prevState, [bookId]: updatedValue }));
            }
            showToast(`Book ${fieldName} updated successfully!`, 'success', 'Success');
        } catch (err) {
            console.error("Error updating book field (Firestore):", err);
            showToast("Failed to update book field.", 'danger', 'Error');
        }
    };

    const handleSetGoal = (e) => {
        e.preventDefault();
        if (!newGoalTarget || isNaN(newGoalTarget) || parseInt(newGoalTarget) <= 0) {
            showToast('Please enter a valid positive number for the goal target.', 'danger', 'Validation Error');
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
    };

    const renderStarRating = (rating) => {
        if (rating === null || rating === undefined || isNaN(rating)) return null;
        const roundedRating = Math.round(rating * 2) / 2;
        const fullStars = Math.floor(roundedRating);
        const hasHalfStar = (roundedRating % 1) !== 0;

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        const stars = [];
        for (let i = 0; i < fullStars; i++) stars.push('⭐');
        if (hasHalfStar) stars.push('★');
        for (let i = 0; i < emptyStars; i++) stars.push('☆');

        return (
            <span className="star-display" style={{ color: '#FFD700', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                {stars.join('')} ({rating}/5)
            </span>
        );
    };


    const MyReadingList = () => {
        const uniqueGenres = useMemo(() => {
            const genres = new Set();
            myBooks.forEach(book => {
                if (book.genre) {
                    book.genre.split(',').forEach(g => genres.add(g.trim()));
                }
            });
            return ['All', ...Array.from(genres).sort()];
        }, [myBooks]);

        const uniqueAuthors = useMemo(() => {
            const authors = new Set();
            myBooks.forEach(book => {
                if (book.author) {
                    book.author.split(',').forEach(a => authors.add(a.trim()));
                }
            });
            return ['All', ...Array.from(authors).sort()];
        }, [myBooks]);


        let filteredBooks = (isAuthenticated && currentUserId)
            ? myBooks.filter(book => book.user === currentUserId)
            : [];

        if (filterStatus !== 'All') {
            filteredBooks = filteredBooks.filter(book => book.status === filterStatus);
        }
        if (filterGenre !== 'All') {
            filteredBooks = filteredBooks.filter(book =>
                book.genre && book.genre.split(',').map(g => g.trim()).includes(filterGenre)
            );
        }
        if (filterAuthor !== 'All') {
            filteredBooks = filteredBooks.filter(book =>
                book.author && book.author.split(',').map(a => a.trim()).includes(filterAuthor)
            );
        }
        if (minRatingFilter !== '0') {
            const minRating = parseFloat(minRatingFilter);
            filteredBooks = filteredBooks.filter(book => (book.rating || 0) >= minRating);
        }
        if (hasNotesFilter !== 'All') {
            filteredBooks = filteredBooks.filter(book => {
                const hasNotes = (book.notes && book.notes.trim() !== '') || (book.highlights && book.highlights.trim() !== '');
                return hasNotesFilter === 'Yes' ? hasNotes : !hasNotes;
            });
        }
        if (filterPageCount !== 'All') {
            filteredBooks = filteredBooks.filter(book => {
                const totalPages = book.totalPages || 0;
                switch (filterPageCount) {
                    case 'short': return totalPages > 0 && totalPages <= 150;
                    case 'medium': return totalPages > 150 && totalPages <= 400;
                    case 'long': return totalPages > 400;
                    default: return true;
                }
            });
        }


        const sortedAndFilteredBooks = [...filteredBooks].sort((a, b) => {
            let comparison = 0;
            if (sortCriteria === 'title') {
                comparison = a.title.localeCompare(b.title);
            } else if (sortCriteria === 'author') {
                comparison = a.author.localeCompare(b.author);
            } else if (sortCriteria === 'addedDate') {
                comparison = new Date(a.addedDate) - new Date(b.addedDate);
            } else if (sortCriteria === 'completion') {
                const percentA = a.totalPages > 0 ? (a.currentPage / a.totalPages) : 0;
                const percentB = b.totalPages > 0 ? (b.currentPage / b.totalPages) : 0;
                comparison = percentA - percentB;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });


        return (
            <div className="mt-4 text-left">
                <h4 className="book-form-label mb-4 text-2xl font-semibold text-brown-800">Your Current Reads:</h4>

                <Row className="mb-4 align-items-end g-3">
                    <Col xs={12} sm={6} md={4}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Sort By:</Form.Label>
                            <Form.Control as="select" value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)} className="form-select custom-select">
                                <option value="addedDate">Date Added</option>
                                <option value="title">Title</option>
                                <option value="author">Author</option>
                                <option value="completion">Completion %</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={2}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Order:</Form.Label>
                            <Form.Control as="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="form-select custom-select">
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Filter Status:</Form.Label>
                            <Form.Control as="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-select custom-select">
                                <option value="All">All</option>
                                <option value="Reading">Reading</option>
                                <option value="Finished">Finished</option>
                                <option value="Planned">Planned</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Filter Genre:</Form.Label>
                            <Form.Control as="select" value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="form-select custom-select">
                                {uniqueGenres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Min. Rating:</Form.Label>
                            <Form.Control as="select" value={minRatingFilter} onChange={(e) => setMinRatingFilter(e.target.value)} className="form-select custom-select">
                                <option value="0">Any</option>
                                <option value="1">1⭐ & Up</option>
                                <option value="2">2⭐ & Up</option>
                                <option value="3">3⭐ & Up</option>
                                <option value="4">4⭐ & Up</option>
                                <option value="4.5">4.5⭐ & Up</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Notes/Highlights:</Form.Label>
                            <Form.Control as="select" value={hasNotesFilter} onChange={(e) => setHasNotesFilter(e.target.value)} className="form-select custom-select">
                                <option value="All">All</option>
                                <option value="Yes">With Notes/Highlights</option>
                                <option value="No">Without Notes/Highlights</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Page Length:</Form.Label>
                            <Form.Control as="select" value={filterPageCount} onChange={(e) => setFilterPageCount(e.target.value)} className="form-select custom-select">
                                <option value="All">All</option>
                                <option value="short">Short (≤ 150 pages)</option>
                                <option value="medium">Medium (151 - 400 pages)</option>
                                <option value="long">Long (≥ 401 pages)</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>


                {loadingMyBooks ? (
                    <div className="mt-4 text-center p-4">
                        <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                            <span className="visually-hidden">Loading reading list...</span>
                        </Spinner>
                        <p className="text-gray-700 mt-3">Loading your reading list...</p>
                    </div>
                ) : errorMyBooks ? (
                    <Alert variant="danger" className="mt-4 text-center">{errorMyBooks}</Alert>
                ) : sortedAndFilteredBooks.length === 0 ? (
                    <div className="mt-4 text-center p-4 bg-light-brown-100 rounded border border-light-brown">
                        <p className="text-gray-700">No books found matching your current filters and sort criteria. Try adjusting them!</p>
                        <p className="text-muted text-sm mt-2">Start by adding books from "Discover Books" or by setting a new reading goal!</p>
                    </div>
                ) : (
                    <div className="book-list-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedAndFilteredBooks.map(book => {
                            const completionPercentage = book.totalPages > 0
                                ? Math.min(100, Math.max(0, (book.currentPage / book.totalPages) * 100)).toFixed(0)
                                : 0;

                            return (
                                <Card key={book._id} className="book-card p-3 shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
                                    <div className="d-flex align-items-center mb-3">
                                        <img src={book.coverImageUrl || 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover'} alt={`${book.title} cover`} className="book-cover me-3 rounded shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover' }} style={{ width: '80px', height: '120px', objectFit: 'cover' }} />
                                        <div className="flex-grow-1">
                                            <Card.Title className="text-md font-semibold text-brown-800 mb-1">{book.title}</Card.Title>
                                            <Card.Subtitle className="text-sm text-gray-600 mb-2">{book.author}</Card.Subtitle>
                                            <span className={`badge ${book.status === 'Reading' ? 'bg-primary' : book.status === 'Finished' ? 'bg-success' : 'bg-info'} text-white`}>{book.status}</span>
                                        </div>
                                    </div>
                                    {book.totalPages > 0 && (
                                        <div className="mt-2 mb-2">
                                            <div className="text-sm text-gray-600 mb-1 d-flex align-items-center">
                                                <Form.Label className="me-2 mb-0">Page:</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={currentPageInput[book._id] !== undefined ? currentPageInput[book._id] : (book.currentPage || '')}
                                                    onChange={(e) => handleCurrentPageInputChange(book._id, e.target.value)}
                                                    onBlur={(e) => handleUpdateBookField(book._id, 'currentPage', e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleUpdateBookField(book._id, 'currentPage', e.target.value);
                                                            e.target.blur();
                                                        }
                                                    }}
                                                    min="0"
                                                    max={book.totalPages}
                                                    className="form-control-sm text-center"
                                                    style={{ maxWidth: '70px', borderColor: '#d4c7b8' }}
                                                />
                                                <span className="ms-1 me-1">/</span> {book.totalPages}
                                            </div>
                                            <ProgressBar
                                                now={completionPercentage}
                                                label={`${completionPercentage}%`}
                                                className="mt-1"
                                                variant="primary"
                                                style={{ height: '18px', backgroundColor: '#e0d9c8' }}
                                            />
                                        </div>
                                    )}
                                    {book.status === 'Finished' && (
                                        <div className="mt-2 mb-2 d-flex align-items-center">
                                            <Form.Label className="me-2 mb-0 text-sm text-gray-600">Your Rating:</Form.Label>
                                            <StarRatingInput
                                                value={book.rating}
                                                onChange={(newRating) => handleUpdateBookField(book._id, 'rating', newRating)}
                                                size="1.1em"
                                            />
                                            {book.rating !== null && book.rating !== undefined && (
                                                <span className="text-sm text-gray-500 ms-1">({book.rating}/5)</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between mt-auto pt-2 border-top border-light-brown-100">
                                        <Button size="sm" variant="outline-primary" onClick={() => handleShowDetails(book)} className="flex-fill me-1 custom-button-sm">View</Button>
                                        <Button size="sm" variant="outline-success" onClick={() => handleEditClick(book)} className="flex-fill me-1 custom-button-sm">Edit</Button>
                                        <Button size="sm" variant="outline-danger" onClick={() => handleConfirmRemove(book)} className="flex-fill custom-button-sm">Remove</Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const DiscoverBooks = () => {
        const isSearchButtonDisabled = searchTerm.trim().length < 3;

        if (!isAuthenticated) {
            return (
                <div className="mt-4 text-center p-4">
                    <Alert variant="info" className="text-lg bg-blue-100 border-blue-200 text-blue-800">Please log in to discover new books.</Alert>
                </div>
            );
        }

        console.log('DiscoverBooks: handleExternalSearch is defined:', typeof handleExternalSearch === 'function');

        return (
            <div className="mt-4 text-left">
                <h4 className="book-form-label mb-4 text-2xl font-semibold text-brown-800">Explore New Worlds:</h4>

                <Form onSubmit={handleExternalSearch} className="mb-4">
                    <div className="mb-3">
                        <SearchInput
                            searchTerm={searchTerm}
                            onSearchTermChange={setSearchTerm}
                            onSearch={handleExternalSearch}
                            placeholder="Search for books (e.g., author, title, genre)..."
                            className="form-control custom-input"
                        />
                    </div>
                    <Button type="submit" className="custom-button-primary" disabled={isSearchButtonDisabled}>Search</Button>
                </Form>

                {/* Display search results if available and a search term was entered */}
                {loadingExternalBooks ? (
                    <div className="mt-4 text-center p-4">
                        <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                            <span className="visually-hidden">Searching for books...</span>
                        </Spinner>
                        <p className="text-gray-700 mt-3">Searching the literary universe...</p>
                    </div>
                ) : errorExternalBooks ? (
                    <Alert variant="danger" className="mt-4 text-center">{errorExternalBooks}</Alert>
                ) : externalBooks.length === 0 && searchTerm.length >= 3 ? (
                    <div className="mt-4 text-center p-4 bg-light-brown-100 rounded border border-light-brown">
                        <p className="text-gray-700">No books found for "{searchTerm}". Try a different search term!</p>
                    </div>
                ) : externalBooks.length > 0 && searchTerm.length >= 3 ? (
                    <>
                        <h5 className="text-xl font-semibold text-brown-800 mb-3 mt-5">Search Results for "{searchTerm}"</h5>
                        <div className="book-list-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {externalBooks.map(book => (
                                <Card key={book.id} className="book-card p-3 shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
                                    <div className="d-flex align-items-center mb-3">
                                        <img src={book.coverImageUrl || 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover'} alt={`${book.title} cover`} className="book-cover me-3 rounded shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover' }} style={{ width: '80px', height: '120px', objectFit: 'cover' }} />
                                        <div className="flex-grow-1">
                                            <Card.Title className="text-md font-semibold text-brown-800 mb-1">{book.title}</Card.Title>
                                            <Card.Subtitle className="text-sm text-gray-600 mb-2">{book.author}</Card.Subtitle>
                                            {book.averageRating > 0 && (
                                                <Card.Text className="text-sm text-gray-700 mb-1">
                                                    Rating: {book.averageRating} <span style={{ color: '#FFD700' }}>⭐</span>
                                                </Card.Text>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column mt-auto pt-2 border-top border-light-brown-100">
                                        <Button size="sm" variant="outline-primary" onClick={() => handleShowDetails(book)} className="mb-2 custom-button-sm flex-fill">Details</Button>
                                        <Button size="sm" variant="outline-success" onClick={() => handleAddToList(book)} className="custom-button-sm flex-fill">Add to My List</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : null}


                <h4 className="book-form-label mt-5 mb-4 text-2xl font-semibold text-brown-800">
                    Recommendations Based on Your Interests:
                </h4>

                {loadingCategorizedRecommendations ? (
                    <div className="mt-4 text-center p-4">
                        <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                            <span className="visually-hidden">Loading categorized recommendations...</span>
                        </Spinner>
                        <p className="text-gray-700 mt-3">Fetching personalized recommendations...</p>
                    </div>
                ) : errorCategorizedRecommendations ? (
                    <Alert variant="danger" className="mt-4 text-center">{errorCategorizedRecommendations}</Alert>
                ) : Object.keys(categorizedRecommendations).length === 0 ? (
                    <div className="mt-4 text-center p-4 bg-light-brown-100 rounded border border-light-brown">
                        <p className="text-gray-700">No categorized recommendations found at the moment. Add more books to your list and explore to get personalized suggestions!</p>
                    </div>
                ) : (
                    Object.entries(categorizedRecommendations).map(([category, books]) => (
                        <div key={category} className="mb-5">
                            <h5 className="text-xl font-semibold text-brown-800 mb-3">Explore {category}</h5>
                            <div className="book-list-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {books.map(book => (
                                    <Card key={book.id} className="book-card p-3 shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
                                        <div className="d-flex align-items-center mb-3">
                                            <img src={book.coverImageUrl || 'https://placehold.co/100x100/FDF8ED/5A4434?text=No+Cover'} alt={`${book.title} cover`} className="book-cover me-3 rounded shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/FDF8ED/5A4434?text=No+Cover' }} style={{ width: '80px', height: '120px', objectFit: 'cover' }} />
                                            <div className="flex-grow-1">
                                                <Card.Title className="text-md font-semibold text-brown-800 mb-1">{book.title}</Card.Title>
                                                <Card.Subtitle className="text-sm text-gray-600 mb-2">{book.author}</Card.Subtitle>
                                                {book.averageRating > 0 && (
                                                    <Card.Text className="text-sm text-gray-700 mb-1">
                                                        Rating: {book.averageRating} <span style={{ color: '#FFD700' }}>⭐</span>
                                                    </Card.Text>
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex flex-column mt-auto pt-2 border-top border-light-brown-100">
                                            <Button size="sm" variant="outline-success" onClick={() => handleWantToRead(book)} className="mb-2 custom-button-sm flex-fill">Want to Read</Button>
                                            <Button size="sm" variant="outline-secondary" onClick={() => handleNotInterested(book)} className="custom-button-sm flex-fill">Not Interested</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            <div className="text-right mt-3">
                                <Button variant="link" className="text-brown-800 font-semibold text-sm" onClick={() => {
                                    setSearchTerm(category);
                                    searchExternalBooks(category);
                                }}>
                                    More {category} books »
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div >
        );
    };

    const RecommendedBooks = () => {
        const [recSortCriteria, setRecSortCriteria] = useState('similarityScore');
        const [recSortOrder, setRecSortOrder] = useState('desc');
        const [recFilterGenre, setRecFilterGenre] = useState('All');
        const [minRatingFilter, setMinRatingFilter] = useState('0'); // 'minRatingFilter' is used

        const uniqueRecGenres = useMemo(() => {
            const genres = new Set();
            recommendedBooks.forEach(book => {
                if (book.genre) {
                    book.genre.split(',').forEach(g => genres.add(g.trim()));
                }
            });
            return ['All', ...Array.from(genres).sort()];
        }, [recommendedBooks]);


        const filteredAndSortedRecommendations = useMemo(() => {
            let currentRecs = recommendedBooks;

            if (selectedRecommendationSeedBook) {
                currentRecs = currentRecs.filter(recBook =>
                    !(recBook.title.toLowerCase() === selectedRecommendationSeedBook.title.toLowerCase() &&
                        recBook.author?.toLowerCase() === selectedRecommendationSeedBook.author?.toLowerCase())
                );
            }

            if (recFilterGenre !== 'All') {
                currentRecs = currentRecs.filter(book =>
                    book.genre && book.genre.split(',').map(g => g.trim()).includes(recFilterGenre)
                );
            }

            const minRating = parseFloat(minRatingFilter);
            if (!isNaN(minRating) && minRating > 0) {
                currentRecs = currentRecs.filter(book => (book.averageRating || 0) >= minRating);
            }

            return [...currentRecs].sort((a, b) => {
                let comparison = 0;
                if (recSortCriteria === 'similarityScore') {
                    comparison = (a.similarityScore || 0) - (b.similarityScore || 0);
                } else if (recSortCriteria === 'title') {
                    comparison = a.title.localeCompare(b.title);
                } else if (recSortCriteria === 'author') {
                    comparison = a.author.localeCompare(b.author);
                } else if (recSortCriteria === 'averageRating') {
                    comparison = (a.averageRating || 0) - (b.averageRating || 0);
                }
                return recSortOrder === 'asc' ? comparison : -comparison;
            });
        }, [selectedRecommendationSeedBook, recommendedBooks, recSortCriteria, recSortOrder, recFilterGenre, minRatingFilter]);


        const getRecommendationReason = useCallback((recBook) => {
            if (!selectedRecommendationSeedBook) return null;

            const reasons = [];

            const genresA = selectedRecommendationSeedBook.genre ? selectedRecommendationSeedBook.genre.split(',').map(g => g.trim().toLowerCase()) : [];
            const authorsA = selectedRecommendationSeedBook.author ? selectedRecommendationSeedBook.author.split(',').map(a => a.trim().toLowerCase()) : [];
            const descriptionA = (selectedRecommendationSeedBook.description || '').toLowerCase();
            const ratingA = selectedRecommendationSeedBook.averageRating || selectedRecommendationSeedBook.rating || 0;
            const pageCountA = selectedRecommendationSeedBook.pageCount || selectedRecommendationSeedBook.totalPages || 0;

            const genresB = recBook.genre ? recBook.genre.split(',').map(g => g.trim().toLowerCase()) : [];
            const authorsB = recBook.author ? recBook.author.split(',').map(a => a.trim().toLowerCase()) : [];
            const descriptionB = (recBook.description || '').toLowerCase();
            const ratingB = recBook.averageRating || recBook.rating || 0;
            const pageCountB = recBook.pageCount || recBook.totalPages || 0;

            const commonGenres = genresA.filter(gA => genresB.includes(gA));
            if (commonGenres.length > 0) {
                reasons.push(`Genre: ${commonGenres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}`);
            }

            const commonAuthors = authorsA.filter(aA => authorsB.includes(aA));
            if (commonAuthors.length > 0) {
                reasons.push(`Author: ${commonAuthors.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}`);
            }

            const stop_words = new Set(["a", "an", "the", "and", "or", "but", "is", "are", "on", "in", "for", "with", "of", "to", "from", "about"]);
            const descriptionKeywordsA = new Set(descriptionA.split(/\W+/).filter(word => word.length > 3 && !stop_words.has(word)));
            const descriptionKeywordsB = new Set(descriptionB.split(/\W+/).filter(word => word.length > 3 && !stop_words.has(word)));
            const commonKeywords = Array.from(descriptionKeywordsA).filter(keywordA => descriptionKeywordsB.has(keywordA));
            if (commonKeywords.length > 0) {
                reasons.push(`Keywords: ${commonKeywords.slice(0, 3).join(', ')}${commonKeywords.length > 3 ? '...' : ''}`);
            }

            if (ratingA > 0 && ratingB > 0) {
                const ratingDiff = Math.abs(ratingA - ratingB);
                if (ratingDiff <= 0.5) reasons.push(`Similar rating (${ratingA.toFixed(1)} vs ${ratingB.toFixed(1)})`);
            }

            if (pageCountA > 0 && pageCountB > 0) {
                const pageRatio = Math.min(pageCountA, pageCountB) / Math.max(pageCountA, pageCountB);
                if (pageRatio >= 0.8) reasons.push(`Similar length (${pageCountA} vs ${pageCountB} pages)`);
            }

            if (reasons.length === 0) {
                return recBook.similarityScore !== undefined && recBook.similarityScore !== null
                    ? `(Score: ${recBook.similarityScore.toFixed(0)})`
                    : 'No specific reasons identified.';
            }
            return `${reasons.join('; ')}`;
        }, [selectedRecommendationSeedBook]);

        const truncateDescription = (description, wordLimit) => {
            if (!description) return 'No description available.';
            const words = description.split(' ');
            if (words.length > wordLimit) {
                return words.slice(0, wordLimit).join(' ') + '...';
            }
            return description;
        };


        return (
            <div className="mt-4 text-left">
                <h4 className="book-form-label mb-4 text-2xl font-semibold text-brown-800">
                    {selectedRecommendationSeedBook ?
                        `If you like "${selectedRecommendationSeedBook.title}", you might enjoy:` :
                        'Books You Might Like:'}
                </h4>

                <Form.Group className="mb-4 p-3 rounded border border-light-brown-100 bg-light-brown-50">
                    <Form.Label className="text-gray-800 font-semibold mb-2">Get recommendations based on:</Form.Label>
                    <Form.Control
                        as="select"
                        value={selectedRecommendationSeedBook ? selectedRecommendationSeedBook._id : ''}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            const book = myBooks.find(b => b._id === selectedId);
                            setSelectedRecommendationSeedBook(book);
                        }}
                        className="form-select custom-select"
                    >
                        <option value="">-- Select a book from your list --</option>
                        {myBooks.map(book => (
                            <option key={book._id} value={book._id}>{book.title} by {book.author}</option>
                        ))}
                    </Form.Control>
                    {myBooks.length === 0 && (
                        <p className="text-muted mt-2 text-sm">Add books to your "My Reading List" to enable personalized recommendations!</p>
                    )}
                </Form.Group>

                <Row className="mb-4 align-items-end g-3">
                    <Col md={4} sm={6} xs={12}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Sort By:</Form.Label>
                            <Form.Control as="select" value={recSortCriteria} onChange={(e) => setRecSortCriteria(e.target.value)} className="form-select custom-select">
                                <option value="similarityScore">✨ Similarity Score</option>
                                <option value="averageRating">⭐ Rating</option>
                                <option value="title">📖 Title</option>
                                <option value="author">✍️ Author</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={2} sm={6} xs={12}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Order:</Form.Label>
                            <Form.Control as="select" value={recSortOrder} onChange={(e) => setRecSortOrder(e.target.value)} className="form-select custom-select">
                                <option value="desc">⬇️ Descending</option>
                                <option value="asc">⬆️ Ascending</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={3} sm={6} xs={12}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Filter Genre:</Form.Label>
                            <Form.Control as="select" value={recFilterGenre} onChange={(e) => setRecFilterGenre(e.target.value)} className="form-select custom-select">
                                {uniqueRecGenres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={3} sm={6} xs={12}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Min. Rating:</Form.Label>
                            <Form.Control as="select" value={minRatingFilter} onChange={(e) => setMinRatingFilter(e.target.value)} className="form-select custom-select">
                                <option value="0">Any</option>
                                <option value="1">1⭐ & Up</option>
                                <option value="2">2⭐ & Up</option>
                                <option value="3">3⭐ & Up</option>
                                <option value="4">4⭐ & Up</option>
                                <option value="4.5">4.5⭐ & Up</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={3} sm={6} xs={12} className="d-flex align-items-end">
                        <Button variant="outline-primary" className="custom-button-primary-outline w-100 py-2" onClick={fetchRecommendations}>
                            <i className="fas fa-sync-alt me-2"></i> Refresh
                        </Button>
                    </Col>
                </Row>

                {loadingRecommendations ? (
                    <div className="mt-4 text-center p-4">
                        <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                            <span className="visually-hidden">Generating recommendations...</span>
                        </Spinner>
                        <p className="text-gray-700 mt-3">Summoning literary treasures just for you...</p>
                    </div>
                ) : errorRecommendations ? (
                    <Alert variant="danger" className="mt-4 text-center">{errorRecommendations}</Alert>
                ) : filteredAndSortedRecommendations.length === 0 ? (
                    <div className="mt-4 text-center p-4 bg-light-brown-100 rounded border border-light-brown">
                        <p className="text-gray-700">
                            {selectedRecommendationSeedBook ?
                                `No similar recommendations found for "${selectedRecommendationSeedBook.title}". Try another book, adjust filters, or add more variety to your reading list!` :
                                'No recommendations found at the moment. Add books to your list, explore, and refresh to see personalized suggestions!'}
                        </p>
                    </div>
                ) : (
                    <div className="book-list-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAndSortedRecommendations.map(book => (
                            <Card key={book.id} className="book-card p-3 shadow-sm rounded-lg h-100 d-flex flex-column hover:shadow-md transition-shadow duration-200">
                                <div className="d-flex align-items-start mb-3">
                                    <img src={book.coverImageUrl || 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover'} alt={`${book.title} cover`} className="book-cover me-3 rounded shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover' }} style={{ width: '80px', height: '120px', objectFit: 'cover' }} />
                                    <div className="flex-grow-1">
                                        <Card.Title className="text-md font-semibold text-brown-800 mb-1">{book.title}</Card.Title>
                                        <Card.Subtitle className="text-sm text-gray-600 mb-2">{book.author}</Card.Subtitle>
                                        <Card.Text className="text-sm text-gray-500 mb-1">
                                            Genre: {book.genre || 'N/A'}
                                        </Card.Text>
                                        {book.averageRating > 0 && (
                                            <Card.Text className="text-sm text-gray-700 mb-1">
                                                Rating: {book.averageRating} <span style={{ color: '#FFD700' }}>⭐</span>
                                            </Card.Text>
                                        )}
                                    </div>
                                </div>
                                <Card.Text className="text-sm text-gray-600 mb-3 flex-grow-1">
                                    {truncateDescription(book.description, 25)}
                                </Card.Text>
                                {selectedRecommendationSeedBook && (
                                    <Card.Text className="text-xs text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                                        <span className="font-weight-bold text-brown-700">Why this recommendation?</span><br />
                                        {getRecommendationReason(book)}
                                    </Card.Text>
                                )}
                                <div className="d-flex justify-content-between mt-auto pt-2 border-top border-light-brown-100">
                                    <Button size="sm" variant="outline-primary" onClick={() => handleShowDetails(book)} className="flex-fill me-1 custom-button-sm">Details</Button>
                                    <Button size="sm" variant="outline-success" onClick={() => handleAddToList(book)} className="flex-fill custom-button-sm">Add to My List</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div >
        );
    };


    if (authLoading || !db || !currentUserId) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-100 bg-light-brown-100">
                <Spinner animation="border" role="status" style={{ color: '#5a4434' }}>
                    <span className="visually-hidden">Loading application...</span>
                </Spinner>
                <p className="text-gray-700 ms-3">Initializing application and verifying authentication...</p>
            </Container>
        );
    }

    return (
        <Container className="my-5 p-4 rounded-xl shadow-lg bg-light-brown-100 text-center">
            <h2 className="mb-5 text-4xl font-extrabold text-brown-900">
                Welcome to Your Dashboard!
            </h2>

            {isAuthenticated && user ? (
                <Card className="text-left mt-4 p-4 rounded shadow-md border-0 bg-white">
                    <Card.Body>
                        <Card.Title className="mb-4 text-2xl font-bold text-brown-800">Your Account Overview</Card.Title>
                        <div className="d-flex flex-wrap text-gray-700">
                            <p className="mb-1 me-4">
                                <strong className="text-gray-800">Username:</strong> <span className="text-lg text-brown-900 font-semibold">{user.username || 'N/A'}</span>
                            </p>
                            <p className="mb-1 me-4">
                                <strong className="text-gray-800">Email:</strong> <span className="text-lg text-brown-900 font-semibold">{user.email || 'N/A'}</span>
                            </p>
                            <p className="mb-1 me-4">
                                <strong className="text-gray-800">User ID:</strong> {user.id || 'N/A'}
                            </p>
                            <p className="mb-1 me-4">
                                <strong className="text-gray-800">Role:</strong> {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                            </p>
                            {user.date && (
                                <p className="mb-1 me-4">
                                    <strong className="text-gray-800">Registration Date:</strong> {new Date(user.date).toLocaleDateString() || 'N/A'}
                                </p>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <Alert variant="info" className="mt-4 text-lg text-center bg-blue-100 border-blue-200 text-blue-800">Please log in to view your account overview.</Alert>
            )}

            {isAuthenticated && (
                <p className="text-gray-700 mt-5 text-lg">
                    This is a protected area. You are logged in! Explore your Bookends journey.
                </p>
            )}

            {isAuthenticated ? (
                <>
                    <div className="mt-5 mb-4">
                        <Tabs
                            activeKey={activeTab}
                            onSelect={(k) => setActiveTab(k)}
                            className="mb-3 custom-tabs"
                            justify
                        >
                            <Tab eventKey="readingList" title={<span>My Reading<br />List</span>}>
                                <Card className="bg-white my-4 p-4 rounded shadow-md border-0 text-left">
                                    <Card.Title className="mb-3 d-flex justify-content-between align-items-center text-2xl font-bold text-brown-800">
                                        My Reading Goals
                                        <Button variant="primary" onClick={() => setShowGoalModal(true)} className="custom-button-sm">Set New Goal</Button>
                                    </Card.Title>
                                    {currentGoals.length === 0 ? (
                                        <Card.Text className="text-gray-700">You haven't set any reading goals yet.</Card.Text>
                                    ) : (
                                        <ul className="list-unstyled mb-0">
                                            {currentGoals.map(goal => {
                                                let progressValue = 0;
                                                let targetValue = goal.target;

                                                if (goal.type === 'books') {
                                                    progressValue = readingStatistics.totalBooksFinished;
                                                } else if (goal.type === 'pages') {
                                                    progressValue = readingStatistics.totalPagesReadAcrossAllBooks;
                                                }

                                                const completion = targetValue > 0 ? Math.min(100, (progressValue / targetValue) * 100).toFixed(0) : 0;
                                                const progressText = `${progressValue} / ${targetValue}`;

                                                return (
                                                    <li key={goal.id} className="mb-2">
                                                        <Card.Text className="text-gray-700 mb-1">
                                                            {`${goal.type === 'books' ? 'Read' : 'Read'} ${targetValue} ${goal.type} ${goal.period === 'yearly' ? 'this year' : 'this month'}: `}
                                                            <strong>{progressText}</strong>
                                                        </Card.Text>
                                                        <ProgressBar now={completion} label={`${completion}%`} variant="info" style={{ height: '20px', backgroundColor: '#e0d9c8' }} />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </Card>
                                <MyReadingList />
                            </Tab>

                            <Tab eventKey="discoverBooks" title={<span>Discover<br />Books</span>}>
                                <DiscoverBooks />
                            </Tab>

                            <Tab eventKey="recommendations" title={<span>Our<br />Recommendations</span>}>
                                <RecommendedBooks />
                            </Tab>

                            <Tab eventKey="readingStatistics" title={<span>Reading<br />Statistics</span>}>
                                <ReadingStatistics stats={readingStatistics} />
                            </Tab>
                        </Tabs>
                    </div>
                </>
            ) : (
                <Alert variant="warning" className="mt-5 text-lg text-center bg-yellow-100 border-yellow-200 text-yellow-800">Please log in or register to access the full dashboard features.</Alert>
            )}


            {selectedBook && (
                <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                        <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>{selectedBook.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}>
                        <Row className="align-items-center mb-3">
                            {selectedBook.coverImageUrl && (
                                <Col xs={4} className="text-center">
                                    <img src={selectedBook.coverImageUrl} alt={`${selectedBook.title} cover`} className="img-fluid rounded shadow-sm" style={{ maxWidth: '120px' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x180/FDF8ED/5A4434?text=No+Cover' }} />
                                </Col>
                            )}
                            <Col xs={selectedBook.coverImageUrl ? 8 : 12}>
                                <p className="mb-1"><strong>Author(s):</strong> {selectedBook.author}</p>
                                <p className="mb-1"><strong>Genre:</strong> {selectedBook.genre || 'N/A'}</p>
                                {selectedBook.publishedDate && <p className="mb-1"><strong>Published:</strong> {selectedBook.publishedDate}</p>}
                                {selectedBook.averageRating > 0 && <p className="mb-1"><strong>External Rating:</strong> {selectedBook.averageRating} ⭐ ({selectedBook.ratingsCount || 0} ratings)</p>}
                                {selectedBook.currentPage !== undefined && selectedBook.totalPages !== undefined && (
                                    <p className="mb-1"><strong>Pages:</strong> {selectedBook.currentPage} / {selectedBook.totalPages}</p>
                                )}
                            </Col>
                        </Row>
                        <p><strong>Description:</strong> {selectedBook.description || 'No description available.'}</p>

                        {selectedBook.notes && (
                            <div className="mt-3 p-3 border rounded" style={{ borderColor: '#e0d9c8', backgroundColor: '#fdfbf5' }}>
                                <h5>Notes:</h5>
                                <p style={{ whiteWhiteSpace: 'pre-wrap' }}>{selectedBook.notes}</p>
                            </div>
                        )}
                        {selectedBook.highlights && (
                            <div className="mt-3 p-3 border rounded" style={{ borderColor: '#e0d9c8', backgroundColor: '#fdfbf5' }}>
                                <h5>Highlights:</h5>
                                <p style={{ whiteWhiteSpace: 'pre-wrap' }}>{selectedBook.highlights}</p>
                            </div>
                        )}
                        {selectedBook.rating !== null && selectedBook.rating !== undefined && (
                            <div className="mt-3">
                                <h5>Your Rating:</h5>
                                <p className="d-flex align-items-center">{renderStarRating(selectedBook.rating)}</p>
                            </div>
                        )}
                        {selectedBook.reviewText && (
                            <div className="mt-3 p-3 border rounded" style={{ borderColor: '#e0d9c8', backgroundColor: '#fdfbf5' }}>
                                <h5>Your Review:</h5>
                                <p style={{ whiteWhiteSpace: 'pre-wrap' }}>{selectedBook.reviewText}</p>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: '#f8f4ed', borderTop: '1px solid #d4c7b8' }}>
                        <Button variant="secondary" onClick={() => setShowDetailsModal(false)} className="custom-button-secondary">
                            Close
                        </Button>
                        {selectedBook.id && !selectedBook._id && isAuthenticated && (
                            <Button variant="primary" onClick={() => handleAddToList(selectedBook)} className="custom-button-primary">
                                Add to My List
                            </Button>
                        )}
                    </Modal.Footer>
                </Modal>
            )}


            {bookToEdit && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                        <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>Edit Book: {bookToEdit.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}>
                        <Form onSubmit={handleUpdateBook}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Title</Form.Label>
                                <Form.Control type="text" name="title" value={editFormData.title} onChange={handleEditFormChange} required className="custom-input" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Author</Form.Label>
                                <Form.Control type="text" name="author" value={editFormData.author} onChange={handleEditFormChange} required className="custom-input" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Description</Form.Label>
                                <Form.Control as="textarea" name="description" value={editFormData.description} onChange={handleEditFormChange} rows={3} className="custom-input" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Genre</Form.Label>
                                <Form.Control type="text" name="genre" value={editFormData.genre} onChange={handleEditFormChange} className="custom-input" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Cover Image URL</Form.Label>
                                <Form.Control type="text" name="coverImageUrl" value={editFormData.coverImageUrl} onChange={handleEditFormChange} className="custom-input" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Status</Form.Label>
                                <Form.Control as="select" name="status" value={editFormData.status} onChange={handleEditFormChange} className="custom-select">
                                    <option value="Planned">Planned</option>
                                    <option value="Reading">Reading</option>
                                    <option value="Finished">Finished</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Current Page</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="currentPage"
                                    value={editFormData.currentPage}
                                    onChange={handleEditFormChange}
                                    min="0"
                                    className="custom-input"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Total Pages</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="totalPages"
                                    value={editFormData.totalPages}
                                    onChange={handleEditFormChange}
                                    min="1"
                                    className="custom-input"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="notes"
                                    value={editFormData.notes}
                                    onChange={handleEditFormChange}
                                    rows={4}
                                    placeholder="Add your private notes about this book here..."
                                    className="custom-input"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Highlights</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="highlights"
                                    value={editFormData.highlights}
                                    onChange={handleEditFormChange}
                                    rows={4}
                                    placeholder="Add your favorite highlights or quotes here..."
                                    className="custom-input"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Your Rating (1-5 Stars)</Form.Label>
                                <StarRatingInput
                                    value={parseFloat(editFormData.rating) || 0}
                                    onChange={handleRatingChange}
                                    size="1.5em"
                                />
                                <Form.Text className="text-muted ms-2">
                                    {editFormData.rating ? `${parseFloat(editFormData.rating).toFixed(1)} / 5` : 'Not Rated'}
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Your Review</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="reviewText"
                                    value={editFormData.reviewText}
                                    onChange={handleEditFormChange}
                                    rows={4}
                                    placeholder="Write your review here..."
                                    className="custom-input"
                                />
                            </Form.Group>

                            <div className="d-flex justify-content-end mt-4">
                                <Button variant="secondary" onClick={() => setShowEditModal(false)} className="me-2 custom-button-secondary">
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" className="custom-button-primary">
                                    Save Changes
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            )}


            {confirmRemoveBook && (
                <Modal show={!!confirmRemoveBook} onHide={() => setConfirmRemoveBook(null)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                        <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>Confirm Removal</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}>
                        Are you sure you want to remove "<strong>{confirmRemoveBook.title}</strong>" from your reading list?
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: '#f8f4ed', borderTop: '1px solid #d4c7b8' }}>
                        <Button variant="secondary" onClick={() => setConfirmRemoveBook(null)} className="custom-button-secondary">
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleRemoveFromMyList} className="custom-button-danger">
                            Remove
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}

            {<Modal show={showGoalModal} onHide={() => setShowGoalModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                    <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>Set New Reading Goal</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}>
                    <Form onSubmit={handleSetGoal}>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-gray-700">Goal Type</Form.Label>
                            <Form.Control as="select" value={newGoalType} onChange={(e) => setNewGoalType(e.target.value)} className="custom-select">
                                <option value="books">Books</option>
                                <option value="pages">Pages</option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-gray-700">Target Value</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder={`Enter target ${newGoalType}`}
                                value={newGoalTarget}
                                onChange={(e) => setNewGoalTarget(e.target.value)}
                                min="1"
                                required
                                className="custom-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-gray-700">Goal Period</Form.Label>
                            <Form.Control as="select" value={newGoalPeriod} onChange={(e) => setNewGoalPeriod(e.target.value)} className="custom-select">
                                <option value="yearly">Yearly</option>
                                <option value="monthly">Monthly</option>
                            </Form.Control>
                        </Form.Group>
                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="secondary" onClick={() => setShowGoalModal(false)} className="me-2 custom-button-secondary">
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" className="custom-button-primary">
                                Set Goal
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>}

            <style jsx>{`
                /* General Container and Text Styles */
                .bg-light-brown-100 {
                    background-color: #f8f4ed;
                }
                .text-brown-800 {
                    color: #5a4434;
                }
                .text-brown-900 {
                    color: #4a382e;
                }
                .text-gray-700 {
                    color: #4a5568;
                }
                .text-gray-600 {
                    color: #718096;
                }
                .text-gray-50 {
                    background-color: #fdfbf5;
                }
                .border-light-brown {
                    border-color: #d4c7b8;
                }
                .border-light-brown-100 {
                    border-color: #e0d9c8;
                }
                .bg-light-brown-50 {
                    background-color: #fdfbf5;
                }

                /* Card Styles */
                .card {
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                }

                /* Book List Grid */
                .book-list-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                /* Individual Book Card within Grid */
                .book-card {
                    border: 1px solid #e0d9c8;
                    background-color: #ffffff;
                }
                .book-cover {
                    border: 1px solid #d4c7b8;
                }
                .book-card-title {
                    font-size: 1.15rem;
                }
                .book-card-subtitle {
                    font-size: 0.9rem;
                }

                /* Custom Form Controls (Inputs, Selects) */
                .custom-input, .custom-select {
                    border-color: #d4c7b8;
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .custom-input:focus, .custom-select:focus {
                    border-color: #5a4434;
                    box-shadow: 0 0 0 0.25rem rgba(90, 68, 52, 0.25);
                    outline: none;
                }

                /* Custom Buttons */
                .custom-button-primary {
                    background-color: #5a4434;
                    border-color: #5a4434;
                    color: white;
                    border-radius: 0.375rem;
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, transform 0.1s ease-in-out;
                }
                .custom-button-primary:hover {
                    background-color: #7b6a5a;
                    border-color: #7b6a5a;
                    transform: translateY(-1px);
                }
                .custom-button-primary:active {
                    transform: translateY(0);
                }

                .custom-button-primary-outline {
                    color: #5a4434;
                    border-color: #5a4434;
                    background-color: transparent;
                    border-radius: 0.375rem;
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    transition: all 0.2s ease-in-out;
                }
                .custom-button-primary-outline:hover {
                    background-color: #5a4434;
                    color: white;
                }

                .custom-button-secondary {
                    background-color: #a0a0a0;
                    border-color: #a0a0a0;
                    color: white;
                    border-radius: 0.375rem;
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    transition: all 0.2s ease-in-out;
                }
                .custom-button-secondary:hover {
                    background-color: #8b8b8b;
                    border-color: #8b8b8b;
                }

                .custom-button-danger {
                    background-color: #dc3545;
                    border-color: #dc3545;
                    color: white;
                    border-radius: 0.375rem;
                    padding: 0.5rem 1.75rem;
                    font-weight: 600;
                    transition: all 0.2s ease-in-out;
                }
                .custom-button-danger:hover {
                    background-color: #c82333;
                    border-color: #c82333;
                }
                
                .custom-button-sm {
                    font-size: 0.85rem;
                    padding: 0.375rem 0.75rem;
                }

                /* Tab Styles */
                .custom-tabs .nav-link {
                    color: #5a4434;
                    border: 1px solid #d4c7b8;
                    border-bottom-color: transparent;
                    margin-bottom: -1px;
                    background-color: #e0d9c8;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    font-weight: bold;
                    transition: all 0.2s ease-in-out;
                    width: 100%; /* Added for consistent width */
                    text-align: center; /* Added for consistent text alignment */
                }

                .custom-tabs .nav-link.active {
                    background-color: #5a4434;
                    color: white;
                    border-color: #5a4434;
                    font-weight: bold;
                }

                .custom-tabs .nav-link:hover:not(.active) {
                    background-color: #d4c7b8;
                    color: #4a382e;
                }

                .custom-tabs .nav-item {
                    margin-bottom: 0;
                }

                .custom-tabs .tab-content {
                    background-color: #ffffff;
                    border: 1px solid #d4c7b8;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 1.5rem;
                }

                .modal-header {
                    border-bottom: 1px solid #d4c7b8;
                    background-color: #f8f4ed;
                }
                .modal.title {
                    color: #5a4434;
                }
                .modal-body {
                    background-color: #fdfbf5;
                    color: #5a4434;
                }
                .modal-footer {
                    border-top: 1px solid #d4c7b8;
                    background-color: #f8f4ed;
                }
            `}</style>
        </Container>
    );
}

export default Dashboard;
