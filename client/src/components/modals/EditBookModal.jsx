// src/components/modals/EditBookModal.jsx
import React from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';

const EditBookModal = ({
    show, onHide,
    bookToEdit, editFormData, editFormErrors,
    handleEditFormChange, handleUpdateBook
}) => {
    if (!bookToEdit) return null;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>Edit Book: {bookToEdit.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}> {/* Corrected syntax here */}
                <Form onSubmit={handleUpdateBook}>
                    <Row className="mb-3">
                        <Col md={4} className="d-flex flex-column align-items-center">
                            <Form.Label className="text-gray-700 mb-2">Book Cover</Form.Label>
                            <img
                                src={editFormData.coverImageUrl || 'https://placehold.co/150x225/FDF8ED/5A4434?text=No+Cover'}
                                alt={`${editFormData.title} cover`}
                                className="img-fluid rounded shadow-sm mb-3"
                                style={{ maxWidth: '150px', height: 'auto', objectFit: 'cover', border: '1px solid #d4c7b8' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x225/FDF8ED/5A4434?text=No+Cover'; }}
                            />
                            <Form.Group className="w-100">
                                <Form.Label className="text-gray-700">Cover Image URL</Form.Label>
                                <Form.Control type="text" name="coverImageUrl" value={editFormData.coverImageUrl} onChange={handleEditFormChange} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="title"
                                    value={editFormData.title}
                                    onChange={handleEditFormChange}
                                    isInvalid={!!editFormErrors.title}
                                    required
                                    className="custom-input"
                                />
                                <Form.Control.Feedback type="invalid">{editFormErrors.title}</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Author</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="author"
                                    value={editFormData.author}
                                    onChange={handleEditFormChange}
                                    isInvalid={!!editFormErrors.author}
                                    required
                                    className="custom-input"
                                />
                                <Form.Control.Feedback type="invalid">{editFormErrors.author}</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Genre</Form.Label>
                                <Form.Control type="text" name="genre" value={editFormData.genre} onChange={handleEditFormChange} className="custom-input" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Status</Form.Label>
                                <Form.Control as="select" name="status" value={editFormData.status} onChange={handleEditFormChange} className="custom-select">
                                    <option value="Planned">Planned</option>
                                    <option value="Reading">Reading</option>
                                    <option value="Finished">Finished</option>
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Current Page</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="currentPage"
                                    value={editFormData.currentPage}
                                    onChange={handleEditFormChange}
                                    min="0"
                                    isInvalid={!!editFormErrors.currentPage}
                                    className="custom-input"
                                />
                                <Form.Control.Feedback type="invalid">{editFormErrors.currentPage}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-gray-700">Total Pages</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="totalPages"
                                    value={editFormData.totalPages}
                                    onChange={handleEditFormChange}
                                    min="1"
                                    isInvalid={!!editFormErrors.totalPages}
                                    className="custom-input"
                                />
                                <Form.Control.Feedback type="invalid">{editFormErrors.totalPages}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-gray-700">Your Rating (0-5)</Form.Label>
                        <div className="d-flex align-items-center">
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                name="rating"
                                // Ensure the value is a number, defaulting to 0 if editFormData.rating is not a valid number
                                value={parseFloat(editFormData.rating) || 0}
                                onChange={handleEditFormChange}
                                className="form-range custom-slider flex-grow-1"
                                style={{ '--value': `${((parseFloat(editFormData.rating) || 0) / 5) * 100}%` }}
                            />
                            <Form.Text className="text-muted ms-2">
                                {editFormData.rating ? `${parseFloat(editFormData.rating).toFixed(1)} / 5` : 'Not Rated'}
                            </Form.Text>
                        </div>
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
                    <Form.Group className="mb-3">
                        <Form.Label className="text-gray-700">Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="notes"
                            value={editFormData.notes}
                            onChange={handleEditFormChange}
                            rows={4}
                            placeholder="Add your notes here..."
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
                            placeholder="Add your highlights here..."
                            className="custom-input"
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="secondary" onClick={onHide} className="me-2 custom-button-secondary">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" className="custom-button-primary">
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditBookModal;
