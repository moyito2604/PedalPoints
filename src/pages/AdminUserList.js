import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminUserList.css';

const AdminUserList = () => {
  const navigate = useNavigate();
  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${REACT_APP_BASEURL}/admin/users`, {
          params: { admin_id: storedUser.id }
        });

        if (response.data.success) {
          const filteredUsers = response.data.users.filter(
            user => user.UserID !== storedUser.id
          );
          setUsers(filteredUsers);
        } else {
          setError('Error fetching users: ' + response.data.message);
          console.error('Error fetching users:', response.data.message);
        }
      } catch (error) {
        setError('Error fetching users: ' + error.message);
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [REACT_APP_BASEURL, navigate, storedUser]);

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

  const getUserType = (user) => {
    if (user.isDriver) return 'Driver';
    if (user.isSponsor) return 'Sponsor';
    if (user.isAdmin) return 'Admin';
    return 'Unknown';
  };

  const handleEditUser = (userId, userType) => {
    navigate(`/admin/edit-user/${userId}/${userType.toLowerCase()}`);
  };

  const handleDeactivateUser = async (userId) => {
    try {
          const response = await axios.post(`${REACT_APP_BASEURL}/admin/deactivate-user`, {
            UserID: userId,
          });

          if (response.data.success) {
            // Refresh user after updating status
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.UserID === userId ? { ...user, UserIsActive: 0 } : user
              )
            );
          } else {
            console.error("Error updating application:", response.data.message);
          }

        } catch (error) {
          console.error("Error deactivating user:", error);
        }
  };
  

  const handleReactivateUser = async (userId) => {
    try {
      const response = await axios.post(`${REACT_APP_BASEURL}/admin/reactivate-user`, {
        UserID: userId,
      });

      if (response.data.success) {
        // Refresh user after updating status
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.UserID === userId ? { ...user, UserIsActive: 1 } : user
          )
        );
      } else {
        console.error("Error updating application:", response.data.message);
      }

    } catch (error) {
      console.error("Error reactivating user:", error);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filter by user type
    if (activeTab === 'drivers') {
      filtered = users.filter(user => user.isDriver);
    } else if (activeTab === 'sponsors') {
      filtered = users.filter(user => user.isSponsor);
    } else if (activeTab === 'admins') {
      filtered = users.filter(user => user.isAdmin);
    }
    
    // Filter by search term
    return filtered.filter(user =>
      `${user.UserFName} ${user.UserLName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.UserEmail && user.UserEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm, activeTab]);

  if (loading) {
    return <div className="loading-container">Loading users...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

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

          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
              Log out
            </button>
          </div>
        </div>
      </nav>
      <div className="admin-user-list-container">
        <h2>User Management</h2>
        
        <div className="tab-navigation">
          <button 
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            All Users
          </button>
          <button 
            className={activeTab === 'drivers' ? 'active' : ''}
            onClick={() => setActiveTab('drivers')}
          >
            Drivers
          </button>
          <button 
            className={activeTab === 'sponsors' ? 'active' : ''}
            onClick={() => setActiveTab('sponsors')}
          >
            Sponsors
          </button>
          <button 
            className={activeTab === 'admins' ? 'active' : ''}
            onClick={() => setActiveTab('admins')}
          >
            Admins
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder={`Search users by name, username, or email...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="user-count">
          Showing {filteredUsers.length} {activeTab !== 'all' ? activeTab : 'users'}
        </div>

        <table className="admin-user-list-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const userType = getUserType(user);
              return (
                <tr key={user.UserID}>
                  <td data-label="Name">{user.UserFName} {user.UserLName}</td>
                  <td data-label="Username">{user.Username}</td>
                  <td data-label="Email">{user.UserEmail}</td>
                  <td data-label="Phone">{user.UserPhone}</td>
                  <td data-label="Type">{userType}</td>
                  <td data-label="Address" style={{ whiteSpace: 'pre-line' }}>{formatAddress(user)}</td>
                  <td data-label="Status">{user.UserIsActive ? "Active" : "Inactive"}</td>
                  <td data-label="Actions">
                    {user.UserIsActive === 1 && (
                      <button 
                        onClick={() => handleEditUser(user.UserID, userType)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                    )}
                    {user.UserIsActive === 1 && (
                      <button
                        onClick={() => handleDeactivateUser(user.UserID)}
                        className="deactivate-button"
                      >
                        Deactivate
                      </button>
                    )}
                    {user.UserIsActive !== 1 && (
                      <button
                        onClick={() => handleReactivateUser(user.UserID)}
                        className="reactivate-button"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminUserList;