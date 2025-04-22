import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ApplicationStatusList.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const ApplicationStatusList = () => {
  const [applicationStatuses, setApplicationStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  useEffect(() => {
    const fetchApplicationStatuses = async () => {
      try {
        setIsLoading(true);
        // Get user data from localStorage
        const storedUserData = JSON.parse(localStorage.getItem('user'));
        
        if (!storedUserData || !storedUserData.username) {
          setError('User data not found');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${REACT_APP_BASEURL}/users/applications/${storedUserData.username}`);
        
        if (response.data.success) {
          setApplicationStatuses(response.data.applications);
        } else {
          setError("Failed to fetch application statuses: " + response.data.message);
          console.error("Failed to fetch application statuses:", response.data.message);
        }
      } catch (error) {
        setError("Error loading applications");
        console.error("Error fetching application statuses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationStatuses();
  }, []);

  // Status indicator color mapping
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
      default:
        return 'bg-yellow-500';
    }
  };

  // Render the content based on the state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your applications...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p>Something went wrong while loading your applications.</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      );
    }

    if (!applicationStatuses || applicationStatuses.length === 0) {
      return (
        <div className="empty-status-message">
          <p>You haven't submitted any applications yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Apply to sponsor programs to see your application statuses here.
          </p>
        </div>
      );
    }

    return (
      <div className="application-list">
        {applicationStatuses.map((app, index) => (
          <div key={index} className="application-card">
            <div className="application-header">
              <div className="company-name">{app.SponsorCompanyName}</div>
              <div className={`status-indicator ${getStatusColor(app.ApplicationStatus)}`}>
                {app.ApplicationStatus}
              </div>
            </div>
            
            {app.ApplicationReason && (
              <div className="application-reason">
                <p className="reason-label">Feedback:</p>
                <p className="reason-text">{app.ApplicationReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
	<>
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

	  <div className="applications-wrapper">
	  <div className="application-status-container">
		  <h2 className="application-status-title">Application Statuses</h2>
		  {renderContent()}
	  </div>
	  </div>
	</>
  );
};

export default ApplicationStatusList;