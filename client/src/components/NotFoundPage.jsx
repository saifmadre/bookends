// src/components/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light text-center">
            <div>
                <h1 className="display-1 fw-bold text-danger">404</h1>
                <p className="fs-3"> <span className="text-danger">Opps!</span> Page not found.</p>
                <p className="lead">
                    The page you’re looking for doesn’t exist.
                </p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        </div>
    );
}

export default NotFoundPage;