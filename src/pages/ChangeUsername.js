import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditUserInfo.css';

const ChangeUsername = () => {
    const navigate = useNavigate();
    const [currentUsername, setCurrentUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [userRole, setUserRole] = useState('driver');

    const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

    useEffect(() => {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setUserRole(userData.role);
        } else {
            navigate('/login'); // Redirect to login if no user data is found
        }
    }, [navigate]);

    const navigateByRole = () => {
        if (userRole === 'sponsor') {
            navigate('/sponsor/profile');
        } else if (userRole === 'admin') {
            navigate('/admin/profile');
        } else {
            navigate('/user/profile');
        }
    };

    const handleCancel = () => {
        navigateByRole();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear messages before submitting the request
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await axios.post(REACT_APP_BASEURL + '/user/modify/username', {
                username: currentUsername,
                password: password,
                new_user: newUsername,
            });

            if (response.data.success) {
                setSuccessMessage(response.data.message);

                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData) {
                    userData.username = newUsername;
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                
                setTimeout(() => navigateByRole(), 2000);
            } else {
                setErrorMessage(response.data.message);
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div className="edit-page-container">
            <div className="edit-form-container password-form-container">
                <div className="edit-header">
                    <h2>Change Username</h2>
                </div>

                <form className="edit-form password-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Username <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={currentUsername} 
                            onChange={(e) => setCurrentUsername(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>New Username <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={newUsername} 
                            onChange={(e) => setNewUsername(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Password <span className="required">*</span></label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <input 
                            type="checkbox" 
                            id="showPassword" 
                            checked={showPassword} 
                            onChange={() => setShowPassword(!showPassword)} 
                        />
                        <label htmlFor="showPassword">Show Password</label>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-button">Change Username</button>
                        <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>

                    {errorMessage && <div className="message error">{errorMessage}</div>}
                    {successMessage && <div className="message success">{successMessage}</div>}
                </form>
            </div>
        </div>
    );
};

export default ChangeUsername;
