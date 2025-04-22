import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./CartPage.css";

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalDriverPoints, setTotalDriverPoints] = useState(0);
    const [totalQuantity, setTotalQuantity] = useState(0);
    const [error, setError] = useState(null);
    const [checkoutDisabled, setCheckoutDisabled] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState("");
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsor, setSelectedSponsor] = useState("");

    const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
    const userId = storedUserData.id;

    useEffect(() => {
        if (!userId) {
            setError("User ID not found. Please log in.");
            return;
        }

        const fetchSponsors = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASEURL}/sponsors`, { params: { userId } });
                setSponsors(response.data);
            } catch (err) {
                setError("Error fetching sponsors.");
            }
        };

        fetchSponsors();
    }, [userId]);

    useEffect(() => {
        if (!userId || !selectedSponsor) return;

        const fetchCart = async () => {
            try {
                const response = await axios.post(`${REACT_APP_BASEURL}/cart/get`, {
                    userId,
                    sponsorId: selectedSponsor
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
    }, [userId, selectedSponsor]);

    useEffect(() => {
        if (totalQuantity === 0) {
            setCheckoutDisabled(true);
            setCheckoutMessage("Your cart is empty. Add items before checking out.");
        } else if (totalPrice > totalDriverPoints) {
            setCheckoutDisabled(true);
            setCheckoutMessage("Your cart total exceeds available points. Please remove items.");
        } else {
            setCheckoutDisabled(false);
            setCheckoutMessage("");
        }
    }, [totalPrice, totalDriverPoints, totalQuantity]);

    const handleSponsorChange = (event) => {
        setSelectedSponsor(event.target.value);
    };

    const handleAction = async (action, productId) => {
        if (!userId) {
            console.error("User ID not found. Please log in.");
            return;
        }

        try {
            await axios.post(`${REACT_APP_BASEURL}/cart/update_quantity`, {
                action,
                productId,
                userId,
                sponsorId: selectedSponsor
            });

            const response = await axios.post(`${REACT_APP_BASEURL}/cart/get`, {
                userId,
                sponsorId: selectedSponsor
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

        // Disable the checkout button after the first click
        setCheckoutDisabled(true);

        console.log("Checkout Data:", {
            userId,
            sponsorId: selectedSponsor,
            totalPoints: totalDriverPoints,
            totalAmount: totalPrice
        });

        try {
            // Ensure selectedSponsor is not empty
            if (!selectedSponsor) {
                console.error("No sponsor selected.");
                return;
            }

            const response = await axios.post(`${REACT_APP_BASEURL}/checkout`, {
                userId,
                sponsorId: selectedSponsor,
                totalPoints: totalDriverPoints,
                totalAmount: totalPrice
            });

            // Log response from the backend
            console.log("Checkout Response:", response.data);

            // Store the response in localStorage for CheckoutPage.js
            localStorage.setItem('checkoutData', JSON.stringify(response.data));

            // Redirect to checkout page
            window.location.href = '/checkout';
        } catch (error) {
            console.error('Error sending data to backend:', error);
        } finally {
            // Re-enable the checkout button in case of error, if needed
            setCheckoutDisabled(false);
        }
    };

    return (
        <div className="cart-page">
            {error && <p className="error-message">{error}</p>}

            <div className="controls">
                <label htmlFor="sponsor">Select Sponsor:</label>
                <select id="sponsor" value={selectedSponsor} onChange={handleSponsorChange}>
                    <option value="">Select a sponsor</option>
                    {sponsors.map((sponsor) => (
                        <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                            {sponsor.SponsorCompanyName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSponsor === "" ? (
                <p className="empty-message">Select a sponsor to see your cart with that sponsor.</p>
            ) : (
                <>
                    <div className="total-points">
                        <h3>Total Driver Points for Selected Sponsor: {totalDriverPoints}</h3>
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
                        disabled={checkoutDisabled}
                        className={checkoutDisabled ? 'checkout-disabled' : 'checkout-button'}
                    >
                        Checkout
                    </button>

                </>
            )}
            <button onClick={() => window.location.href = '/catalog/display'}>Back to Catalog</button>

        </div>
    );
};

export default CartPage;

