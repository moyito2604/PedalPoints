import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CatalogInput.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const ItunesCatalogInput = () => {
    const navigate = useNavigate();
    const [artist, setArtist] = useState('');
    const [genre, setGenre] = useState('');
    const [type, setType] = useState('');
    const [message, setMessage] = useState(null);
    const [products, setProducts] = useState([]);
    const storedUserData = JSON.parse(localStorage.getItem('user')) || {};

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    const fetchProducts = useCallback(async () => {
        try {
            const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/catalog/products`, {
                params: { userId: storedUserData.id }
            });
            setProducts(response.data.products);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }, [storedUserData.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { artist, genre, type, userId: storedUserData.id };

        try {
            const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/catalog/input`, data);
            setMessage({ text: `Server Response: ${response.data.message}`, type: 'success' });
            setProducts(response.data.products);
        } catch (error) {
            const errorMessage = error.response?.data?.error || "An error occurred.";
            setMessage({ text: `Error: ${errorMessage}`, type: 'error' });
        }

        setArtist('');
        setGenre('');
        setType('');
    };

    const handleDelete = async (productTrackId) => {
        try {
            await axios.post(`${REACT_APP_BASEURL}/sponsor/catalog/delete`, {
                userId: storedUserData.id,
                productTrackId,
            });
            setProducts(products.filter(product => product.ProductTrackId !== productTrackId));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div className="catalog-input-container">
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
            <div className="catalog-input-box">
                <h2>Enter iTunes Catalog Information</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Search" value={artist} onChange={(e) => setArtist(e.target.value)} required />
                    <select value={type} onChange={(e) => setType(e.target.value)} required>
                        <option value="">Select Type</option>
                        <option value="song">Song</option>
                        <option value="album">Album</option>
                        <option value="movie">Movie</option>
                        <option value="podcast">Podcast</option>
                        <option value="audiobook">Audiobook</option>
                        <option value="tvShow">TV Show</option>
                        <option value="all">All</option>
                    </select>
                    <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                        <option value="">Select Genre (optional)</option>
                        <option value="Pop">Pop</option>
                        <option value="Rock">Rock</option>
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Classical">Classical</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Country">Country</option>
                    </select>
                    <button type="submit">Submit</button>
                </form>
                {message && <p className={`catalog-input-message ${message.type}`}>{message.text}</p>}
                <h3>Current Catalog</h3>
                <ul className="catalog-list">
                    {products.map((product, index) => (
                        <li key={index} className="catalog-item">
                            <img src={product.ProductImage} alt={product.ProductName} />
                            <div>
                                <p><strong>{product.ProductName}</strong> by {product.ProductArtistName}</p>
                                <p>Type: {product.ProductType}</p>
                                <p>Price: {product.ProductPrice}</p>
                            </div>
                            <button className="delete-button" onClick={() => handleDelete(product.ProductTrackId)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ItunesCatalogInput;
