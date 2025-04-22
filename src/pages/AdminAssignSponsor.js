import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminAssignSponsor.css';

function AdminAssignSponsor() {
    const navigate = useNavigate()
    const [drivers, setDrivers] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedSponsor, setSelectedSponsor] = useState('');
    const [message, setMessage] = useState('');

    const AwardIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
    );

    const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

    const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

    useEffect(() => {
        if (!storedUser || storedUser.role !== 'admin') {
            navigate('/login');
        }

    const fetchData = async () => {
      try {
        const res = await axios.get(`${REACT_APP_BASEURL}/admin/assign-sponsor`);
        setDrivers(res.data.drivers);
        setSponsors(res.data.sponsors);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [REACT_APP_BASEURL, navigate, storedUser]);

  const handleAssign = async () => {
    if (!selectedDriver || !selectedSponsor) {
      setMessage('Please select both a driver and a sponsor.');
      return;
    }

    try {
      const res = await axios.post(`${REACT_APP_BASEURL}/admin/assign-sponsor`, {
        driver_id: selectedDriver,
        sponsor_id: selectedSponsor,
      });

      setMessage(res.data.message || 'Sponsor assigned successfully!');
    } catch (err) {
      console.error('Error assigning sponsor:', err);
      setMessage('Error assigning sponsor.');
    }
  };

  return (
    <div className="admin-assign-sponsor">
      <nav className="admin-assign-sponsor-nav bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
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
    
      <div className="assign-sponsor-container">
        <h2>Assign Sponsor to Driver</h2>

        <div className="assign-sponsor-mb-3">
          <label className="assign-sponsor-form-label">Select Driver:</label>
          <select
            className="assign-sponsor-form-select"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            <option value="">-- Select Driver --</option>
            {drivers.map((driver) => (
              <option key={driver.UserID} value={driver.UserID}>
                {driver.UserFName} {driver.UserLName} ({driver.Username})
              </option>
            ))}
          </select>
        </div>

        <div className="assign-sponsor-mb-3">
          <label className="assign-sponsor-form-label">Select Sponsor:</label>
          <select
            className="assign-sponsor-form-select"
            value={selectedSponsor}
            onChange={(e) => setSelectedSponsor(e.target.value)}
          >
            <option value="">-- Select Sponsor --</option>
            {sponsors.map((sponsor) => (
              <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                {sponsor.SponsorCompanyName}
              </option>
            ))}
          </select>
        </div>

        <button className="assign-sponsor-btn assign-sponsor-btn-primary" onClick={handleAssign}>
          Assign Sponsor
        </button>

        {message && <div className="assign-sponsor-alert assign-sponsor-alert-info">{message}</div>}
      </div>
    </div>
  );
};

export default AdminAssignSponsor;