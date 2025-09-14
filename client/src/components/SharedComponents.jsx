// src/components/SharedComponents.jsx
import React, { useMemo } from 'react';
import { Button, Card, Form, InputGroup, ProgressBar, Spinner } from 'react-bootstrap';

// Reusable Loading Spinner
export const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="text-center my-5 p-4">
        <Spinner animation="border" role="status" className="custom-spinner" />
        <p className="mt-3 text-muted">{message}</p>
    </div>
);

// Reusable Empty State Message
export const EmptyState = ({ message = "No items found.", details = "Try adjusting your filters or adding new content." }) => (
    <div className="text-center my-5 p-4 bg-light-brown-100 rounded border border-light-brown">
        <h5 className="text-brown-800 font-semibold">{message}</h5>
        <p className="mt-2 text-muted">{details}</p>
    </div>
);

// Reusable Search Input with Clear Button
export const SearchInput = ({ searchTerm, onSearchTermChange, onSearch, placeholder = "Search...", showClearButton = true }) => {
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
        <InputGroup className="mb-3 custom-input-group">
            <Form.Control
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyPress={handleKeyPress}
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

// Reusable Book Card
export const BookCard = ({ book, onShowDetails, onEditClick, onRemoveClick, onUpdateProgress, currentPageInput, onCurrentPageInputChange }) => {
    const completionPercentage = useMemo(() => {
        return book.totalPages > 0 ? Math.min(100, Math.max(0, (book.currentPage / book.totalPages) * 100)).toFixed(0) : 0;
    }, [book]);

    const handleProgressUpdate = () => {
        const value = currentPageInput[book._id];
        if (value !== undefined) {
            onUpdateProgress(book._id, 'currentPage', parseInt(value, 10));
        }
    };

    const renderRating = (rating) => {
        if (rating === null || rating === undefined || isNaN(rating)) return 'Not Rated';
        const stars = '⭐'.repeat(Math.round(rating));
        return `${rating.toFixed(1)} / 5 ${stars}`;
    };

    return (
        <Card className="book-card p-3 shadow-sm rounded-lg hover-scale transition-transform duration-200">
            <div className="d-flex flex-column h-100">
                <div className="d-flex align-items-start mb-3">
                    <img
                        src={book.coverImageUrl || 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover'}
                        alt={`${book.title} cover`}
                        className="book-cover me-3 rounded shadow-sm"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover' }}
                    />
                    <div className="flex-grow-1">
                        <Card.Title className="h6 font-semibold custom-title mb-1">{book.title}</Card.Title>
                        <Card.Subtitle className="text-sm text-muted mb-2 custom-author">by {book.author}</Card.Subtitle>
                        <span className={`badge rounded-pill text-uppercase custom-status-badge custom-status-${book.status.toLowerCase()}`}>{book.status}</span>
                        <div className="text-xs text-muted mt-2">
                            <span className="me-2">Pages: {book.totalPages}</span>
                            <span className="me-2">Rating: {renderRating(book.rating)}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-3 border-top custom-border-top">
                    <p className="text-sm text-muted mb-2">
                        Progress: <span className="text-brown-800 font-semibold">{book.currentPage || 0}</span> / {book.totalPages || 0} pages
                    </p>
                    <ProgressBar now={completionPercentage} label={`${completionPercentage}%`} variant="success" className="custom-progress-bar mb-2" />
                    {book.status === 'Reading' && (
                        <InputGroup size="sm" className="mb-2 custom-page-input">
                            <Form.Control
                                type="number"
                                placeholder="Update page..."
                                value={currentPageInput[book._id] || ''} // Ensure it's an empty string for controlled component
                                onChange={(e) => onCurrentPageInputChange(book._id, e.target.value)}
                                onBlur={handleProgressUpdate}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleProgressUpdate(); }}
                            />
                            <Button variant="outline-success" onClick={handleProgressUpdate} className="custom-button-secondary-sm">
                                Go
                            </Button>
                        </InputGroup>
                    )}
                    <div className="d-flex justify-content-between mt-2">
                        <Button variant="outline-primary" size="sm" className="custom-button-outline" onClick={() => onShowDetails(book)}>Details</Button>
                        <Button variant="outline-info" size="sm" className="custom-button-outline" onClick={() => onEditClick(book)}>Edit</Button>
                        <Button variant="outline-danger" size="sm" className="custom-button-outline" onClick={() => onRemoveClick(book)}>Remove</Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
