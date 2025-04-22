import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminCreateOrg.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const AdminCreateOrg = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        companyName: '',
        phoneNumber: '',
        email: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        // Check if user is logged in and is an admin
        const storedUserData = JSON.parse(localStorage.getItem('user'));
        
        if (!storedUserData) {
            navigate('/login'); // Redirect to login if not logged in
            return;
        }

    }, [navigate]);

    const formatPhoneNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length > 0) formatted = `(${cleaned.slice(0, 3)}`;
        if (cleaned.length >= 4) formatted += `) ${cleaned.slice(3, 6)}`;
        if (cleaned.length >= 7) formatted += `-${cleaned.slice(6, 10)}`;
        return formatted;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'phoneNumber' ? formatPhoneNumber(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validate form fields
        if (!formData.companyName || !formData.phoneNumber || !formData.email) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        try {
            const storedUserData = JSON.parse(localStorage.getItem('user'));
            
            const response = await axios.post(`${REACT_APP_BASEURL}/admin/create-org`, {
                user_id: storedUserData.id, // Assuming the user ID is stored in localStorage
                companyName: formData.companyName,
                phoneNumber: formData.phoneNumber, 
                email: formData.email
            });
            
            if (response.data.success) {
                setSuccess(response.data.message);
                // Clear form after successful submission
                setFormData({
                    companyName: '',
                    phoneNumber: '',
                    email: ''
                });
            } else {
                setError(response.data.message || 'Error creating organization.');
            }
        } catch (err) {
            console.error("Error creating organization:", err);
            
            // Check if the error is from the backend
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/landing');
    };

    return (
        <>
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
                </div>
            </nav>
        
            <div className="admin-create-org-container">
                <h2>Create Sponsor Organization</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Company Name</label>
                        <input 
                            type="text" 
                            name="companyName" 
                            value={formData.companyName} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                            type="text" 
                            name="phoneNumber" 
                            value={formData.phoneNumber} 
                            onChange={handleChange} 
                            required 
                            placeholder="(xxx) xxx-xxxx" 
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

                    <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Organization'}
                        </button>
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                </form>
            </div>
        </>
    );
};

export default AdminCreateOrg;