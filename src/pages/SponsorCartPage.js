import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./CartPage.css";

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const SponsorCartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalDriverPoints, setTotalDriverPoints] = useState(0);
    const [totalQuantity, setTotalQuantity] = useState(0);
    const [error, setError] = useState(null);
    const [checkoutDisabled, setCheckoutDisabled] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState("");
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState("");

    const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
    const userId = storedUserData.id; // Sponsor's ID

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
        if (!userId || !selectedDriver) return;

        const fetchCart = async () => {
            try {
                const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/cart/get`, {
                    userId,
                    driverId: selectedDriver
                });
                setCartItems(response.data.cartItems);
                setTotalPrice(response.data.totalPrice);
                setTotalDriverPoints(response.data.totalDriverPoints);
                setTotalQuantity(response.data.totalQuantity);
            } catch (err) {
                setError("Error fetching cart. Try again.");
            }
        };

        fetchCart();
    }, [userId, selectedDriver]);

    useEffect(() => {
        if (totalQuantity === 0) {
            setCheckoutDisabled(true);
            setCheckoutMessage("Your cart is empty. Add items before checking out.");
        } else if (totalPrice > totalDriverPoints) {
            setCheckoutDisabled(true);
            setCheckoutMessage("Cart total exceeds available points. Please remove items.");
        } else {
            setCheckoutDisabled(false);
            setCheckoutMessage("");
        }
    }, [totalPrice, totalDriverPoints, totalQuantity]);

    const handleDriverChange = (event) => {
        setSelectedDriver(event.target.value);
    };

    const handleAction = async (action, productId) => {
        if (!userId) {
            console.error("Sponsor ID not found. Please log in.");
            return;
        }

        try {
            await axios.post(`${REACT_APP_BASEURL}/sponsor/cart/update_quantity`, {
                action,
                productId,
                userId,
                driverId: selectedDriver
            });

            const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/cart/get`, {
                userId,
                driverId: selectedDriver
            });

            setCartItems(response.data.cartItems);
            setTotalPrice(response.data.totalPrice);
            setTotalDriverPoints(response.data.totalDriverPoints);
            setTotalQuantity(response.data.totalQuantity);
        } catch (err) {
            console.error("Error updating cart", err);
        }
    };

    const handleCheckout = async () => {
        if (checkoutDisabled) return;

        setCheckoutDisabled(true);

        console.log("Checkout Data:", {
            userId,
            driverId: selectedDriver,
            totalPoints: totalDriverPoints,
            totalAmount: totalPrice
        });

        try {
            if (!selectedDriver) {
                console.error("No driver selected.");
                return;
            }

            const response = await axios.post(`${REACT_APP_BASEURL}/sponsor/checkout`, {
                userId,
                driverId: selectedDriver,
                totalPoints: totalDriverPoints,
                totalAmount: totalPrice
            });

            console.log("Checkout Response:", response.data);

            localStorage.setItem('checkoutData', JSON.stringify(response.data));

            window.location.href = '/sponsor/landing';
        } catch (error) {
            console.error('Error sending data to backend:', error);
        } finally {
            setCheckoutDisabled(false);
        }
    };

    return (
        <div className="cart-page">
            {error && <p className="error-message">{error}</p>}

            {/* Always show the dropdown and back button */}
            <div className="controls">
                <label htmlFor="driver">Select Driver:</label>
                <select id="driver" value={selectedDriver} onChange={handleDriverChange}>
                    <option value="">Select a driver</option>
                    {drivers.map((driver) => (
                        <option key={driver.UserID} value={driver.UserID}>
                            {driver.Username} (UserID: {driver.UserID})
                        </option>
                    ))}
                </select>
            </div>

            {/* Only show the following if a driver is selected */}
            {selectedDriver && (
                <>
                    <div className="total-points">
                        <h3>Total Driver Points: {totalDriverPoints}</h3>
                    </div>

                    <div className="total-points">
                        {totalQuantity === 0 ? <p>Empty Cart</p> : <p>{totalQuantity} Items</p>}
                    </div>

                    <div className="cart-items">
                        {totalQuantity > 0 ? (
                            cartItems.map((item) => (
                                <div key={item.ProductTrackId} className="cart-item">
                                    <img src={item.ProductImage} alt={item.ProductName} />
                                    <p>{item.ProductName}</p>
                                    <p>{item.ProductArtistName}</p>
                                    <p>Quantity: {item.Quantity}</p>
                                    <p>Point: {item.ProductPrice}</p>
                                    <p>Total Point: {item.TotalPrice}</p>
                                    <div className="button-container">
                                        <button onClick={() => handleAction("plus", item.ProductTrackId)}>+</button>
                                        <button onClick={() => handleAction("minus", item.ProductTrackId)}>-</button>
                                        <button onClick={() => handleAction("delete", item.ProductTrackId)}>🗑️</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-message">No items in the cart.</p>
                        )}
                    </div>

                    <div className={`cart-total ${totalPrice > totalDriverPoints ? 'over-budget' : ''}`}>
                        <h3>Total Points: {totalPrice}</h3>
                        {totalPrice > totalDriverPoints && <p className="warning-message">{checkoutMessage}</p>}
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={checkoutDisabled || !selectedDriver}
                        className={(checkoutDisabled || !selectedDriver) ? 'checkout-disabled' : 'checkout-button'}
                    >
                        Checkout
                    </button>
                </>
            )}

            {/* If no driver is selected, show this message */}
            {!selectedDriver && (
                <p className="empty-message">Select a driver to see their cart.</p>
            )}
            <button onClick={() => window.location.href = '/sponsor/purchase'}>Back to Catalog</button>
        </div>
    );
};

export default SponsorCartPage;
