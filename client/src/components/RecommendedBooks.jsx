// src/components/RecommendedBooks.jsx
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { EmptyState, LoadingSpinner } from './SharedComponents'; // Assuming these are in SharedComponents

const RecommendedBooks = ({
    myBooks,
    recommendedBooks,
    selectedRecommendationSeedBook, setSelectedRecommendationSeedBook,
    loadingRecommendations,
    errorRecommendations,
    fetchRecommendations,
    handleAddToList,
    handleShowDetails,
    notInterestedBooks,
}) => {
    const [recSortCriteria, setRecSortCriteria] = useState('similarityScore');
    const [recSortOrder, setRecSortOrder] = useState('desc');
    const [recFilterGenre, setRecFilterGenre] = useState('All');
    const [minRatingFilter, setMinRatingFilter] = useState('0');

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
            <h4 className="book-form-label mb-4 text-3xl font-bold text-brown-800 border-bottom pb-3">
                {selectedRecommendationSeedBook ?
                    `If you like "${selectedRecommendationSeedBook.title}", you might enjoy:` :
                    'Books You Might Like:'}
            </h4>

            <Card className="bg-white p-4 mb-4 rounded shadow-sm border-light-brown-100 animated-card">
                <Card.Title className="text-xl font-semibold text-brown-800 mb-3">Refine Recommendations</Card.Title>
                <Form.Group className="mb-4">
                    <Form.Label className="text-gray-800 font-semibold mb-2">Get recommendations based on:</Form.Label>
                    <Form.Control
                        as="select"
                        value={selectedRecommendationSeedBook ? selectedRecommendationSeedBook._id : ''}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            const book = myBooks.find(b => b._id === selectedId);
                            setSelectedRecommendationSeedBook(book);
                            fetchRecommendations(); // Re-fetch with new seed
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

                <Row className="align-items-end g-3">
                    <Col md={4} sm={6} xs={12}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Sort By:</Form.Label>
                            <Form.Control as="select" value={recSortCriteria} onChange={(e) => setRecSortCriteria(e.target.value)} className="form-select custom-select">
                                <option value="similarityScore">Similarity Score</option>
                                <option value="averageRating">Rating</option>
                                <option value="title">Title</option>
                                <option value="author">Author</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={2} sm={6} xs={12}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Order:</Form.Label>
                            <Form.Control as="select" value={recSortOrder} onChange={(e) => setRecSortOrder(e.target.value)} className="form-select custom-select">
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
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
                                <option value="1">1 Star & Up</option>
                                <option value="2">2 Stars & Up</option>
                                <option value="3">3 Stars & Up</option>
                                <option value="4">4 Stars & Up</option>
                                <option value="4.5">4.5 Stars & Up</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={3} sm={6} xs={12} className="d-flex align-items-end">
                        <Button variant="outline-primary" className="custom-button-primary-outline w-100 py-2" onClick={fetchRecommendations}>
                            <FontAwesomeIcon icon={faSyncAlt} className="me-2" /> Refresh
                        </Button>
                    </Col>
                </Row>
            </Card>

            {loadingRecommendations ? (
                <LoadingSpinner message="Generating recommendations..." />
            ) : errorRecommendations ? (
                <Alert variant="danger" className="mt-4 text-center">{errorRecommendations}
                    <Button variant="link" onClick={fetchRecommendations} className="ms-2 text-brown-800">Retry</Button>
                </Alert>
            ) : filteredAndSortedRecommendations.length === 0 ? (
                <EmptyState
                    message={selectedRecommendationSeedBook ?
                        `No similar recommendations found for "${selectedRecommendationSeedBook.title}".` :
                        'No recommendations found at the moment.'}
                    details="Try another book, adjust filters, or add more variety to your reading list!"
                />
            ) : (
                <div className="book-list-grid">
                    {filteredAndSortedRecommendations.map(book => (
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
                            <Card.Text className="text-sm text-gray-600 mb-3 flex-grow-1">
                                {truncateDescription(book.description, 25)}
                            </Card.Text>
                            {selectedRecommendationSeedBook && (
                                <Card.Text className="text-xs text-muted mb-3 recommendation-reason">
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

export default RecommendedBooks;
