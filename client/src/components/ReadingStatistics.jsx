import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { useMemo } from 'react';
import { Card, Col, ListGroup, Row } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';

const EmptyState = ({ message = "No items found.", details = "Try adjusting your filters or adding new data." }) => (
    <div className="text-center my-5 text-muted">
        <p className="mb-0 text-xl font-semibold">{message}</p>
        <p className="text-sm">{details}</p>
    </div>
);

// We register the required chart components here
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const ReadingStatistics = ({ stats, myBooks }) => {

    // Helper function to get top items from a count object
    const getTopItems = (counts, num = 3) => {
        // Use a fallback to an empty object to prevent errors
        const safeCounts = counts || {};
        return Object.entries(safeCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, num);
    };

    // Memoize chart data to prevent re-calculations and to ensure hooks are called unconditionally
    const statusChartData = useMemo(() => ({
        labels: Object.keys(stats?.booksByStatus || {}),
        datasets: [{
            label: 'Books by Status',
            data: Object.values(stats?.booksByStatus || {}),
            backgroundColor: [
                'rgba(242, 185, 114, 0.8)',
                'rgba(141, 196, 219, 0.8)',
                'rgba(139, 195, 74, 0.8)'
            ],
            borderColor: [
                'rgba(242, 185, 114, 1)',
                'rgba(141, 196, 219, 1)',
                'rgba(139, 195, 74, 1)'
            ],
            borderWidth: 1,
        }],
    }), [stats]);

    const booksReadPerMonth = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = new Array(12).fill(0);
        Object.entries(stats?.booksReadPerMonth || {}).forEach(([monthYear, count]) => {
            const month = parseInt(monthYear.split('-')[1]) - 1;
            monthlyData[month] = count;
        });

        return {
            labels: months,
            datasets: [{
                label: 'Books Finished',
                data: monthlyData,
                backgroundColor: 'rgba(90, 68, 52, 0.8)',
                borderColor: 'rgba(90, 68, 52, 1)',
                borderWidth: 1,
            }],
        };
    }, [stats]);

    const pagesReadOverTime = useMemo(() => {
        const cumulativeData = (stats?.pagesReadOverTime || []).reduce((acc, current) => {
            const lastTotal = acc.length > 0 ? acc[acc.length - 1].pages : 0;
            acc.push({
                date: new Date(current.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                pages: lastTotal + current.pages,
            });
            return acc;
        }, []);

        return {
            labels: cumulativeData.map(item => item.date),
            datasets: [{
                label: 'Cumulative Pages Read',
                data: cumulativeData.map(item => item.pages),
                backgroundColor: 'rgba(175, 137, 107, 0.8)',
                borderColor: 'rgba(175, 137, 107, 1)',
                borderWidth: 1,
            }],
        };
    }, [stats]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false,
            },
        },
    };

    // All hooks and data transformations are now handled.
    // We can now safely use the data to render the component.
    const topGenres = getTopItems(stats?.genreCounts);
    const topAuthors = getTopItems(stats?.authorCounts);

    if (!stats || Object.keys(stats).length === 0) {
        return (
            <Card className="animated-item p-4 border-0">
                <h2 className="custom-title mb-4">Your Reading Statistics</h2>
                <EmptyState message="No data available yet." details="Please add some books to your list to see your statistics." />
            </Card>
        );
    }

    return (
        <Card className="animated-item p-4 border-0">
            <h2 className="custom-title mb-4">Your Reading Statistics</h2>
            <Row className="g-4 mb-4">
                <Col md={12} lg={4}>
                    <Card className="h-100 shadow-sm border-light-brown-100 animated-item">
                        <Card.Body>
                            <Card.Subtitle className="mb-3 text-2xl font-semibold text-brown-800">Books by Status</Card.Subtitle>
                            <div style={{ height: '250px' }}>
                                {Object.values(stats.booksByStatus).some(count => count > 0) ? (
                                    <Doughnut data={statusChartData} />
                                ) : (
                                    <EmptyState message="No books in your list yet." details="Add some books to get started!" />
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-light-brown-100 animated-item">
                        <Card.Body>
                            <Card.Subtitle className="mb-3 text-2xl font-semibold text-brown-800">Top Genres</Card.Subtitle>
                            <ListGroup variant="flush">
                                {topGenres.length > 0 ? topGenres.map(([genre, count], index) => (
                                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center bg-transparent border-0 px-0">
                                        <span>{genre}</span>
                                        <span className="badge bg-light-brown-500 rounded-pill">{count}</span>
                                    </ListGroup.Item>
                                )) : <EmptyState message="No genres read yet." details="Finish a book to see your top genres!" />}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-light-brown-100 animated-item">
                        <Card.Body>
                            <Card.Subtitle className="mb-3 text-2xl font-semibold text-brown-800">Top Authors</Card.Subtitle>
                            <ListGroup variant="flush">
                                {topAuthors.length > 0 ? topAuthors.map(([author, count], index) => (
                                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center bg-transparent border-0 px-0">
                                        <span>{author}</span>
                                        <span className="badge bg-light-brown-500 rounded-pill">{count}</span>
                                    </ListGroup.Item>
                                )) : <EmptyState message="No authors read yet." details="Finish a book to see your top authors!" />}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col md={12} lg={6}>
                    <Card className="h-100 shadow-sm border-light-brown-100 animated-item">
                        <Card.Body>
                            <Card.Subtitle className="mb-3 text-2xl font-semibold text-brown-800">Books Read Per Month</Card.Subtitle>
                            <div style={{ height: '300px' }}>
                                {booksReadPerMonth.labels.length > 0 ? (
                                    <Bar data={booksReadPerMonth} options={chartOptions} />
                                ) : (
                                    <EmptyState message="No books finished yet." details="Finish some books to see this chart!" />
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={12} lg={6}>
                    <Card className="h-100 shadow-sm border-light-brown-100 animated-item">
                        <Card.Body>
                            <Card.Subtitle className="mb-3 text-2xl font-semibold text-brown-800">Cumulative Pages Read</Card.Subtitle>
                            <div style={{ height: '300px' }}>
                                {pagesReadOverTime.labels.length > 0 ? (
                                    <Bar data={pagesReadOverTime} options={chartOptions} />
                                ) : (
                                    <EmptyState message="No pages read yet." details="Start reading or finish a book to see your progress!" />
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};

export default ReadingStatistics;
