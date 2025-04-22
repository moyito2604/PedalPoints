import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DriverApplication.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const DriverApplication = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        company: '',
        yearsOfDriving: '',
        sponsor: '',
        reason: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [sponsors, setSponsors] = useState([]);
    const [originalData, setOriginalData] = useState({
        email: '',
        phone: ''
    });

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        // Get user data from localStorage
        const storedUserData = JSON.parse(localStorage.getItem('user'));
        
        if (!storedUserData) {
            navigate('/login'); // Redirect to login if not logged in
            return;
        }

        // Pre-fill data from localStorage
        setFormData(prev => ({
            ...prev,
            firstname: storedUserData.firstname || '',
            lastname: storedUserData.lastname || ''
        }));

        // Fetch additional user details from backend
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${REACT_APP_BASEURL}/user/get-user-details/${storedUserData.username}`);
                
                if (response.data.success) {
                    const email = response.data.email || '';
                    const phone = formatPhoneNumber(response.data.phoneNumber || '');
                    
                    setFormData(prev => ({
                        ...prev,
                        email: email,
                        phone: phone,
                        sponsor: response.data.sponsorCompanyName || ''
                    }));
                    
                    // Store original values for comparison
                    setOriginalData({
                        email: email,
                        phone: phone
                    });
                } else {
                    setError('Failed to load user details.');
                }
            } catch (err) {
                console.error("Error fetching user details:", err);
                setError('Error fetching user details.');
            } finally {
                setLoading(false);
            }
        };

        const fetchSponsors = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/get_sponsor_list`);
                if (response.data.success) {
                    setSponsors(response.data.sponsors);
                } else {
                    console.error("Failed to load sponsors");
                }
            } catch (error) {
                console.error("Error fetching sponsors:", error);
            }
        };

        fetchUserDetails();
        fetchSponsors();

    }, [navigate]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'phone' ? formatPhoneNumber(value) : value
        }));
    };

    const formatPhoneNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length > 0) formatted = `(${cleaned.slice(0, 3)}`;
        if (cleaned.length >= 4) formatted += `) ${cleaned.slice(3, 6)}`;
        if (cleaned.length >= 7) formatted += `-${cleaned.slice(6, 10)}`;
        return formatted;
    };

    const updateUserInfo = async (username) => {
        const updatePromises = [];
        
        // Check if email changed
        if (formData.email !== originalData.email) {
            updatePromises.push(
                axios.post(`${REACT_APP_BASEURL}/user/modify/email`, {
                    username: username,
                    new_email: formData.email
                })
            );
        }
        
        // Check if phone changed
        if (formData.phone !== originalData.phone) {
            updatePromises.push(
                axios.post(`${REACT_APP_BASEURL}/user/modify/phone`, {
                    username: username,
                    new_phone: formData.phone
                })
            );
        }
        
        // Wait for all updates to complete
        if (updatePromises.length > 0) {
            try {
                await Promise.all(updatePromises);
                console.log("User contact information updated successfully");
            } catch (error) {
                console.error("Error updating contact information:", error);
                throw error;
            }
        }
    };

    const submitDriverApplication = async (username) => {
        try {
            const response = await axios.post(`${REACT_APP_BASEURL}/user/submit-application`, {
                username: username,
                yearsOfDriving: formData.yearsOfDriving,
                sponsorName: formData.sponsor,
                reason: formData.reason
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to submit driver application');
            }
            
            return response.data;
        } catch (error) {
            console.error("Error submitting driver application:", error);
    
            // Check if the error is from the backend
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);  // This passes the backend error message
            }
    
            // If it's not a backend error, throw a generic error
            throw new Error('An unexpected error occurred.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.firstname || !formData.lastname || !formData.email || !formData.phone || !formData.yearsOfDriving || !formData.sponsor) {
            setError('Please fill in all required fields.');
            return;
        }

        const storedUserData = JSON.parse(localStorage.getItem('user'));
        
        try {
            // First update user contact information if changed
            await updateUserInfo(storedUserData.username);
            
            // Then submit the driver application
            await submitDriverApplication(storedUserData.username);
            
            // Store the sponsor name for the confirmation page
            localStorage.setItem('lastAppliedSponsor', formData.sponsor);
            
            // Navigate to confirmation page
            navigate('/user/application-confirmation', { 
                state: { sponsor: formData.sponsor } 
            });
        } catch (err) {
            console.error("Error processing application:", err);
            setError(err.message || 'Error submitting application. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate('/user/landing'); // Return to landing page on cancel
    };

    return (
        <div className="driver-application-container">
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

            <h2>Driver Application Form</h2>
            
            {loading && <div className="loading-message">Loading your information...</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>First Name</label>
                    <input 
                        type="text" 
                        name="firstname" 
                        value={formData.firstname} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input 
                        type="text" 
                        name="lastname" 
                        value={formData.lastname} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                        type="text" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        placeholder="(xxx) xxx-xxxx" 
                    />
                </div>

                <div className="form-group">
                    <label>Select Sponsor Organization</label>
                    <select 
                        name="sponsor" 
                        value={formData.sponsor} 
                        onChange={handleChange} 
                        required
                    >
                        <option value="">Select a sponsor</option>
                        {sponsors.map((sponsor, index) => (
                            <option key={index} value={sponsor}>{sponsor}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Years of Driving Experience</label>
                    <select 
                        name="yearsOfDriving" 
                        value={formData.yearsOfDriving} 
                        onChange={handleChange} 
                        required
                    >
                        <option value="">Select years of experience</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="6-10">6-10 years</option>
                        <option value="10+">10+ years</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Reason for Applying</label>
                    <textarea 
                        name="reason" 
                        value={formData.reason} 
                        onChange={handleChange} 
                        rows="4"
                    />
                </div>

                <div className="form-actions">
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="submit-button">
                        Submit Application
                    </button>
                    <button type="button" className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DriverApplication;