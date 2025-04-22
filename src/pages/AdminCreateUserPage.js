import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminCreateUserPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('driver'); //Default to driver
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [message, setMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [zipError, setZipError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [sponsors, setSponsors] = useState([]);
  const [sponsorName, setSponsorName] = useState('');

  const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const user_id = storedUser?.id;

  useEffect(() => {
    // Check if user is admin
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/login');
    }

    // Fetch sponsors list if needed for sponsor user creation
    const fetchSponsors = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/get_sponsor_list`);
        if (response.data.success) {
          setSponsors(response.data.sponsors);
        }
      } catch (error) {
        console.error('Error fetching sponsors:', error);
      }
    };

    fetchSponsors();
  }, [navigate, storedUser, REACT_APP_BASEURL]);

  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
    "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
    "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];  

  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/; // Matches (xxx) xxx-xxxx
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
  const zipRegex = /^\d{5}(-\d{4})?$/; // Matches 5-digit or ZIP+4 (12345 or 12345-6789)
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/; // Regular expression for password complexity: min 8 chars, 1 number, 1 special char, 1 uppercase

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate phone number
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError('Phone number must be in the format (xxx) xxx-xxxx.');
      return;
    } else {
      setPhoneError('');
    }

    // Validate email
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format.');
      return;
    } else {
      setEmailError('');
    }

    // Validate ZIP code
    if (!zipRegex.test(zipCode)) {
      setZipError('Invalid ZIP code. Use 5-digit (12345) or ZIP+4 (12345-6789).');
      return;
    } else {
      setZipError('');
    }

    // Check if passwords match
    if (password !== verifyPassword) {
      setPasswordError('Passwords do not match!');
      return; // Don't submit the form if passwords don't match
    }

    // Check if password meets complexity requirements
    if (!passwordRegex.test(password)) {
      setPasswordError('Password must be at least 8 characters long, include a number, a special character, and an uppercase letter.');
      return; // Don't submit the form if password is invalid
    } else {
      setPasswordError('');
    }

    if (role === 'sponsor' && !sponsorName) {
      setMessage('Please select a sponsor company');
      return;
    }

    const userData = {
      username,
      password,
      firstname,
      lastname,
      phoneNumber,
      email,
      address1,
      address2,
      city,
      state,
      zipCode,
      role,
      user_id
    };

    if (role === 'sponsor') {
      userData.sponsor_name = sponsorName;
    }

    try {
      const response = await axios.post(REACT_APP_BASEURL + '/admin/create', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setMessage(`${role.charAt(0).toUpperCase() + role.slice(1)} user ${username} added successfully! Redirecting to landing page...`);

        setTimeout(() => {
          navigate('/admin/landing');
        }, 2000);
      } else {
        setMessage(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.message || 'There was an error creating the user.'}`);
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
  
  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };

  return (
    <div className="create-user-container">
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

      <form className="create-user-form" onSubmit={handleSubmit}>
        <h2>Create New User</h2>

        <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="state-dropdown" >
                <option value="driver">Driver</option>
                <option value="sponsor">Sponsor</option>
                <option value="admin">Admin</option>
            </select>
        </div>

        {role === 'sponsor' && (
          <div className="form-group">
            <label>Sponsor Company</label>
            <select 
              value={sponsorName} 
              onChange={(e) => setSponsorName(e.target.value)} 
              required
              className="state-dropdown"
            >
              <option value="">Select a sponsor</option>
                {sponsors.map((sponsorName, index) => (
                    <option key={index} value={sponsorName}>{sponsorName}</option>
                ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>First Name</label>
          <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="text" value={phoneNumber} onChange={handlePhoneNumberChange} required />
          {phoneError && <p className="error-message">{phoneError}</p>}
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {emailError && <p className="error-message">{emailError}</p>}
        </div>

        <div className="form-group">
          <label>Address Line 1</label>
          <input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Address Line 2</label>
          <input type="text" value={address2} onChange={(e) => setAddress2(e.target.value)} />
        </div>

        <div className="form-group">
          <label>City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} required className="state-dropdown" >
            <option value="">Select a state</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Zip Code</label>
          <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
          {zipError && <p className="error-message">{zipError}</p>}
        </div>

        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Verify Password</label>
          <input type={showPassword ? 'text' : 'password'} value={verifyPassword} onChange={(e) => setVerifyPassword(e.target.value)} required />
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" id="showPassword" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
          <label htmlFor="showPassword">Show password</label>
        </div>

        {passwordError && <p className="error-message">{passwordError}</p>}

        <div className="button-group">
          <button type="submit" className="submit-button">Create Account</button>
          <button type="button" className="cancel-button" onClick={() => navigate('/admin/landing')}>Cancel</button>
        </div>

        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
}

export default AdminCreateUserPage;