// src/components/modals/SetGoalModal.jsx
import React from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

const SetGoalModal = ({
    show, onHide,
    newGoalType, setNewGoalType,
    newGoalTarget, setNewGoalTarget,
    newGoalPeriod, setNewGoalPeriod, // Ensure this is passed and used
    goalFormErrors,
    handleSetGoal
}) => {
    return (
        <Modal show={show} onHide={onHide} centered>
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
                            isInvalid={!!goalFormErrors.newGoalTarget}
                            className="custom-input"
                        />
                        <Form.Control.Feedback type="invalid">{goalFormErrors.newGoalTarget}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-gray-700">Goal Period</Form.Label>
                        <Form.Control as="select" value={newGoalPeriod} onChange={(e) => setNewGoalPeriod(e.target.value)} className="custom-select">
                            <option value="yearly">Yearly</option>
                            <option value="monthly">Monthly</option>
                        </Form.Control>
                    </Form.Group>
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="secondary" onClick={onHide} className="me-2 custom-button-secondary">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" className="custom-button-primary">
                            Set Goal
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default SetGoalModal;