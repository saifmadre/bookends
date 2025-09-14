// src/components/HomeContent.jsx
import React from 'react';
import { Button, Card, ProgressBar } from 'react-bootstrap';
import { EmptyState } from './SharedComponents'; // Assuming EmptyState is also in SharedComponents

const HomeContent = ({ user, currentGoals, readingStatistics, setShowGoalModal }) => {
    return (
        <div className="mt-4 text-left">
            <Card className="bg-white my-4 p-4 rounded shadow-md border-0 text-left animated-card">
                <Card.Title className="mb-4 text-3xl font-bold text-brown-800 border-bottom pb-3">
                    Welcome to Bookends, {user?.username || 'Fellow Reader'}!
                </Card.Title>
                <Card.Body className="text-gray-700">
                    <p className="lead">
                        Embark on your literary journey with Bookends, your personalized reading companion. Organize, discover, and track your progress all in one intuitive space.
                    </p>
                    <ul className="list-group-custom-bullet mb-4">
                        <li>Keep a meticulous record of your books with the "My Reading List" feature.</li>
                        <li>Uncover new literary treasures and expand your horizons in "Discover Books."</li>
                        <li>Receive tailored suggestions designed to match your unique tastes under "Our Recommendations."</li>
                        <li>Visualize your reading progress through insightful charts and statistics.</li>
                        <li>Set motivating reading goals to challenge yourself and celebrate your achievements.</li>
                    </ul>
                    <p>
                        Begin your adventure now by navigating through the various sections using the convenient sidebar. Happy reading!
                    </p>
                </Card.Body>
            </Card>

            <Card className="bg-white my-4 p-4 rounded shadow-md border-0 text-left animated-card">
                <Card.Title className="mb-3 d-flex justify-content-between align-items-center text-2xl font-bold text-brown-800 border-bottom pb-2">
                    My Reading Goals
                    <Button variant="primary" onClick={() => setShowGoalModal(true)} className="custom-button-sm">Set New Goal</Button>
                </Card.Title>
                {currentGoals.length === 0 ? (
                    <EmptyState message="No reading goals set yet." details="Set a goal to challenge yourself!" />
                ) : (
                    <ul className="list-unstyled mb-0">
                        {currentGoals.map(goal => {
                            let progressValue = 0;
                            let targetValue = goal.target;

                            if (goal.type === 'books') {
                                progressValue = readingStatistics.totalBooksFinished;
                            } else if (goal.type === 'pages') {
                                progressValue = readingStatistics.totalPagesReadAcrossAllBooks;
                            }

                            const completion = targetValue > 0 ? Math.min(100, (progressValue / targetValue) * 100).toFixed(0) : 0;
                            const progressText = `${progressValue} / ${targetValue}`;

                            return (
                                <li key={goal.id} className="mb-3 animated-item">
                                    <Card className="p-3 shadow-sm border-light-brown-100">
                                        <Card.Text className="text-gray-700 mb-2 font-semibold">
                                            {`${goal.type === 'books' ? 'Read' : 'Read'} ${targetValue} ${goal.type} ${goal.period === 'yearly' ? 'this year' : 'this month'}: `}
                                            <strong className="text-brown-900">{progressText}</strong>
                                        </Card.Text>
                                        <ProgressBar now={completion} label={`${completion}%`} variant="info" style={{ height: '25px', backgroundColor: '#e0d9c8' }} className="custom-progress-bar" />
                                    </Card>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default HomeContent;
