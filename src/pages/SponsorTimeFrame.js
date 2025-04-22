import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ApplicationConfirmation.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const SponsorTimeFrame = () => {
    const navigate = useNavigate();
    const [sponsorName, setSponsorName] = useState('');
    const [timeFrame, setTimeFrame] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    // Predefined time frame options
    const timeFrameOptions = [
        '3-5 business days',
        '7-10 business days',
        '10-14 business days',
        '14-21 business days'
    ];

    useEffect(() => {
        // Fetch sponsor information based on logged-in user
        const fetchSponsorInfo = async () => {
            try {
                // Retrieve user information from localStorage
                const userInfo = JSON.parse(localStorage.getItem('user'));
                
                if (!userInfo || userInfo.role !== 'sponsor') {
                    setError('Unauthorized access. Please log in as a sponsor.');
                    setLoading(false);
                    return;
                }

                // Fetch sponsor's company name
                const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/get-sponsor-details/${userInfo.username}`);
                
                if (response.data.success) {
                    setSponsorName(response.data.sponsorCompanyName);
                } else {
                    setError('Could not retrieve sponsor information');
                }
            } catch (err) {
                console.error("Error fetching sponsor information:", err);
                setError('Error retrieving sponsor information. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorInfo();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate inputs
        if (!sponsorName) {
            setError('Sponsor name is required');
            return;
        }
        
        if (!timeFrame) {
            setError('Please select a time frame');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/timeframe`, {
                sponsorName,
                timeFrame
            });

            if (response.data.success) {
                setSuccess(true);
            } else {
                setError(response.data.message || 'Failed to update time frame');
            }
        } catch (err) {
            console.error("Error setting sponsor time frame:", err);
            setError('Error updating time frame. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnHome = () => {
        navigate('/sponsor/landing');
    };

    // Loading state
    if (loading) {
        return (
            <div className="confirmation-container">
                <div className="confirmation-card">
                    <div className="confirmation-header">
                        <h1>Loading Sponsor Information</h1>
                        <p>Please wait while we retrieve your details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="confirmation-container">
                <div className="confirmation-card">
                    <div className="confirmation-header">
                        <h1>Time Frame Updated</h1>
                        <div className="confirmation-details">
                            <p>
                                Your response time frame has been successfully updated.
                            </p>
                            <p className="timeframe-info">
                                <strong>Selected Time Frame:</strong> {timeFrame}
                            </p>
                        </div>
                    </div>
                    <div className="confirmation-actions">
                        <button className="return-home-button" onClick={handleReturnHome}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="confirmation-container">
                <div className="confirmation-card">
                    <div className="confirmation-header">
                        <h1>Error</h1>
                        <p className="error-message">{error}</p>
                    </div>
                    <div className="confirmation-actions">
                        <button className="return-home-button" onClick={handleReturnHome}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="confirmation-container">
            <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/sponsor/landing')}
                            className="flex items-center mr-10 focus:outline-none"
                        >
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <AwardIcon className="text-white" />
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
                        </button>
                    </div>
                </div>
            </nav>
            <div className="confirmation-card">
                <div className="confirmation-header">
                    <h1>Set Sponsor Response Time Frame</h1>
                </div>
                <form onSubmit={handleSubmit} className="confirmation-details">
                    <div>
                        <label htmlFor="sponsorName" className="sponsorTimeFrame-form-label">
                            Sponsor Company Name
                        </label>
                        <input
                            type="text"
                            id="sponsorName"
                            value={sponsorName}
                            disabled
                            className="sponsorTimeFrame-form-input"
                        />
                    </div>
                    <div>
                        <label htmlFor="timeFrame" className="sponsorTimeFrame-form-label">
                            Select Response Time Frame
                        </label>
                        <select
                            id="timeFrame"
                            value={timeFrame}
                            onChange={(e) => setTimeFrame(e.target.value)}
                            className="sponsorTimeFrame-form-input"
                            required
                        >
                            <option value="">Select a time frame</option>
                            {timeFrameOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="confirmation-actions">
                        <button 
                            type="submit" 
                            className="return-home-button"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Set Time Frame'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SponsorTimeFrame;