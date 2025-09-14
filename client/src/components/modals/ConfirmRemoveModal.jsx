// src/components/modals/ConfirmRemoveModal.jsx
import React from 'react';
import { Button, Modal } from 'react-bootstrap';

const ConfirmRemoveModal = ({ show, onHide, bookToRemove, onConfirmRemove }) => {
    if (!bookToRemove) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f4ed', borderBottom: '1px solid #d4c7b8' }}>
                <Modal.Title style={{ color: '#5a4434', fontWeight: 'bold' }}>Confirm Removal</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: '#fdfbf5', color: '#5a4434' }}>
                Are you sure you want to remove "<strong>{bookToRemove.title}</strong>" from your reading list?
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f4ed', borderTop: '1px solid #d4c7b8' }}>
                <Button variant="secondary" onClick={onHide} className="custom-button-secondary">
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirmRemove} className="custom-button-danger">
                    Remove
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmRemoveModal;
