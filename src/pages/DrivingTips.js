import React from 'react';
import './DrivingTips.css';

const drivingTips = [
    "Always Perform Pre-Trip Inspections - Check brakes, tires, lights, and fluid levels before every trip.",
    "Keep a Safe Following Distance - Trucks need much more stopping distance than cars.",
    "Adjust Speed for Conditions - Slow down on wet, icy, or foggy roads.",
    "Watch Your Blind Spots (\"No Zones\") - Check mirrors constantly and signal early.",
    "Avoid Distractions - Stay focused — no texting, eating, or reaching while driving.",
    "Plan Your Route Ahead of Time - Know your roads, low bridges, and tight areas.",
    "Respect Rest and Break Rules - Take regular breaks and never drive fatigued.",
    "Take Turns Slowly and Widely - Prevent rollovers with slow, controlled turns.",
    "Use Proper Braking Techniques - Use engine braking and avoid slamming on brakes.",
    "Stay Calm and Patient - Other drivers may act badly; stay professional.",
    "Wear Your Seatbelt Every Time - It's your last line of defense.",
    "Be Extra Careful at Night - Visibility is lower and other drivers are tired."
  ];

function DrivingTips() {
  return (
        <div style={{ padding: '2rem' }}>
            <div className="driving-tips-container">
        <h2>Safe Driving Tips for Truck Drivers</h2>
        <ul className="driving-tips-list">
            {drivingTips.map((tip, index) => (
            <li key={index} className="driving-tip-item">
                {tip}
            </li>
            ))}
        </ul>
        </div>
    </div>
  );
}

export default DrivingTips;