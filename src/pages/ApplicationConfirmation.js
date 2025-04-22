import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationConfirmation.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const ApplicationConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [timeFrame, setTimeFrame] = useState('');
    const [sponsorName, setSponsorName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        // Get sponsor information from location state or localStorage
        const sponsor = location.state?.sponsor || localStorage.getItem('lastAppliedSponsor');
        
        if (!sponsor) {
            setError('Application information not found');
            setLoading(false);
            return;
        }

        setSponsorName(sponsor);

        // Fetch the sponsor's time frame from the database
        const fetchSponsorTimeFrame = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/timeframe/${sponsor}`);
                
                if (response.data.success) {
                    setTimeFrame(response.data.timeFrame);
                } else {
                    setError('Failed to load sponsor response time information.');
                }
            } catch (err) {
                console.error("Error fetching sponsor time frame:", err);
                setError('Error retrieving sponsor response time information.');
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorTimeFrame();
    }, [location.state]);

    const handleReturnHome = () => {
        navigate('/user/landing');
    };

    const defaultTimeFrame = '7-10 business days';

    return (
        <div className="confirmation-container">
            <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/user/landing')}
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
                    <h1>Application Submitted Successfully!</h1>
                    {loading ? (
                        <p>Loading sponsor information...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <>
                            <h2>Thank you for applying to {sponsorName}</h2>
                            <div className="confirmation-details">
                                <p>
                                    Your application has been received and is being reviewed by the sponsor.
                                </p>
                                <p className="timeframe-info">
                                    <strong>Expected Response Time:</strong> {timeFrame || defaultTimeFrame}
                                </p>
                                <p>
                                    You can check the status of your application on your dashboard.
                                </p>
                            </div>
                        </>
                    )}
                </div>
                <div className="confirmation-actions">
                    <button className="return-home-button" onClick={handleReturnHome}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationConfirmation;