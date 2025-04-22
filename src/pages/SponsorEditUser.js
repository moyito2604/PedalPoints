import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SponsorEditUser.css';

const SponsorEditUser = () => {
  const { userId, userType } = useParams();
  const navigate = useNavigate();
  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  const [userData, setUserData] = useState({
    UserFName: '',
    UserLName: '',
    Username: '',
    UserEmail: '',
    UserPhone: '',
    UserBio: '',
    UserAddress: '',
    UserSecAddress: '',
    UserCity: '',
    UserState: '',
    UserZipCode: '',
    UserPFP: ''
  });
  
  // Additional fields for driver type
  const [driverData, setDriverData] = useState({
    DriverTruckInfo: ''
  });

  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
    "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
    "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'sponsor') {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        let response;

        if (userType === 'driver') {
          response = await axios.get(`${REACT_APP_BASEURL}/sponsor/driver/${userId}`, {
            params: { user_id: storedUser.id }
          });

          if (response.data.success) {
            setUserData(response.data.driver);
            
            if (response.data.driver.DriverTruckInfo) {
              setDriverData({
                DriverTruckInfo: response.data.driver.DriverTruckInfo
              });
            }
          }
        } else if (userType === 'sponsor') {
          response = await axios.get(`${REACT_APP_BASEURL}/sponsor/sponsor-user/${userId}`, {
            params: { user_id: storedUser.id }
          });

          if (response.data.success) {
            setUserData(response.data.sponsor);
          }
        } else {
          setError('Invalid user type specified');
          setLoading(false);
          return;
        }

        if (response.data.success) {
          // If the user has a profile picture, set the preview URL
          if (response.data.driver?.Username || response.data.sponsor?.Username) {
            const username = response.data.driver?.Username || response.data.sponsor?.Username;
            setPreviewUrl(`${REACT_APP_BASEURL}/user/profile-picture/${username}`);
          }
        } else {
          setError(`Error fetching ${userType} information: ${response.data.message}`);
        }
      } catch (error) {
        setError(`Error fetching ${userType} information: ${error.message}`);
        console.error(`Error fetching ${userType} information:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [REACT_APP_BASEURL, userId, userType, navigate, storedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Check if the field belongs to driver-specific data
    if (name === 'DriverTruckInfo') {
      setDriverData(prevData => ({
        ...prevData,
        [name]: value
      }));
    } else {
      // Otherwise, it belongs to common user data
      setUserData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
  
    // Format the cleaned number as (xxx) xxx-xxxx
    let formatted = '';
    if (cleaned.length > 0) formatted = `(${cleaned.slice(0, 3)}`;
    if (cleaned.length >= 4) formatted += `) ${cleaned.slice(3, 6)}`;
    if (cleaned.length >= 7) formatted += `-${cleaned.slice(6, 10)}`;
  
    return formatted;
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return true;
    
    try {
      const formData = new FormData();
      formData.append('image', profilePicture);
      formData.append('username', userData.Username);
      
      const response = await axios.post(
        `${REACT_APP_BASEURL}/user/upload/pfp`, 
        formData, 
        { 
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.success;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Error uploading profile picture: ' + error.message);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (profilePicture) {
        const pictureUploaded = await uploadProfilePicture();
        if (!pictureUploaded) {
          setLoading(false);
          return;
        }
      }
      
      let requestData = {
        ...userData,
        sponsor_user_id: storedUser.id
      };
      
      if (userType === 'driver') {
        requestData.driverInfo = driverData;
      }
      
      let endpoint;
      if (userType === 'driver') {
        endpoint = `${REACT_APP_BASEURL}/sponsor/update-driver/${userId}`;
      } else if (userType === 'sponsor') {
        endpoint = `${REACT_APP_BASEURL}/sponsor/update-sponsor/${userId}`;
      }

      const response = await axios.put(endpoint, requestData);

      if (response.data.success) {
        setSuccessMessage(`${userType.charAt(0).toUpperCase() + userType.slice(1)} information updated successfully!`);
        setTimeout(() => {
          navigate('/sponsor/users');
        }, 2000);
      } else {
        setError(`Error updating ${userType} information: ${response.data.message}`);
      }
    } catch (error) {
      setError(`Error updating ${userType} information: ${error.message}`);
      console.error(`Error updating ${userType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/sponsor/users');
  };

  if (loading && !userData.UserFName) {
    return <div className="loading-container">Loading user data...</div>;
  }

  return (
    <div className="sponsor-edit-user-container">
      <h2>Edit {userType.charAt(0).toUpperCase() + userType.slice(1)} Information</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="profile-picture-container">
          <div 
            className="profile-picture-preview" 
            onClick={handleProfilePictureClick}
            style={{ 
              cursor: 'pointer',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '20px',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage: previewUrl ? `url(${previewUrl})` : 'none'
            }}
          >
            {!previewUrl && <span>Click to select image</span>}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePictureChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <p>Click on the image to change profile picture</p>
        </div>
        
        <div className="form-group">
          <label>First Name:</label>
          <input
            type="text"
            name="UserFName"
            value={userData.UserFName || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Last Name:</label>
          <input
            type="text"
            name="UserLName"
            value={userData.UserLName || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            name="Username"
            value={userData.Username || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="UserEmail"
            value={userData.UserEmail || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="tel"
            name="UserPhone"
            value={formatPhoneNumber(userData.UserPhone || '')}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Bio:</label>
          <textarea
            name="UserBio"
            value={userData.UserBio || ''}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        {/* Driver-specific fields */}
        {userType === 'driver' && (
          <div className="form-group">
            <label>Truck Information:</label>
            <textarea
              name="DriverTruckInfo"
              value={driverData.DriverTruckInfo || ''}
              onChange={handleChange}
              rows="4"
            />
          </div>
        )}

        <div className="form-group">
          <label>Primary Address:</label>
          <input
            type="text"
            name="UserAddress"
            value={userData.UserAddress || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Secondary Address:</label>
          <input
            type="text"
            name="UserSecAddress"
            value={userData.UserSecAddress || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City:</label>
            <input
              type="text"
              name="UserCity"
              value={userData.UserCity || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>State:</label>
            <select 
              name="UserState" 
              value={userData.UserState || ''} 
              onChange={handleChange}
            >
              <option value="" disabled>Select a state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Zip Code:</label>
            <input
              type="text"
              name="UserZipCode"
              value={userData.UserZipCode || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="button-group">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default SponsorEditUser;