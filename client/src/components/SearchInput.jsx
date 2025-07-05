// src/components/SearchInput.jsx
import React from 'react';
import { Form } from 'react-bootstrap';

function SearchInput({ searchTerm, onSearchTermChange, placeholder }) {
    // Removed onKeyPress logic. The parent Form's onSubmit handles Enter key.
    return (
        <Form.Control
            type="text"
            placeholder={placeholder || "Search"} // Use the passed placeholder or a default
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="me-2 book-input" // Apply custom styling class
        />
    );
}

export default SearchInput;
