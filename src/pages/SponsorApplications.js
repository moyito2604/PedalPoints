import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SponsorUserList.css';

function SponsorApplications() {
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const navigate = useNavigate();
  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
  
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // Default filter
  const [sponsorId, setSponsorId] = useState(null);
  const [SponsorReason, setSponsorReason] = useState(''); // State for reason input
  const [selectedApplication, setSelectedApplication] = useState(null); // Track selected application for decision
  const [action, setAction] = useState(null); // Track action (accept or reject)

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

    const fetchSponsorId = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/applications`, {
          params: { user_id: storedUser.id, status: statusFilter }
        });

        if (response.data.success) {
          setApplications(response.data.applications);
          if (response.data.applications.length > 0) {
            setSponsorId(response.data.applications[0].SponsorID);
          }
        } else {
          console.error('Error fetching applications:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };

    fetchSponsorId();
  }, [statusFilter, REACT_APP_BASEURL, storedUser, navigate]);

  const handleLogout = () => {
    // Clear the stored user data and redirect to login
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleDecision = (app, action) => {
    setSelectedApplication(app); // Set selected application when an action is triggered
    setAction(action); // Store the action (accept or reject)
    setSponsorReason(''); // Clear previous reason
  };

  const handleConfirmDecision = async () => {
    if (!SponsorReason.trim()) {
      alert("Please provide a reason for your decision.");
      return;
    }

    const { UserID } = selectedApplication;
    try {
      const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/applications/respond`, {
        driver_id: UserID,
        sponsor_id: sponsorId,
        action: action, // Pass the action (accept/reject)
        reason: SponsorReason // Pass the reason for acceptance or rejection
      });

      if (response.data.success) {
        // Refresh applications after updating status
        setApplications((prevApps) =>
          prevApps.map((app) =>
            app.UserID === UserID ? { ...app, DriverStatus: action === "accept" ? 2 : 0 } : app
          )
        );
        setSelectedApplication(null); // Reset selected application
        setAction(null); // Reset action
      } else {
        console.error("Error updating application:", response.data.message);
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

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
        <h2>Driver Applications</h2>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <label style={{ marginRight: '10px' }}>Filter Applications: </label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="pending">Pending Only</option>
            <option value="all">All Applications</option>
          </select>
        </div>

        {applications.length > 0 ? (
          <table className="sponsor-driver-list-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Experience</th>
                <th>Reason for Applying</th>
                <th>Status</th>
                <th>Actions</th>
                {statusFilter === "all" && <th>Sponsor Notes</th>}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.UserID}>
                  <td data-label="Name">{app.UserFName} {app.UserLName}</td>
                  <td data-label="Username">{app.Username}</td>
                  <td data-label="Email">{app.UserEmail}</td>
                  <td data-label="Phone">{app.UserPhone}</td>
                  <td data-label="Experience">{app.DriverExp} years</td>
                  <td data-label="Reason">{app.DriverReason}</td>
                  <td data-label="Status">
                    {app.DriverStatus === 0 ? "Rejected" : app.DriverStatus === 1 ? "Pending" : "Accepted"}
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="nav-button"
                        onClick={() => handleDecision(app, "accept")} 
                        disabled={app.DriverStatus === 2}
                        style={{ 
                          backgroundColor: app.DriverStatus === 2 ? '#cccccc' : '#2196f3',
                          padding: '5px 10px',
                          fontSize: '12px'
                        }}
                      >
                        Accept
                      </button>
                      <button 
                        className="nav-button"
                        onClick={() => handleDecision(app, "reject")} 
                        disabled={app.DriverStatus === 0}
                        style={{ 
                          backgroundColor: app.DriverStatus === 0 ? '#cccccc' : '#f44336',
                          padding: '5px 10px',
                          fontSize: '12px'
                        }}
                      >
                        Reject
                      </button>
                    </div>

                    {/* Show reason input and confirm button when an action is selected */}
                    {selectedApplication && selectedApplication.UserID === app.UserID && (
                      <div style={{ marginTop: '10px' }}>
                        <textarea
                          placeholder="Enter reason for accepting/rejecting"
                          value={SponsorReason}
                          onChange={(e) => setSponsorReason(e.target.value)}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          onClick={handleConfirmDecision}
                          style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            borderRadius: '4px'
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </td>
                  {statusFilter === "all" && <td data-label="SponsorReason">{app.SponsorReason}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            fontSize: '16px',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            marginTop: '20px'
          }}>
            {statusFilter === 'pending' ? 'No pending applications' : 'No applications available'}
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorApplications;