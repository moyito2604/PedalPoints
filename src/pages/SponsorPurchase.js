import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SponsorPurchase.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const SponsorCatalog = () => {
    const [catalog, setCatalog] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('price_asc');
    const [searchTerm, setSearchTerm] = useState(""); // Added searchTerm state
    const navigate = useNavigate();
    const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
    const userId = storedUserData.id;
    const [successMessage, setSuccessMessage] = useState(""); 


    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    useEffect(() => {
        if (!userId) {
            setError("Sponsor ID not found. Please log in.");
            return;
        }

        const fetchDrivers = async () => {
            try {
                const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/drivers`, { userId });
                setDrivers(response.data);
            } catch (err) {
                setError("Error fetching drivers.");
            }
        };

        fetchDrivers();
    }, [userId]);

    useEffect(() => {
        if (!selectedDriver) {
            setCatalog([]);
            return;
        }

        const fetchCatalog = async () => {
            try {
                const catalogResponse = await axios.post(`${REACT_APP_BASEURL}/sponsor/catalog/get`, {
                    userId,
                    sortBy
                });
                setCatalog(catalogResponse.data);
            } catch (err) {
                setError("Error fetching catalog.");
            }
        };

        fetchCatalog();
    }, [selectedDriver, sortBy, userId]);

    const handleDriverChange = (event) => {
        const driverId = event.target.value;
        if (!driverId) {
            setSelectedDriver(null);
            return;
        }

        const driver = drivers.find(d => d.UserID.toString() === driverId);
        setSelectedDriver(driver || null);
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const addToCart = async (item) => {
        if (!selectedDriver) {
            alert("Please select a driver before adding items to the cart.");
            return;
        }

        try {
            await axios.post(`${REACT_APP_BASEURL}/sponsor/cart/update`, {
                driverId: selectedDriver.UserID,
                item,
                userId
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            setSuccessMessage(`"${item.ProductName}" has been added to your cart successfully!`);
            setTimeout(() => setSuccessMessage(""), 3000);  // Clear the message after 3 seconds
        } catch (error) {
            console.error("Error adding item to cart:", error);
        }
    };

    // Filter catalog based on search term
    const filteredCatalog = catalog.filter((item) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            item.ProductName.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.ProductType.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.ProductArtistName.toLowerCase().includes(lowerCaseSearchTerm)
        );
    });

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
                        <button onClick={() => navigate('/sponsor/cart')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            View Cart
                        </button>
                    </div>
                </div>
            </nav>
            <div className="container">
                <h2>Sponsor Driver Purchase</h2>
                {error && <p className="error-message">{error}</p>}

                {/* Success Message */}
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}

                <div className="controls">
                    <label htmlFor="driver">Select Driver:</label>
                    <select id="driver" value={selectedDriver?.UserID || ""} onChange={handleDriverChange}>
                        <option value="">-- Select a Driver --</option>
                        {drivers.map((driver) => (
                            <option key={driver.UserID} value={driver.UserID}>
                                {driver.Username} (UserID: {driver.UserID})
                            </option>
                        ))}
                    </select>

                    <label htmlFor="sortBy">Sort by:</label>
                    <select id="sortBy" value={sortBy} onChange={handleSortChange}>
                        <option value="price_asc">Point (Lowest to Highest)</option>
                        <option value="price_desc">Point (Highest to Lowest)</option>
                    </select>
                </div>

                {/* Driver points */}
                {selectedDriver && (
                    <h3>Driver's Available Points: {selectedDriver.DriverPoints}</h3>
                )}

                {/* Search Bar */}
                {selectedDriver && (
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search products by name, type, or artist..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                )}

                {/* No driver selected message */}
                {!selectedDriver && (
                    <p className="empty-message">You must select a driver to add items to that driver's cart.</p>
                )}

                {/* Driver selected but catalog is empty */}
                {selectedDriver && filteredCatalog.length === 0 && (
                    <p className="empty-message">This driver's catalog is currently empty. Add items to the catalog!</p>
                )}

                {/* Catalog display */}
                {filteredCatalog.length > 0 && (
                    <div className="catalog-grid">
                        {filteredCatalog.map((item) => (
                            <div key={item.ProductTrackId} className="catalog-card">
                                <img src={item.ProductImage} alt={item.ProductName} className="product-image" />
                                <h3>{item.ProductName}</h3>
                                <p className="artist-name">{item.ProductType}</p>
                                <p className="artist-name">by {item.ProductArtistName}</p>
                                <p className="point">Points: {item.ProductPrice}</p>
                                <button
                                    className="add-button"
                                    onClick={() => addToCart(item)}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SponsorCatalog;
