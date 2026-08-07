import React, { useEffect, useState } from 'react';
import ProfessionalDashboard from '../components/PicklistDashboard';
import axios from 'axios';

const PicklistDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const BASE_URL = "https://picklist-backend.onrender.com";
    const SUB_URL = "api/v1/second_attempt_report/report";

    const fetchReport = async (date = selectedDate) => {
        setLoading(true);
        setError(null);
        try {
            const URL = `${BASE_URL}/${SUB_URL}${date ? `?date=${date}` : ''}`;
            const response = await axios.get(URL);

            if (response.data && response.data.data) {
                setReportData(response.data.data);
            } else {
                setError("Invalid response format from server");
            }
        } catch (error) {
            console.error("Failed to fetch picklist report error :: ", error);
            setError("Failed to load dashboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        fetchReport(newDate);
    };

    const handleRetry = () => {
        fetchReport();
    };

    // Format date for display
    const formatDisplayDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
                        <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">No Data Available</h3>
                        <p>No report data found. Please try again later.</p>
                        <button
                            onClick={handleRetry}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors mt-4"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Date Picker Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Picklist Performance Dashboard</h1>
                            <p className="text-sm text-gray-600">
                                {formatDisplayDate(selectedDate)}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                            <div className="flex flex-col">
                                <label htmlFor="date-select" className="text-sm font-medium text-gray-700 mb-1">
                                    Select Date
                                </label>
                                <input
                                    type="date"
                                    id="date-select"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => fetchReport(selectedDate)}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ProfessionalDashboard reportData={reportData} selectedDate={selectedDate} />
        </div>
    );
};

export default PicklistDashboardPage;