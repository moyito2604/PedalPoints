import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminNotify.css'; 

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const AdminNotify = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [notificationType, setNotificationType] = useState('');
    const [notificationDetails, setNotificationDetails] = useState('');
    const [userId, setUserId] = useState('');
    const [sendToAll, setSendToAll] = useState(false);
    const [userType, setUserType] = useState('');

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        const storedUserData = JSON.parse(localStorage.getItem('user'));

        if (storedUserData) {
            setUserData(storedUserData);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSendNotification = async (e) => {
        e.preventDefault();

        if (!notificationDetails || !notificationType || (!sendToAll && !userId)) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const user_id = userData.user_id;

            const response = await axios.post(
                `${REACT_APP_BASEURL}/admin/send-notification`,
                {
                    user_id: user_id,
                    notificationType,
                    notificationDetails,
                    userType,
                    userIds: sendToAll ? [] : [userId],
                }
            );

            if (response.data.success) {
                alert('Notification sent successfully!');
            } else {
                alert('Failed to send notification');
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Error sending notification');
        }
    };

    return (
        <div className="admin-notify-container">
            <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate("/admin/landing")}
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

            {/* Main Form */}
            <div className="admin-notify-form-card">
                <h2>Notification Dashboard</h2>
                <form onSubmit={handleSendNotification}>
                    <div className="form-group">
                        <label>Notification Type:</label>
                        <input
                            type="text"
                            value={notificationType}
                            onChange={(e) => setNotificationType(e.target.value)}
                            placeholder="e.g., general, update"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Notification Details:</label>
                        <textarea
                            value={notificationDetails}
                            onChange={(e) => setNotificationDetails(e.target.value)}
                            placeholder="Enter notification message"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Recipient Type:</label>
                        <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            required
                        >
                            <option value="">Select</option>
                            <option value="Driver">Driver</option>
                            <option value="Sponsor">Sponsor</option>
                        </select>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={sendToAll}
                                onChange={() => setSendToAll(!sendToAll)}
                            />
                            Send to All Users of Selected Type
                        </label>
                    </div>

                    {!sendToAll && (
                        <div className="form-group">
                            <label>User ID:</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter user ID"
                            />
                        </div>
                    )}

                    <div className="button-group">
                        <button type="submit" className="submit-button">Send Notification</button>
                        <button type="button" className="cancel-button" onClick={() => navigate('/admin/landing')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminNotify;
