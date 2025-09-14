// src/components/MyReadingList.jsx
import React, { useMemo } from 'react';
import { Alert, Card, Col, Form, Row } from 'react-bootstrap';
import { BookCard, EmptyState, LoadingSpinner } from './SharedComponents'; // Assuming BookCard, LoadingSpinner, EmptyState are in SharedComponents

const MyReadingList = ({
    myBooks,
    isAuthenticated,
    userId,
    loadingMyBooks,
    errorMyBooks,
    sortCriteria, setSortCriteria,
    sortOrder, setSortOrder,
    filterStatus, setFilterStatus,
    filterGenre, setFilterGenre,
    filterAuthor, setFilterAuthor,
    minRatingFilter, setMinRatingFilter,
    hasNotesFilter, setHasNotesFilter,
    filterPageCount, setFilterPageCount,
    handleShowDetails,
    handleEditClick,
    handleConfirmRemove,
    handleUpdateBookField,
    currentPageInput,
    onCurrentPageInputChange
}) => {
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

    let filteredBooks = (isAuthenticated && userId)
        ? myBooks.filter(book => book.user === userId)
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
        } else if (sortCriteria === 'rating') {
            comparison = (a.rating || 0) - (b.rating || 0);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return (
        <div className="mt-4 text-left">
            <h4 className="book-form-label mb-4 text-3xl font-bold text-brown-800 border-bottom pb-3">My Reading List</h4>

            <Card className="bg-white p-4 mb-4 rounded shadow-sm border-light-brown-100 animated-card">
                <Card.Title className="text-xl font-semibold text-brown-800 mb-3">Filter & Sort Options</Card.Title>
                <Row className="mb-4 align-items-end g-3">
                    <Col xs={12} sm={6} md={4}>
                        <Form.Group>
                            <Form.Label className="text-gray-700 text-sm font-medium">Sort By:</Form.Label>
                            <Form.Control as="select" value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)} className="form-select custom-select">
                                <option value="addedDate">Date Added</option>
                                <option value="title">Title</option>
                                <option value="author">Author</option>
                                <option value="completion">Completion %</option>
                                <option value="rating">Rating</option>
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
                            <Form.Label className="text-gray-700 text-sm font-medium">Filter Author:</Form.Label>
                            <Form.Control as="select" value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} className="form-select custom-select">
                                {uniqueAuthors.map(author => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
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
                                <option value="short">Short (&lt;= 150 pages)</option>
                                <option value="medium">Medium (151 - 400 pages)</option>
                                <option value="long">Long (&gt;= 401 pages)</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>
            </Card>

            {loadingMyBooks ? (
                <LoadingSpinner message="Loading your reading list..." />
            ) : errorMyBooks ? (
                <Alert variant="danger" className="mt-4 text-center">{errorMyBooks}</Alert>
            ) : sortedAndFilteredBooks.length === 0 ? (
                <EmptyState
                    message="No books found matching your current filters and sort criteria."
                    details="Try adjusting them or add new books from 'Discover Books'!"
                />
            ) : (
                <div className="book-list-grid">
                    {sortedAndFilteredBooks.map(book => (
                        <BookCard
                            key={book._id}
                            book={book}
                            onShowDetails={handleShowDetails}
                            onEditClick={handleEditClick}
                            onRemoveClick={handleConfirmRemove}
                            onUpdateProgress={handleUpdateBookField}
                            currentPageInput={currentPageInput}
                            onCurrentPageInputChange={onCurrentPageInputChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReadingList;