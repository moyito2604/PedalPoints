import React, { useEffect, useState } from 'react';
import './Checkout.css';

const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

const Checkout = () => {
  const [sponsors, setSponsors] = useState([]);
  const [orderDetails, setOrderDetails] = useState({});
  const [orderId] = useState(`ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  const [isLoading, setIsLoading] = useState(true);

  // Get user from localStorage
  const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
  const userId = storedUserData.id;

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`${REACT_APP_BASEURL}/getUserDetails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const formattedSponsors = data.sponsors?.map(sponsor => ({
          name: sponsor.name,
          points: sponsor.points,
        })) || [];

        setSponsors(formattedSponsors);

        // Retrieve checkout data only once
        const orderDetailsResponse = await fetch(`${REACT_APP_BASEURL}/getOrderDetails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!orderDetailsResponse.ok) {
          throw new Error(`Order details fetch error! Status: ${orderDetailsResponse.status}`);
        }

        const orderData = await orderDetailsResponse.json();

        if (orderData) {
          setOrderDetails({
            totalItems: orderData.MostRecentPurchaseQuantity || 0,
            totalAmount: orderData.TransactionChange || 0,
            sponsorName: orderData.SponsorCompanyName || 'Unknown Sponsor',
            date: orderData.TransactionDate ? new Date(orderData.TransactionDate).toLocaleDateString() : new Date().toLocaleDateString(),
          });
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleBackToDashboard = () => {
    window.location.href = '/user/landing';
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h2>Loading order details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="success-icon"></div>
      <div className="checkout-container">
        <h1>Thank You for Your Order!</h1>
        <p>Your checkout is complete. We'll process your rewards redemption shortly.</p>

        {orderDetails && Object.keys(orderDetails).length > 0 && (
          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-item">
              <span>Sponsor:</span>
              <span>{orderDetails.sponsorName}</span>
            </div>
            <div className="summary-item">
              <span>Date:</span>
              <span>{orderDetails.date}</span>
            </div>
            <div className="summary-item">
              <span>Items:</span>
              <span>{orderDetails.totalItems}</span>
            </div>
            <div className="summary-total">
              <span>Total Points:</span>
              <span>{orderDetails.totalAmount}</span>
            </div>
          </div>
        )}

        <h2>Your Current Points Balance</h2>

        <ul className="sponsors-list">
          {sponsors.length > 0 ? (
            sponsors.map((sponsor, index) => (
              <li key={index} className="sponsor-item">
                <span className="sponsor-name">{sponsor.name}</span>
                <span className="sponsor-points">{sponsor.points} points</span>
              </li>
            ))
          ) : (
            <div className="no-sponsors">No sponsors found</div>
          )}
        </ul>

        <div className="order-id">Order ID: {orderId}</div>

        <button className="print-btn" onClick={handlePrintReceipt}>
          Print Receipt
        </button>

        <button className="back-btn" onClick={handleBackToDashboard}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Checkout;
