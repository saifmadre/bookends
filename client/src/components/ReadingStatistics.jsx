// client/src/components/ReadingStatistics.jsx

import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts'; // Added Text import

/**
 * ReadingStatistics Component
 *
 * This component displays various reading statistics such as:
 * - Total words read
 * - Books completed
 * - Average reading speed
 * - Time spent reading
 * - Total books in list
 * - Books by status (Planned, Reading, Finished)
 * - Most common genre
 * - Most common author
 * - Average rating of finished books
 * - Average pages per finished book
 *
 * It also includes new charts for:
 * - Most Read Authors (Bar Chart)
 * - Reading Streak (Custom Visualization/Pie Chart for demonstration)
 *
 * It takes 'stats' as a prop, which is an object containing the reading statistics.
 * The 'stats' object is expected to have the following structure:
 * {
 * totalWordsRead: number,
 * booksCompleted: number,
 * averageReadingSpeed: number, // words per minute (WPM)
 * timeSpentReading: number,    // in hours
 * totalBooksInList: number,
 * mostCommonGenre: string,
 * mostCommonAuthor: string,
 * averageRating: number,
 * averagePagesPerFinishedBook: number,
 * genreCounts: object, // NEW: for potential future genre chart
 * authorCounts: object, // NEW: Used for Most Read Authors chart
 * booksByStatus: { 'Planned': number, 'Reading': number, 'Finished': number }
 * }
 */
const ReadingStatistics = ({ stats }) => {
    // Destructure the stats object for easier access
    const {
        totalWordsRead,
        booksCompleted,
        averageReadingSpeed,
        timeSpentReading,
        totalBooksInList,
        mostCommonGenre,
        mostCommonAuthor,
        averageRating,
        averagePagesPerFinishedBook,
        authorCounts, // Now using this for the chart
        booksByStatus
    } = stats;

    // Data for the numerical statistic cards
    const statItems = [
        {
            label: "Total Words Read",
            value: totalWordsRead ? totalWordsRead.toLocaleString() : 'N/A',
            icon: "✍", // Pen
            color: "bg-gradient-to-br from-blue-700 to-blue-900",
            iconColor: "text-blue-300"
        },
        {
            label: "Books Completed",
            value: booksCompleted !== undefined ? booksCompleted : 'N/A',
            icon: "✅", // Checkmark
            color: "bg-gradient-to-br from-emerald-700 to-emerald-900",
            iconColor: "text-emerald-300"
        },
        {
            label: "Avg. Reading Speed (WPM)",
            value: averageReadingSpeed ? averageReadingSpeed.toFixed(0) : 'N/A',
            icon: "⏱", // Stopwatch
            color: "bg-gradient-to-br from-purple-700 to-purple-900",
            iconColor: "text-purple-300"
        },
        {
            label: "Time Spent Reading (Hours)",
            value: timeSpentReading ? timeSpentReading.toFixed(1) : 'N/A',
            icon: "⏳", // Hourglass
            color: "bg-gradient-to-br from-yellow-700 to-yellow-900",
            iconColor: "text-yellow-300"
        },
        {
            label: "Total Books in List",
            value: totalBooksInList !== undefined ? totalBooksInList : 'N/A',
            icon: "📚", // Stack of books
            color: "bg-gradient-to-br from-red-700 to-red-900",
            iconColor: "text-red-300"
        },
        {
            label: "Most Common Genre",
            value: mostCommonGenre || 'N/A',
            icon: "🎭", // Theatre masks
            color: "bg-gradient-to-br from-indigo-700 to-indigo-900",
            iconColor: "text-indigo-300"
        },
        {
            label: "Most Common Author",
            value: mostCommonAuthor || 'N/A',
            icon: "✒️", // Nib pen
            color: "bg-gradient-to-br from-pink-700 to-pink-900",
            iconColor: "text-pink-300"
        },
        {
            label: "Average Rating",
            value: averageRating !== undefined && averageRating !== null ? `${averageRating}/5` : 'N/A',
            icon: "🌟", // Sparkling star
            color: "bg-gradient-to-br from-teal-700 to-teal-900",
            iconColor: "text-teal-300"
        },
        {
            label: "Avg. Pages/Finished Book",
            value: averagePagesPerFinishedBook !== undefined ? averagePagesPerFinishedBook : 'N/A',
            icon: "📈", // Chart increasing
            color: "bg-gradient-to-br from-orange-700 to-orange-900",
            iconColor: "text-orange-300"
        },
    ];

    // Prepare data for Most Read Authors chart
    const authorChartData = authorCounts
        ? Object.entries(authorCounts)
            .map(([name, count]) => ({ name, books: count }))
            .sort((a, b) => b.books - a.books)
            .slice(0, 5) // Top 5 authors
        : [];

    // Minimalistic color palette for the bar chart
    const AUTHOR_BAR_COLORS = ['#8892B0', '#6C728E', '#505672', '#343B57', '#1A2038']; // Shades of muted blue/gray

    // Placeholder data for Reading Streak (since actual streak logic isn't available)
    const totalMilestoneDays = 10; // Define a milestone for the streak visualization
    const currentStreakDays = 7; // Example: 7 days
    const remainingDays = totalMilestoneDays - currentStreakDays;

    // Data for the streak Pie chart
    const streakPieData = [
        { name: 'Current Streak', value: currentStreakDays },
        { name: 'Remaining', value: remainingDays > 0 ? remainingDays : 0 },
    ];
    // Minimalistic color palette for the pie chart
    const STREAK_PIE_COLORS = ['#00C9B1', '#303A60']; // Bright teal for progress, dark blue for background

    return (
        <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-8 rounded-3xl shadow-2xl max-w-6xl mx-auto my-12 font-sans text-gray-200 border-4 border-slate-700">
            <h2 className="text-5xl font-extrabold text-center mb-12 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-500 drop-shadow-lg animate-pulse-text">
                Your Dynamic Reading Insights
            </h2>

            {/* Main Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-12">
                {statItems.map((item, index) => (
                    <div
                        key={index}
                        className={`flex flex-col items-center p-6 ${item.color} rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-xl relative overflow-hidden group border border-transparent hover:border-blue-400`}
                        style={{ animation: `fadeInSlideUp 0.6s ease-out ${index * 0.08}s forwards` }}
                    >
                        <div className="absolute inset-0 bg-white opacity-5 rounded-xl animate-subtle-glow"></div>
                        <span className={`text-5xl mb-3 z-10 ${item.iconColor}`}>{item.icon}</span>
                        <p className="text-sm font-semibold text-gray-300 mb-1 tracking-wide uppercase z-10">{item.label}</p>
                        <p className="text-3xl font-black text-gray-100 z-10">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 p-8 bg-gray-800 rounded-3xl shadow-inset-xl border border-indigo-600">
                {/* Most Read Authors Chart */}
                <div className="p-8 bg-slate-700 rounded-2xl shadow-xl border border-slate-600 transform hover:scale-[1.02] transition-transform duration-300">
                    <h3 className="text-3xl font-bold text-gray-100 mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-green-300">Top Authors by Books Read</h3>
                    {authorChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={authorChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="2 2" stroke="#333" vertical={false} /> {/* Lighter, dashed grid, no vertical */}
                                <XAxis dataKey="name" stroke="#a0a0a0" tickLine={false} axisLine={{ stroke: "#666" }} style={{ fontSize: '0.85em' }} />
                                <YAxis stroke="#a0a0a0" tickLine={false} axisLine={{ stroke: "#666" }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#cbd5e0' }}
                                    labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '1em' }}
                                    itemStyle={{ color: '#a0aec0' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8em', color: '#a0a0a0' }} />
                                <Bar dataKey="books" name="Books Read" radius={[8, 8, 0, 0]} barSize={25}> {/* Slightly smaller radius and bar size */}
                                    {authorChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={AUTHOR_BAR_COLORS[index % AUTHOR_BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-gray-400 italic mt-8 p-4 bg-slate-800 rounded-lg">
                            No author data available. Add more books to your list to see your favorite authors!
                        </p>
                    )}
                </div>

                {/* Reading Streak Chart/Visualization */}
                <div className="p-8 bg-slate-700 rounded-2xl shadow-xl border border-slate-600 flex flex-col items-center justify-center transform hover:scale-[1.02] transition-transform duration-300">
                    <h3 className="text-3xl font-bold text-gray-100 mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300">Your Reading Streak</h3>
                    {currentStreakDays > 0 ? ( // Use currentStreakDays for conditional rendering
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    {/* Background Pie for the full circle track */}
                                    <Pie
                                        data={[{ name: 'Total Milestone', value: totalMilestoneDays }]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="#3F4756" // Darker background color for the circle
                                        dataKey="value"
                                        isAnimationActive={false} // No animation for background
                                        stroke="none"
                                    />
                                    {/* Progress Pie for the current streak */}
                                    <Pie
                                        data={streakPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80} // Inner radius of the progress circle (makes it a donut)
                                        outerRadius={100} // Outer radius same as background
                                        startAngle={90} // Start from the top
                                        endAngle={90 - (currentStreakDays / totalMilestoneDays) * 360} // Calculate end angle based on progress
                                        paddingAngle={0} // No padding between progress and background
                                        dataKey="value"
                                        isAnimationActive={true}
                                        animationDuration={1500} // Smooth animation
                                        stroke="none" // No stroke for clean look
                                        cornerRadius={5} // Slightly rounded ends for the arc
                                    >
                                        {streakPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STREAK_PIE_COLORS[index % STREAK_PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    {/* Custom Text for the streak count in the center */}
                                    <Text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="font-extrabold text-5xl"
                                        fill="#E2E8F0" // Light gray color for the number
                                    >
                                        {currentStreakDays}
                                    </Text>
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#cbd5e0' }}
                                        labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '1em' }}
                                        itemStyle={{ color: '#a0aec0' }}
                                    />
                                    {/* Legend for streak pie chart - can be optionally removed for ultra-minimalism */}
                                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8em', color: '#a0a0a0' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="text-xl font-medium text-gray-300 mt-4">
                                Your current streak: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">{currentStreakDays} days</span>
                            </p>
                            {remainingDays > 0 ? (
                                <p className="text-md text-gray-400 mt-1">
                                    Only <span className="text-teal-300 font-semibold">{remainingDays} more days</span> to reach your {totalMilestoneDays}-day milestone!
                                </p>
                            ) : (
                                <p className="text-md text-gray-400 mt-1">
                                    You've reached your {totalMilestoneDays}-day milestone! Excellent!
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-gray-400 italic mt-8 p-4 bg-slate-800 rounded-lg">
                            No active reading streak. Start reading today to build one!
                        </p>
                    )}
                </div>
            </div>

            {/* Books by Status */}
            {booksByStatus && Object.keys(booksByStatus).length > 0 && (
                <div className="mt-12 p-10 bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
                    <h3 className="text-3xl font-bold text-gray-100 mb-8 text-center">Books by Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {Object.entries(booksByStatus).map(([status, count]) => (
                            <div
                                key={status}
                                className="flex flex-col items-center p-6 bg-slate-700 rounded-xl shadow-md border border-slate-600 transform hover:scale-105 transition-transform duration-300 group"
                            >
                                <p className="text-base font-semibold text-gray-300 mb-2 group-hover:text-purple-400 transition-colors">{status}</p>
                                <p className="text-4xl font-bold text-gray-100 group-hover:text-pink-400 transition-colors">{count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Message for no data */}
            {!totalWordsRead && !booksCompleted && !averageReadingSpeed && !timeSpentReading && !totalBooksInList && (
                <p className="text-center text-gray-400 mt-12 p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 italic font-medium">
                    No reading statistics available yet. Start your literary adventure!
                </p>
            )}

            {/* Keyframes for animations */}
            <style>
                {`
          .font-sans {
            font-family: 'Inter', sans-serif; /* Ensuring Inter is used */
          }

          @keyframes fadeInSlideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes subtle-glow {
            0% { opacity: 0.05; }
            50% { opacity: 0.15; }
            100% { opacity: 0.05; }
          }

          .animate-subtle-glow {
            animation: subtle-glow 4s infinite ease-in-out;
          }

          @keyframes pulse-text {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          .animate-pulse-text {
            animation: pulse-text 2s infinite ease-in-out;
          }

          /* Inset shadow for chart container */
          .shadow-inset-xl {
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
          }
        `}
            </style>
        </div>
    );
};

export default ReadingStatistics;