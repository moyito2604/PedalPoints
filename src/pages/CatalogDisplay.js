import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./CatalogDisplay.css";

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const CatalogDisplay = () => {
    const [catalog, setCatalog] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsor, setSelectedSponsor] = useState("");
    const [selectedSponsorPoints, setSelectedSponsorPoints] = useState(null);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('sponsor');
    const [successMessage, setSuccessMessage] = useState(""); 
    const [searchTerm, setSearchTerm] = useState("");

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    const navigate = useNavigate();
    const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
    const userId = storedUserData.id;

    useEffect(() => {
        if (!userId) {
            setError("User ID not found. Please log in.");
            return;
        }

        const fetchSponsors = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASEURL}/sponsors`, {
                    params: { userId }
                });
                setSponsors(response.data);
            } catch (err) {
                setError("Error fetching sponsors.");
            }
        };

        fetchSponsors();
    }, [userId]);

    useEffect(() => {
        if (!userId || !selectedSponsor) {
            setCatalog([]);
            return;
        }

        const fetchCatalog = async () => {
            try {
                const response = await axios.post(`${REACT_APP_BASEURL}/catalog/get`, {
                    userId,
                    sortBy,
                    sponsorId: selectedSponsor
                });
                setCatalog(response.data);
            } catch (err) {
                setError("Error fetching catalog. Try again.");
            }
        };

        fetchCatalog();
    }, [userId, sortBy, selectedSponsor]);

    const handleSponsorChange = (event) => {
        const selectedId = event.target.value;
        setSelectedSponsor(selectedId);
        setCatalog([]); // Reset catalog when changing sponsor

        const selectedSponsorData = sponsors.find(s => s.SponsorID === parseInt(selectedId));
        if (selectedSponsorData) {
            setSelectedSponsorPoints(selectedSponsorData.DriverPoints);
        } else {
            setSelectedSponsorPoints(null);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    const addToCart = async (item) => {
        try {
            await axios.post(`${REACT_APP_BASEURL}/cart/update`, {
                userId,
                item,
                sponsorId: selectedSponsor
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            setSuccessMessage(`"${item.ProductName}" has been added to your cart successfully!`);
            setTimeout(() => setSuccessMessage(""), 3000); 
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
                            onClick={() => navigate('/user/landing')}
                            className="flex items-center mr-10 focus:outline-none"
                        >
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <AwardIcon className="text-white" />
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
                        </button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/cart')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            View Cart
                        </button>
                    </div>
                </div>
            </nav>
            <div className="catalog-display-container">
                <h2>Catalog</h2>
                {error && <p className="error-message">{error}</p>}

                {/* Success Message */}
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}

                <div className="controls">
                    <label htmlFor="sponsor">Select Sponsor:</label>
                    <select id="sponsor" value={selectedSponsor} onChange={handleSponsorChange}>
                        <option value="">-- Select a Sponsor --</option>
                        {sponsors.map((sponsor) => (
                            <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                                {sponsor.SponsorCompanyName}
                            </option>
                        ))}
                    </select>

                    {selectedSponsor && selectedSponsorPoints !== null && (
                        <div>
                            <h3>Points for selected sponsor: {selectedSponsorPoints}</h3>
                        </div>
                    )}

                    <label htmlFor="sortBy">Sort by:</label>
                    <select id="sortBy" value={sortBy} onChange={handleSortChange}>
                        <option value="price_asc">Point (Lowest to Highest)</option>
                        <option value="price_desc">Point (Highest to Lowest)</option>
                    </select>
                </div>
                {selectedSponsor && (
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

                {/* Message for no sponsor selected */}
                {selectedSponsor === "" && (
                    <p className="empty-message">Please select a sponsor to view the catalog.</p>
                )}

                {/* Message for no items in catalog */}
                {selectedSponsor !== "" && filteredCatalog.length === 0 && (
                    <p className="empty-message">This sponsor hasn’t added items yet. Check back later!</p>
                )}

                {/* Catalog grid when items exist */}
                {filteredCatalog.length > 0 && (
                    <div className="catalog-grid">
                        {filteredCatalog.map((item) => (
                            <div key={item.ProductTrackId} className="catalog-card">
                                <img src={item.ProductImage} alt={item.ProductName} className="product-image" />
                                <h3>{item.ProductName}</h3>
                                <p className="artist-name">{item.ProductType}</p>
                                <p className="artist-name">by {item.ProductArtistName}</p>
                                <p className="point">Points: {item.ProductPrice}</p>
                                <button className="add-button" onClick={() => addToCart(item)}>Add to Cart</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default CatalogDisplay;
