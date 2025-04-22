import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const AdminProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [email, setEmail] = useState(null);
    const [bio, setBio] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);

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

            // Fetch admin details
            const fetchAdminDetails = async () => {
                try {
                    const response = await axios.get(`${REACT_APP_BASEURL}/admin/get-admin-details/${storedUserData.username}`);
                    if (response.data.success) {
                        setPhoneNumber(response.data.phoneNumber);
                        setEmail(response.data.email);
                        setBio(response.data.bio);
                    } else {
                        console.error("Failed to fetch admin details:", response.data.message);
                    }
                } catch (error) {
                    console.error("Error fetching admin details:", error);
                }
            };

            const fetchProfilePicture = async () => {
                try {
                    const response = await axios.get(
                        `${REACT_APP_BASEURL}/user/profile-picture/${storedUserData.username}`,
                        { responseType: "blob" }
                    );

                    if (response.status === 200) {
                        const imageUrl = URL.createObjectURL(response.data);
                        setProfilePicture(imageUrl);
                    } else {
                        setProfilePicture(null);
                    }
                } catch (error) {
                    console.error("Error fetching profile picture:", error);
                    setProfilePicture(null);
                }
            };

            fetchAdminDetails();
            fetchProfilePicture();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleEdit = (field) => {
        switch (field) {
            case 'name':
                navigate('/user/modify/name');
                break;
            case 'username':
                navigate('/user/modify/username');
                break;
            case 'password':
                navigate('/user/modify/password');
                break;
            case 'phone':
                navigate('/user/modify/phone');
                break;
            case 'email':
                navigate('/user/modify/email');
                break;
            case 'shipping':
                navigate('/user/modify/shipping-address');
                break;
            case 'bio':
                navigate('/user/modify/bio');
                break;
            default:
                break;
        }
    };

    return (
        <div className="user-profile-container">
            <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/admin/landing')}
                            className="flex items-center mr-10 focus:outline-none"
                        >
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <AwardIcon className="text-white" />
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            Log out
                        </button>
                    </div>
                </div>
            </nav>

            <h1 className="profile-header">Admin Profile</h1>

            {userData ? (
                <div className="profile-content">
                    <div className="profile-picture-container">
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="profile-picture" />
                        ) : (
                            <div className="profile-placeholder">No Profile Picture</div>
                        )}
                        <button className="upload-button" onClick={() => navigate('/user/upload/pfp')}>
                            Change Profile Picture
                        </button>
                    </div>

                    <div className="profile-info">
                        <p className="editable-field" onClick={() => handleEdit('name')}>
                            <span className="editable-field-content">
                                <strong>Name:</strong> {userData.firstname} {userData.lastname}
                            </span>
                            <span className="edit-icon">📝</span>
                        </p>
                        <p className="editable-field" onClick={() => handleEdit('username')}>
                            <span className="editable-field-content">
                                <strong>Username:</strong> {userData.username || 'N/A'}
                            </span>
                            <span className="edit-icon">📝</span>
                        </p>
                        <p className="editable-field" onClick={() => handleEdit('password')}>
                            <span className="editable-field-content">
                                <strong>Password:</strong> ••••••••
                            </span>
                            <span className="edit-icon">📝</span>
                        </p>
                        <p className="editable-field" onClick={() => handleEdit('bio')}>
                            <span className="editable-field-content">
                                <strong>Bio:</strong> {bio || 'N/A'}
                            </span>
                            <span className="edit-icon">📝</span>
                        </p>
                        <p className="editable-field" onClick={() => handleEdit('phone')}>
                            <span className="editable-field-content">
                                <strong>Phone Number:</strong> {phoneNumber || 'N/A'}
                            </span>
                            <span className="edit-icon">📝</span>
                        </p>
                        <p className="editable-field" onClick={() => handleEdit('email')}>
                            <span className="editable-field-content">
                                <strong>Email:</strong> {email || 'N/A'}
                            </span>
                            <span className="edit-icon">📝</span>
                        </p>
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default AdminProfile;
