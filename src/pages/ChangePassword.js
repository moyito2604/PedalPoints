import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditUserInfo.css';

function ChangePassword() {
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [verifyNewPassword, setVerifyNewPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [userRole, setUserRole] = useState('driver');

	const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

	const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

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

	const handleSubmit = async (event) => {
		event.preventDefault();

		setErrorMessage('');
		setSuccessMessage('');

		if (newPassword !== verifyNewPassword) {
			setPasswordError('New passwords do not match!');
			return;
		}

		if (!passwordRegex.test(newPassword)) {
			setPasswordError('Password must be at least 8 characters long, include a number, a special character, and an uppercase letter.');
			return;
		} else {
			setPasswordError('');
		}

		const passwordData = {
			username,
			old_pass: currentPassword,
			new_pass: newPassword,
		};

		try {
			const response = await axios.post(REACT_APP_BASEURL + '/user/modify/password', passwordData, {
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.data.success) {
				setSuccessMessage(response.data.message);
				setTimeout(() => navigateByRole(), 2000);
			} else if (response.data.message) {
				setErrorMessage(response.data.message);
			} else if (response.data.error) {
				setErrorMessage(response.data.error);
			} else {
				setErrorMessage('An unknown error occurred.');
			}
		} catch (error) {
			setErrorMessage(error.response?.data?.message || 'There was an error changing the password.');
		}
	};

	return (
        <div className="edit-page-container">
            <div className="edit-form-container password-form-container">
                <div className="edit-header">
                    <h2>Change Password</h2>
                </div>

                <form className="edit-form password-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Current Password <span className="required">*</span></label>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password <span className="required">*</span></label>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Verify New Password <span className="required">*</span></label>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={verifyNewPassword} 
                            onChange={(e) => setVerifyNewPassword(e.target.value)} 
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
						<label htmlFor="showPassword">Show password</label>
					</div>

                    {passwordError && <div className="message error">{passwordError}</div>}

                    <div className="form-actions">
                        <button type="submit" className="submit-button">Change Password</button>
						<button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>

					{errorMessage && <div className="message error">{errorMessage}</div>}
                	{successMessage && <div className="message success">{successMessage}</div>}
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;