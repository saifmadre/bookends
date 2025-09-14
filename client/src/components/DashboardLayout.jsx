// src/components/DashboardLayout.jsx
import { faBook, faChartLine, faCompass, faHome, faSignOutAlt, faStar, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Button, Container, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css'; // Assuming custom CSS for styling the layout

const DashboardLayout = ({ activeTab, setActiveTab, children }) => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
            // Optionally show a toast notification for logout error
        }
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar bg-brown-900 text-white shadow-lg">
                <div className="sidebar-header p-4 border-bottom border-brown-700 text-center">
                    <h3 className="font-extrabold text-2xl text-yellow-300">Bookends</h3>
                    <p className="text-sm text-brown-300 mb-0">Your Reading Companion</p>
                </div>
                <nav className="sidebar-nav flex-grow-1">
                    <ListGroup variant="flush" className="sidebar-list-group">
                        <ListGroup.Item action onClick={() => setActiveTab('home')} active={activeTab === 'home'} className="sidebar-list-item">
                            <FontAwesomeIcon icon={faHome} className="me-3" /> Home
                        </ListGroup.Item>
                        <ListGroup.Item action onClick={() => setActiveTab('readingList')} active={activeTab === 'readingList'} className="sidebar-list-item">
                            <FontAwesomeIcon icon={faBook} className="me-3" /> My Reading List
                        </ListGroup.Item>
                        <ListGroup.Item action onClick={() => setActiveTab('discoverBooks')} active={activeTab === 'discoverBooks'} className="sidebar-list-item">
                            <FontAwesomeIcon icon={faCompass} className="me-3" /> Discover Books
                        </ListGroup.Item>
                        <ListGroup.Item action onClick={() => setActiveTab('recommendations')} active={activeTab === 'recommendations'} className="sidebar-list-item">
                            <FontAwesomeIcon icon={faStar} className="me-3" /> Our Recommendations
                        </ListGroup.Item>
                        <ListGroup.Item action onClick={() => setActiveTab('readingStatistics')} active={activeTab === 'readingStatistics'} className="sidebar-list-item">
                            <FontAwesomeIcon icon={faChartLine} className="me-3" /> Reading Statistics
                        </ListGroup.Item>
                        <ListGroup.Item action onClick={() => setActiveTab('profile')} active={activeTab === 'profile'} className="sidebar-list-item">
                            <FontAwesomeIcon icon={faUserCircle} className="me-3" /> Profile
                        </ListGroup.Item>
                        {user?.role === 'admin' && (
                            <ListGroup.Item action onClick={() => navigate('/admin-dashboard')} className="sidebar-list-item">
                                <FontAwesomeIcon icon={faUserCircle} className="me-3" /> Admin Dashboard
                            </ListGroup.Item>
                        )}
                    </ListGroup>
                </nav>
                <div className="sidebar-footer p-4 border-top border-brown-700">
                    {isAuthenticated ? (
                        <Button variant="outline-light" className="w-100 custom-button-logout" onClick={handleLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Logout
                        </Button>
                    ) : (
                        <Button variant="outline-light" className="w-100 custom-button-login" onClick={() => navigate('/login')}>
                            Login
                        </Button>
                    )}
                </div>
            </aside>

            <main className="main-content bg-light-brown-100 p-4">
                <Container fluid className="px-md-5 py-md-4">
                    <h2 className="mb-5 text-4xl font-extrabold text-brown-900 text-center">
                        Your Bookends Dashboard
                    </h2>
                    {children}
                </Container>
            </main>
        </div>
    );
};

export default DashboardLayout;
