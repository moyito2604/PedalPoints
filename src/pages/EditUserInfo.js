import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditUserInfo.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
    "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
    "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

const EditUserInfo = ({ type }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState('driver');
    const [storedUserData, setStoredUserData] = useState(null);
    const [newValue, setNewValue] = useState(
        type === "shipping" ? { address: "", address2: "", city: "", state: "", zipCode: "" } : 
        type === "name" ? { fname: "", lname: "" } : ""
    );
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Get username from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setUsername(userData.username);
            setStoredUserData(userData);
            setUserRole(userData.role);
            
            // Pre-fill name fields if editing name
            if (type === "name") {
                setNewValue({
                    fname: userData.firstname || "",
                    lname: userData.lastname || ""
                });
            }
        } else {
            navigate('/login'); // Redirect to login if no user data is found
        }
    }, [navigate, type]);

    const navigateByRole = () => {
        if (userRole === 'sponsor') {
            navigate('/sponsor/profile');
        } else if (userRole === 'admin') {
            navigate('/admin/profile');
        } else {
            navigate('/user/profile');
        }
    };

    const handleSubmit = async () => {
        if (!username) {
            setMessage("User information not available. Please login again.");
            return;
        }

        try {
            let endpoint = "";
            let body = { username };

            // Prepare the request body based on the type of edit
            if (type === "phone") {
                endpoint = `${REACT_APP_BASEURL}/user/modify/phone`;
                body.new_phone = newValue;
            } else if (type === "email") {
                endpoint = `${REACT_APP_BASEURL}/user/modify/email`;
                body.new_email = newValue;
            } else if (type === "shipping") {
                endpoint = `${REACT_APP_BASEURL}/user/modify/shipping-address`;
                body.new_address = newValue.address;
                body.new_address2 = newValue.address2;
                body.new_city = newValue.city;
                body.new_state = newValue.state;
                body.new_zipCode = newValue.zipCode;
            } else if (type === "bio") {
                endpoint = `${REACT_APP_BASEURL}/user/modify/bio`;
                body.new_bio = newValue;
            } else if (type === "name") {
                endpoint = `${REACT_APP_BASEURL}/user/modify/name`;
                body.new_fname = newValue.fname;
                body.new_lname = newValue.lname;
            } else if (type === "truck-info") {
                endpoint = `${REACT_APP_BASEURL}/user/modify/truck-info`;
                body.new_truck_info = newValue;
            }

            // Send request to the backend using axios
            const response = await axios.post(endpoint, body);
            
            if (response.data.success) {
                const successField = getTitle();
                setMessage(response.data.message || `${successField} updated successfully!`);
                
                // Update local storage if name was changed
                if (type === "name" && storedUserData) {
                    const updatedUserData = {...storedUserData};
                    if (newValue.fname) updatedUserData.firstname = newValue.fname;
                    if (newValue.lname) updatedUserData.lastname = newValue.lname;
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                }
                
                setTimeout(() => navigateByRole(), 2000);
            } else {
                setMessage(response.data.message || "Failed to update information.");
            }
        } catch (error) {
            console.error("Error updating information:", error);
            setMessage("An error occurred while updating information.");
        }
    };

    const handleCancel = () => {
        navigateByRole();
    };

    const getTitle = () => {
        switch (type) {
            case "phone": return "Phone Number";
            case "email": return "Email";
            case "shipping": return "Shipping Address";
            case "bio": return "Bio";
            case "name": return "Name";
            case "truck-info": return "Truck Information";
            default: return "Information";
        }
    };

    const getPlaceholder = () => {
        switch (type) {
            case "phone": return "New Phone Number";
            case "email": return "New Email";
            case "bio": return "New Bio";
            case "truck-info": return "Truck Make, Model, Year, etc.";
            default: return "New Value";
        }
    };

    const formatPhoneNumber = (value) => {
        // Remove all non-numeric characters
        const cleaned = value.replace(/\D/g, '');
      
        // Format the cleaned number as (xxx) xxx-xxxx
        let formatted = '';
        if (cleaned.length > 0) formatted = `(${cleaned.slice(0, 3)}`;
        if (cleaned.length >= 4) formatted += `) ${cleaned.slice(3, 6)}`;
        if (cleaned.length >= 7) formatted += `-${cleaned.slice(6, 10)}`;
      
        return formatted;
    };

    return (
        <div className="edit-page-container">
            <div className="edit-form-container">
                <div className="edit-header">
                    <h2>Edit {getTitle()}</h2>
                </div>

                <div className="edit-form">
                    {/* Conditional rendering for different form types */}
                    {type === "shipping" ? (
                        <div className="shipping-inputs">
                            <div className="form-group">
                                <label>Street Address <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Street Address Line 1"
                                    value={newValue.address}
                                    onChange={(e) => setNewValue({ ...newValue, address: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Address Line 2 <span className="optional">(optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="Apt, Suite, Building (optional)"
                                    value={newValue.address2}
                                    onChange={(e) => setNewValue({ ...newValue, address2: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>City <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={newValue.city}
                                    onChange={(e) => setNewValue({ ...newValue, city: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>State <span className="required">*</span></label>
                                    <select 
                                        value={newValue.state} 
                                        onChange={(e) => setNewValue({ ...newValue, state: e.target.value })} 
                                        required
                                        className="state-dropdown"
                                    >
                                        <option value="">Select a state</option>
                                        {states.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Zip Code <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Zip Code"
                                        value={newValue.zipCode}
                                        onChange={(e) => setNewValue({ ...newValue, zipCode: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    ) : type === "name" ? (
                        <div className="name-inputs">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={newValue.fname}
                                    onChange={(e) => setNewValue({ ...newValue, fname: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={newValue.lname}
                                    onChange={(e) => setNewValue({ ...newValue, lname: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>{getTitle()}</label>
                            <input
                                type={type === "email" ? "email" : "text"}
                                placeholder={getPlaceholder()}
                                value={type === "phone" ? formatPhoneNumber(newValue) : newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="form-actions">
                        <button className="submit-button" onClick={handleSubmit}>Update {getTitle()}</button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                    
                    {message && (
                        <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditUserInfo;