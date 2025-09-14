// src/components/DiscoverBooks.jsx
import { faBook, faCompass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { EmptyState, LoadingSpinner, SearchInput } from './SharedComponents'; // Assuming these are in SharedComponents

const DiscoverBooks = ({
    isAuthenticated,
    searchTerm,
    setSearchTerm,
    handleExternalSearch,
    loadingExternalBooks,
    errorExternalBooks,
    externalBooks,
    loadingCategorizedRecommendations,
    errorCategorizedRecommendations,
    categorizedRecommendations,
    handleWantToRead,
    handleNotInterested,
    searchExternalBooks,
    setActiveTab // To switch tabs when clicking "More X books"
}) => {
    const isSearchButtonDisabled = searchTerm.trim().length < 3;

    if (!isAuthenticated) {
        return (
            <div className="mt-4 text-center p-4">
                <Alert variant="info" className="text-lg bg-blue-100 border-blue-200 text-blue-800">Please log in to discover new books.</Alert>
            </div>
        );
    }

    return (
        <div className="mt-4 text-left">
            <h4 className="book-form-label mb-4 text-3xl font-bold text-brown-800 border-bottom pb-3">Explore New Worlds</h4>

            <Form onSubmit={handleExternalSearch} className="mb-4 animated-card">
                <Card className="bg-white p-4 rounded shadow-sm border-light-brown-100">
                    <Card.Title className="text-xl font-semibold text-brown-800 mb-3">Search for Books</Card.Title>
                    <SearchInput
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        onSearch={handleExternalSearch}
                        placeholder="Search by title, author, or genre..."
                        showClearButton={true}
                    />
                    <Button type="submit" className="custom-button-primary mt-2" disabled={isSearchButtonDisabled}>
                        <FontAwesomeIcon icon={faCompass} className="me-2" /> Search
                    </Button>
                </Card>
            </Form>

            {loadingExternalBooks ? (
                <LoadingSpinner message="Searching for books..." />
            ) : errorExternalBooks ? (
                <Alert variant="danger" className="mt-4 text-center">{errorExternalBooks}</Alert>
            ) : externalBooks.length === 0 && searchTerm.length >= 3 ? (
                <EmptyState message={`No books found for "${searchTerm}".`} details="Try a different search term!" />
            ) : externalBooks.length > 0 && searchTerm.length >= 3 ? (
                <>
                    <h5 className="text-2xl font-semibold text-brown-800 mb-4 mt-5">Search Results for "{searchTerm}"</h5>
                    <div className="book-list-grid">
                        {externalBooks.map(book => (
                            <Card key={book.id} className="book-card p-3 shadow-sm rounded-lg h-100 d-flex flex-column hover:shadow-md transition-shadow duration-200 animated-item">
                                <div className="d-flex align-items-start mb-3">
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
                                    <Button size="sm" variant="outline-success" onClick={() => handleWantToRead(book)} className="custom-button-sm flex-fill">Add to My List</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : null}


            <h4 className="book-form-label mt-5 mb-4 text-3xl font-bold text-brown-800 border-bottom pb-3">
                Recommendations Based on Your Interests
            </h4>

            {loadingCategorizedRecommendations ? (
                <LoadingSpinner message="Fetching personalized recommendations..." />
            ) : errorCategorizedRecommendations ? (
                <Alert variant="danger" className="mt-4 text-center">{errorCategorizedRecommendations}
                    <Button variant="link" onClick={() => { /* retry logic */ }} className="ms-2 text-brown-800">Retry</Button>
                </Alert>
            ) : Object.keys(categorizedRecommendations).length === 0 ? (
                <EmptyState
                    message="No categorized recommendations found at the moment."
                    details="Add more books to your list and explore to get personalized suggestions!"
                />
            ) : (
                Object.entries(categorizedRecommendations).map(([category, books]) => (
                    <div key={category} className="mb-5 animated-card">
                        <h5 className="text-2xl font-semibold text-brown-800 mb-3">Explore {category}</h5>
                        <div className="d-flex flex-nowrap overflow-auto py-2 book-carousel">
                            {books.map(book => (
                                <Card key={book.id} className="book-card flex-shrink-0 p-3 shadow-sm rounded-lg me-3 hover:shadow-md transition-shadow duration-200 animated-item" style={{ width: '220px' }}>
                                    <div className="d-flex flex-column h-100">
                                        <div className="d-flex align-items-start mb-3">
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
                                            <Button size="sm" variant="outline-success" onClick={() => handleWantToRead(book)} className="mb-2 custom-button-sm flex-fill">Want to Read</Button>
                                            <Button size="sm" variant="outline-secondary" onClick={() => handleNotInterested(book)} className="custom-button-sm flex-fill">Not Interested</Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="text-right mt-3">
                            <Button variant="link" className="text-brown-800 font-semibold text-sm hover-underline" onClick={() => {
                                setSearchTerm(category);
                                searchExternalBooks(category);
                                setActiveTab('discoverBooks'); // Switch to discover tab to show full search
                            }}>
                                More {category} books <FontAwesomeIcon icon={faBook} />
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default DiscoverBooks;
