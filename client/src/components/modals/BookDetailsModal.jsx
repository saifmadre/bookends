// src/components/modals/BookDetailsModal.jsx
import React from 'react';
import { Button, Col, Modal, Row } from 'react-bootstrap';

const BookDetailsModal = ({ show, onHide, selectedBook, isAuthenticated, handleAddToList }) => {
    if (!selectedBook) return null;

    const renderRatingDisplay = (rating) => {
        if (rating === null || rating === undefined || isNaN(rating)) return 'Not Rated';
        return `${rating.toFixed(1)} / 5 ⭐`;
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>{selectedBook.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}>
                <Row className="align-items-center mb-3">
                    {selectedBook.coverImageUrl && (
                        <Col xs={4} className="text-center">
                            <img src={selectedBook.coverImageUrl || 'https://placehold.co/120x180/FDF8ED/5A4434?text=No+Cover'} alt={`${selectedBook.title} cover`} className="img-fluid rounded shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x180/FDF8ED/5A4434?text=No+Cover' }} style={{ maxWidth: '120px', height: 'auto', objectFit: 'cover' }} />
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
                <div className="mt-3">
                    <h5>Your Rating:</h5>
                    <p className="d-flex align-items-center">{renderRatingDisplay(selectedBook.rating)}</p>
                </div>
                {selectedBook.reviewText && (
                    <div className="mt-3 p-3 border rounded" style={{ borderColor: '#e0d9c8', backgroundColor: '#fdfbf5' }}>
                        <h5>Your Review:</h5>
                        <p style={{ whiteWhiteSpace: 'pre-wrap' }}>{selectedBook.reviewText}</p>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f4ed', borderTop: '1px solid #d4c7b8' }}>
                <Button variant="secondary" onClick={onHide} className="custom-button-secondary">
                    Close
                </Button>
                {selectedBook.id && !selectedBook._id && isAuthenticated && (
                    <Button variant="primary" onClick={() => handleAddToList(selectedBook)} className="custom-button-primary">
                        Add to My List
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default BookDetailsModal;
