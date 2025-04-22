import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SponsorPoints.css';

function SponsorPoints() {
    const navigate = useNavigate();
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionReason, setTransactionReason] = useState('');
    const [pointValue, setPointValue] = useState('');
    const [newPointValue, setNewPointValue] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [presets, setPresets] = useState([]);
    const [newPresetValue, setNewPresetValue] = useState('');
    const [newPresetReason, setNewPresetReason] = useState('');

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

    const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const sponsorId = storedUser?.id;

    useEffect(() => {
        if (!storedUser || storedUser.role !== 'sponsor') {
            navigate('/login');
          }

        const fetchPointValue = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/points`, {
                    params: { user_id: sponsorId }
                });

                if (response.data.point_value) {
                    setPointValue(response.data.point_value);
                }
            } catch (error) {
                setError('Failed to load point value.');
            }
        };

        const fetchDrivers = async () => {
            try {

                const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/drivers`, {
                    params: { user_id: sponsorId }
                });

                if (response.data.drivers) {
                    setDrivers(response.data.drivers);
                }
            } catch (error) {
                setError('Failed to load drivers.');
            }
        };

        const fetchPresets = async () => {
            try {
              const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/presets`, {
                params: { user_id: sponsorId }
              });
              if (response.data.success) {
                setPresets(response.data.presets);
              }
            } catch (error) {
              console.error("Error fetching presets:", error);
            }
          };

        fetchPointValue();
        fetchDrivers();
        fetchPresets();
    }, [storedUser, navigate, REACT_APP_BASEURL, sponsorId]);

    const handleTransactionSubmit = async (event) => {
        event.preventDefault();

        if (!transactionAmount || !transactionReason || !selectedDriver) {
            setError('All fields are required.');
            return;
        }

        try {

            // Making the API call to create a transaction
            const response = await axios.post(
                `${REACT_APP_BASEURL}/sponsor/points/transaction`,
                {
                    driver_relation_id: selectedDriver, // Driver selected from the list
                    transaction_amount: parseInt(transactionAmount),
                    transaction_reason: transactionReason,
                }
            );

            if (response.data.message) {
                setMessage(response.data.message);
                setTransactionAmount('');
                setTransactionReason('');
            }
        } catch (error) {
            setError('There was an error creating the transaction.');
        }
    };

    const handlePointValueChange = async () => {
        if (!newPointValue) {
            setError('Please enter a valid new point value.');
            return;
        }

        try {

            const response = await axios.post(
                `${REACT_APP_BASEURL}/sponsor/points`,
                {
                    user_id: sponsorId,
                    new_point_value: parseFloat(newPointValue),
                }
            );

            if (response.data.message) {
                setMessage(response.data.message);
                setPointValue(newPointValue);
                setNewPointValue('');
            }
        } catch (error) {
            setError('There was an error updating the point value.');
        }
    };

    const handleAddPreset = async () => {
        if (!newPresetValue || !newPresetReason) {
          alert("Please enter both a value and a reason for the preset.");
          return;
        }
      
        try {
          const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/presets/add`, {
            user_id: sponsorId,
            point_value: newPresetValue,
            reason: newPresetReason
          });
      
          if (response.data.success) {
            setPresets([...presets, { PresetPointValue: newPresetValue, PresetReason: newPresetReason }]);
            setNewPresetValue('');
            setNewPresetReason('');
          }
        } catch (error) {
          console.error("Error adding preset:", error);
        }
      };

    const handleUsePreset = (preset) => {
        setTransactionAmount(preset.PresetPointValue);
        setTransactionReason(preset.PresetReason);
    };

    const handleDeletePreset = async (presetId) => {
        try {
          const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/presets/delete`, {
            preset_id: presetId
          });
      
          if (response.data.success) {
            setPresets(presets.filter(p => p.PresetID !== presetId));
          }
        } catch (error) {
          console.error("Error deleting preset:", error);
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
                </div>
            </nav>
            <div className="sponsor-points-container">
                <h2>Manage Points</h2>
                
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <div className="section point-value-section">
                    <h3>Current Point Value: ${pointValue}</h3>
                    <div className="point-value-update">
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={newPointValue}
                            onChange={(e) => setNewPointValue(e.target.value)}
                            placeholder="Enter new point value"
                        />
                        <button className="primary-button" onClick={handlePointValueChange}>Update Point Value</button>
                    </div>
                </div>

                <div className="section">
                    <h3>Create Transaction</h3>
                    <form onSubmit={handleTransactionSubmit} className="transaction-form">
                        <div className="driver-selection">
                            <label>Select a Driver for Transaction</label>
                            <select
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                            >
                                <option value="">Select a driver</option>
                                {drivers.map(driver => (
                                    <option key={driver.DriverRelationID} value={driver.DriverRelationID}>
                                        {driver.UserFName} {driver.UserLName} {"("}{driver.Username}{")"} - {driver.DriverPoints} points
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Transaction Amount (Points)</label>
                            <input
                                type="number"
                                value={transactionAmount}
                                onChange={(e) => setTransactionAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Transaction Reason</label>
                            <textarea
                                value={transactionReason}
                                onChange={(e) => setTransactionReason(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="primary-button">Submit Transaction</button>
                    </form>
                </div>

                <div className="section presets-section">
                    <h3>Transaction Presets</h3>

                    {presets.length > 0 ? (
                        <ul className="presets-list">
                            {presets.map((preset) => (
                                <li key={preset.PresetID} className="preset-item">
                                    <span>{preset.PresetPointValue} points - {preset.PresetReason}</span>
                                    <div className="preset-actions">
                                        <button className="primary-button" onClick={() => handleUsePreset(preset)}>Use</button>
                                        <button className="danger-button" onClick={() => handleDeletePreset(preset.PresetID)}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No presets available.</p>
                    )}

                    <div className="add-preset-form">
                        <input
                            type="number"
                            placeholder="Points"
                            value={newPresetValue}
                            onChange={(e) => setNewPresetValue(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Reason"
                            value={newPresetReason}
                            onChange={(e) => setNewPresetReason(e.target.value)}
                        />
                        <button className="primary-button" onClick={handleAddPreset}>Add Preset</button>

                    </div>
                </div>
            </div>
        </>
    );
}

export default SponsorPoints;