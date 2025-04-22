import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SponsorUserList.css';

const SponsorUserList = () => {
  const navigate = useNavigate();
  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
  const [drivers, setDrivers] = useState([]);
  const [removedDrivers, setRemovedDrivers] = useState([]);
  const [sponsorUsers, setSponsorUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('accepted');
  const [viewMode, setViewMode] = useState('drivers'); // 'drivers' or 'sponsors'
  const [sponsorID, setSponsorID] = useState(null);
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'sponsor') {
      navigate('/login');
      return;
    }

    const fetchSponsorDetails = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/get-sponsor-details/${storedUser.username}`);
        if (response.data.success) {
          setSponsorID(response.data.sponsorID);
        } else {
          console.error("Failed to fetch sponsor details:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching sponsor details:", error);
      }
    };

    fetchSponsorDetails();
  }, [REACT_APP_BASEURL, navigate, storedUser]);

  useEffect(() => {
    if (!sponsorID) return;

    const fetchDrivers = async () => {
      try {
        // Fetch accepted drivers
        const acceptedResponse = await axios.get(`${REACT_APP_BASEURL}/sponsor/drivers`, {
          params: { 
            user_id: storedUser.id,
            status: 2
          }
        });

        // Fetch removed drivers
        const removedResponse = await axios.get(`${REACT_APP_BASEURL}/sponsor/drivers`, {
          params: { 
            user_id: storedUser.id,
            status: 3
          }
        });

        if (acceptedResponse.data.success) {
          setDrivers(acceptedResponse.data.drivers);
        } else {
          console.error('Error fetching accepted drivers:', acceptedResponse.data.message);
        }

        if (removedResponse.data.success) {
          setRemovedDrivers(removedResponse.data.drivers);
        } else {
          console.error('Error fetching removed drivers:', removedResponse.data.message);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };

    const fetchSponsorUsers = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/sponsor-users/${sponsorID}`);
        
        if (response.data.success) {
          const filteredUsers = response.data.sponsors.filter(
            user => user.UserID !== storedUser.id
          );
          setSponsorUsers(filteredUsers);
        } else {
          console.error('Error fetching sponsor users:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching sponsor users:', error);
        
        setSponsorUsers([]);
      }
    };

    fetchDrivers();
    fetchSponsorUsers();
  }, [REACT_APP_BASEURL, sponsorID, storedUser]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatAddress = (user) => {
    const parts = [];
    if (user.UserAddress) parts.push(user.UserAddress);
    if (user.UserSecAddress) parts.push(user.UserSecAddress);
    
    const cityStateZip = [];
    if (user.UserCity) cityStateZip.push(user.UserCity);
    if (user.UserState) cityStateZip.push(user.UserState);
    if (user.UserZipCode) cityStateZip.push(user.UserZipCode);
    
    if (cityStateZip.length > 0) parts.push(cityStateZip.join(', '));
    
    return parts.join('\n');
  };

  const handleRemoveDriver = async (driverId) => {
    try {
      const response = await axios.put(`${REACT_APP_BASEURL}/sponsor/update-driver-status/${driverId}`, {
        sponsor_user_id: storedUser.id,
        new_status: 3
      });

      if (response.data.success) {
        // Find the driver to be removed
        const driverToRemove = drivers.find(driver => driver.UserID === driverId);
        
        // Update state
        setDrivers(drivers.filter(driver => driver.UserID !== driverId));
        setRemovedDrivers([...removedDrivers, driverToRemove]);
      } else {
        console.error('Error removing driver:', response.data.message);
      }
    } catch (error) {
      console.error('Error removing driver:', error);
    }
  };

  const handleReinstateDriver = async (driverId) => {
    try {
      const response = await axios.put(`${REACT_APP_BASEURL}/sponsor/update-driver-status/${driverId}`, {
        sponsor_user_id: storedUser.id,
        new_status: 2
      });

      if (response.data.success) {
        // Find the driver to be reinstated
        const driverToReinstate = removedDrivers.find(driver => driver.UserID === driverId);
        
        // Update state
        setRemovedDrivers(removedDrivers.filter(driver => driver.UserID !== driverId));
        setDrivers([...drivers, driverToReinstate]);
      } else {
        console.error('Error reinstating driver:', response.data.message);
      }
    } catch (error) {
      console.error('Error reinstating driver:', error);
    }
  };
  
  const handleEditDriver = async (driverID) => {
    navigate(`/sponsor/edit-user/${driverID}/driver`);
  };

  const handleEditSponsor = async (sponsorID) => {
    navigate(`/sponsor/edit-user/${sponsorID}/sponsor`)
  };

  const filteredDrivers = useMemo(() => {
    const currentDrivers = activeTab === 'accepted' ? drivers : removedDrivers;
    return currentDrivers.filter(driver =>
      `${driver.UserFName} ${driver.UserLName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.Username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [drivers, removedDrivers, searchTerm, activeTab]);

  const filteredSponsors = useMemo(() => {
    return sponsorUsers.filter(sponsor =>
      `${sponsor.UserFName} ${sponsor.UserLName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.Username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sponsorUsers, searchTerm]);

  const renderDriverTable = (currentDrivers, isRemoved = false) => (
    <table className="sponsor-driver-list-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Bio</th>
          <th>Truck Information</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentDrivers.length > 0 ? (
          currentDrivers.map((driver) => (
            <tr key={driver.UserID}>
              <td data-label="Name">{driver.UserFName} {driver.UserLName}</td>
              <td data-label="Username">{driver.Username}</td>
              <td data-label="Email">{driver.UserEmail}</td>
              <td data-label="Phone">{driver.UserPhone}</td>
              <td data-label="Address" style={{ whiteSpace: 'pre-line' }}>{formatAddress(driver)}</td>
              <td data-label="Bio">{driver.UserBio}</td>
              <td data-label="Truck Information">{driver.DriverTruckInfo}</td>
              <td data-label="Actions">
                {!isRemoved ? (
                  <>
                    <button 
                      onClick={() => handleEditDriver(driver.UserID)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleRemoveDriver(driver.UserID)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleReinstateDriver(driver.UserID)}
                    className="reinstate-button"
                  >
                    Reinstate
                  </button>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="no-data">No drivers found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderSponsorTable = () => (
    <table className="sponsor-driver-list-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Bio</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredSponsors.length > 0 ? (
          filteredSponsors.map((sponsor) => (
            <tr key={sponsor.UserID}>
              <td data-label="Name">{sponsor.UserFName} {sponsor.UserLName}</td>
              <td data-label="Username">{sponsor.Username}</td>
              <td data-label="Email">{sponsor.UserEmail}</td>
              <td data-label="Phone">{sponsor.UserPhone}</td>
              <td data-label="Address" style={{ whiteSpace: 'pre-line' }}>{formatAddress(sponsor)}</td>
              <td data-label="Bio">{sponsor.UserBio}</td>
              <td data-label="Actions">
                <button 
                  onClick={() => handleEditSponsor(sponsor.UserID)}
                  className="edit-button"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="no-data">No sponsor users found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <>
      <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/sponsor/landing')}
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
      <div className="sponsor-driver-list-container">
        <h2>User Management</h2>

        <div className="view-selector">
          <label htmlFor="view-mode">User Type: </label>
          <select 
            id="view-mode" 
            value={viewMode} 
            onChange={(e) => {
              setViewMode(e.target.value);
              // Reset active tab when switching views
              if (e.target.value === 'drivers') {
                setActiveTab('accepted');
              } else {
                setActiveTab('all');
              }
            }}
            className="view-mode-dropdown"
          >
            <option value="drivers">Drivers</option>
            <option value="sponsors">Sponsor Users</option>
          </select>
        </div>

        {viewMode === 'drivers' && (
          <div className="tab-navigation">
            <button 
              className={activeTab === 'accepted' ? 'active' : ''}
              onClick={() => setActiveTab('accepted')}
            >
              Accepted Drivers
            </button>
            <button 
              className={activeTab === 'removed' ? 'active' : ''}
              onClick={() => setActiveTab('removed')}
            >
              Removed Drivers
            </button>
          </div>
        )}

        <div className="search-container">
          <input
            type="text"
            placeholder={
              viewMode === 'drivers' 
                ? `Search by name or username (${activeTab === 'accepted' ? 'Accepted' : 'Removed'} Drivers)...`
                : 'Search by name or username (Sponsor Users)...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {viewMode === 'drivers' && activeTab === 'accepted' && renderDriverTable(filteredDrivers)}
        {viewMode === 'drivers' && activeTab === 'removed' && renderDriverTable(filteredDrivers, true)}
        {viewMode === 'sponsors' && renderSponsorTable()}
      </div>
    </>
  );
}

export default SponsorUserList;