import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLanding = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        // Retrieve user data from localStorage (or wherever it's stored)
        const storedUserData = JSON.parse(localStorage.getItem('user'));

        if (storedUserData) {
            setUserData(storedUserData); // Set the user data into the state
        } else {
            // If no user data is found, redirect to login
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        // Clear the stored user data and redirect to login
        localStorage.removeItem('user');
        navigate('/');
    };

    // Navigation options for the dashboard tiles
    const navOptions = [
        { title: "Create User", path: "/admin/create", icon: "👤" },
        { title: "Manage Users", path: "/admin/users", icon: "👥" },
        { title: "Create Sponsor Organization", path: "/admin/create-org", icon: "🏢" },
        { title: "Reports", path: "/admin/reports", icon: "📊" },
        { title: "Assign Drivers to Sponsors", path: "/admin/assign-sponsor", icon: "🤝" },
        { title: "Send Notifications", path: "/admin/notify", icon: "📨" }
    ];

    return (
        <div className="user-landing-container">
            <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate("")}
                            className="flex items-center mr-10 focus:outline-none"
                        >
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <AwardIcon className="text-white" />
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
                        </button>

                        <div className="hidden md:flex space-x-6">
                            <button onClick={() => navigate('/admin/profile')} className="text-gray-600 hover:text-green-600">Profile</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            Log out
                        </button>
                    </div>
                </div>
            </nav>
            <div className="user-landing-content">
                {userData ? (
                    <>
                        <h2 className="dashboard-header">Admin Dashboard</h2>
                        <p className="dashboard-welcome">Hello, {userData.firstname} {userData.lastname}</p>
                        
                        <div className="dashboard-grid tiles-3">
                            {navOptions.map((option, index) => (
                                <div 
                                    key={index} 
                                    className="dashboard-tile" 
                                    onClick={() => navigate(option.path)}
                                >
                                    <div className="tile-icon">{option.icon}</div>
                                    <div className="tile-title">{option.title}</div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
};

export default AdminLanding;