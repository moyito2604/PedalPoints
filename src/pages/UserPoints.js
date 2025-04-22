import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserPoints.css';

const UserPoints = () => {
    const navigate = useNavigate();
    const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsor, setSelectedSponsor] = useState('');
    const [currentPoints, setCurrentPoints] = useState(0);
    const [transactions, setTransactions] = useState([]);

    const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        // Fetch the sponsors associated with the driver
        if (storedUser) {
            axios.get(`${REACT_APP_BASEURL}/user/sponsors`, {
                params: { user_id: storedUser.id }
            })
            .then(response => {
                if (response.data.success) {
                    setSponsors(response.data.sponsors);
                }
            })
            .catch(error => console.error("Error fetching sponsors:", error));
        }
        else{
            navigate('/login');
        }
    }, [navigate, REACT_APP_BASEURL, storedUser]);

    const fetchPointsData = (sponsorId) => {
        setSelectedSponsor(sponsorId);

        axios.get(`${REACT_APP_BASEURL}/user/points`, {
            params: { user_id: storedUser.id, sponsor_id: sponsorId }
        })
        .then(response => {
            if (response.data.success) {
                setCurrentPoints(response.data.current_points);
                setTransactions(response.data.transactions);
            }
        })
        .catch(error => console.error("Error fetching points data:", error));
    };

    return (
        <>
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
            <div className="user-points-container">
                <h2>My Points</h2>
                
                <label>Select Sponsor:</label>
                <select value={selectedSponsor} onChange={(e) => fetchPointsData(e.target.value)}>
                    <option value="">-- Select a Sponsor --</option>
                    {sponsors.map((sponsor) => (
                        <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                            {sponsor.SponsorCompanyName}
                        </option>
                    ))}
                </select>

                {selectedSponsor && (
                    <div className="points-section">
                        <h3>Current Points: {currentPoints}</h3>

                        <h4>Transaction History</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Points</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, index) => (
                                    <tr key={index}>
                                        <td>{new Date(tx.TransactionDate).toLocaleDateString()}</td>
                                        <td>{tx.TransactionChange}</td>
                                        <td>{tx.TransactionReason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserPoints;
