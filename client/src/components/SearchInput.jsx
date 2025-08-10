// src/components/SearchInput.jsx
import React from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

/**
 * A reusable search input component that triggers a search only on Enter key press or button click.
 * It also includes an optional clear button.
 *
 * @param {object} props - The component props.
 * @param {string} props.searchTerm - The current value of the search input.
 * @param {function} props.onSearchTermChange - Callback to update the search term state in the parent.
 * @param {function} props.onSearch - Callback to trigger the actual search action.
 * @param {string} [props.placeholder="Search..."] - Placeholder text for the input.
 * @param {boolean} [props.showClearButton=true] - Whether to show the clear button.
 * @param {string} [props.className=""] - Additional CSS classes for the input control.
 */
function SearchInput({ searchTerm, onSearchTermChange, onSearch, placeholder = "Search...", showClearButton = true, className = "" }) {
    /**
     * Handles clearing the search term and optionally triggers a search with an empty term.
     */
    const handleClear = () => {
        onSearchTermChange('');
        if (onSearch) {
            onSearch(''); // Trigger search with empty term if clear means "show all"
        }
    };

    /**
     * Handles key press events, specifically listening for the "Enter" key to trigger a search.
     * @param {object} e - The keyboard event object.
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission behavior if part of a larger form
            if (onSearch) {
                onSearch(searchTerm); // Trigger the search with the current term
            }
        }
    };

    return (
        <InputGroup className="mb-3">
            <Form.Control
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)} // Only updates the state, no live search
                onKeyPress={handleKeyPress} // Listen for Enter key press
                className={`form-control-minimal ${className}`} // Apply minimalist styling
                aria-label="Search input"
            />
            {showClearButton && searchTerm && (
                <Button variant="outline-secondary" onClick={handleClear} className="button-outline-minimal">
                    Clear
                </Button>
            )}
            {/* Dedicated search button */}
            <Button variant="primary" onClick={() => onSearch(searchTerm)} className="button-primary-minimal ms-2">
                Search
            </Button>
        </InputGroup>
    );
}

export default SearchInput;
