import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './About.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

function About() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  const TeamIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

  const VersionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );

  const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  useEffect(() => {
    setLoading(true);
    axios.get(REACT_APP_BASEURL+"/about")
      .then((response) => {
        const res = response.data;
        setProfileData({
          team: res.Team,
          version: res.Version,
          date: res.Release,
          name: res.Name,
          description: res.Description
        });
        setLoading(false);
      })
      .catch((error) => {
        if (error.response) {
          console.error(error.response);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center mr-10 focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <AwardIcon className="text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
            </button>
            
            <div className="hidden md:flex space-x-6">
              <button onClick={() => navigate('/about')} className="text-green-600 font-medium">About Us</button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/user/create')} className="px-4 py-2 text-gray-600 hover:text-green-600">Sign Up</button>
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">About <span className="text-green-500">Pedal Points</span></h1>
            <div className="h-1 w-24 bg-green-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn more about our mission to make roads safer and reward responsible drivers.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Data Section */}
      {loading ? (
        <div className="py-12 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto text-center">
            <div className="loading-spinner"></div>
            <p className="text-gray-600 mt-4">Loading information...</p>
          </div>
        </div>
      ) : profileData ? (
        <div className="py-12 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">{profileData.name}</h2>
                <div className="description-container max-w-4xl mx-auto mb-8">
                  <p className="text-lg text-gray-600">{profileData.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <TeamIcon className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Team Number</p>
                      <p className="text-xl font-semibold text-gray-800">{profileData.team}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <VersionIcon className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Version</p>
                      <p className="text-xl font-semibold text-gray-800">{profileData.version}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <CalendarIcon className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Release Date</p>
                      <p className="text-xl font-semibold text-gray-800">{profileData.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-red-500">Failed to load about information. Please try again later.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default About;