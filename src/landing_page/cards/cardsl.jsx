import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./cardsl.css"; 
import alandimage from "../../assets/landingimg/aland.webp";
import clandimage from "../../assets/landingimg/cland.jpg";
import rlandimage from "../../assets/landingimg/rland.webp";

const lands = [
  {
    id: 1,
    name: "Agricultural Land",
    location: "Vizag, Ind",
    image: alandimage,
  },
  {
    id: 2,
    name: "Commercial Land",
    location: "Delhi, Ind",
    image: clandimage,
  },
  {
    id: 3,
    name: "Residential Land",
    location: "kerala, Ind",
    image: rlandimage,
  },
];

const LandCards = () => {
  const navigate = useNavigate();
  const [loadingStates, setLoadingStates] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Direct guest login function
  const handleGuestLogin = async (buttonId) => {
    // Set loading state for this button
    setLoadingStates(prev => ({
      ...prev,
      [buttonId]: true
    }));
    setErrorMessage("");

    try {
      // Call the server endpoint for guest login
      const res = await axios.post("http://localhost:5000/api/guest-login");
      
      if (res.data.success && res.data.token) {
        console.log("Guest login successful!");
        
        // Store token from the server response
        localStorage.setItem('token', res.data.token);
        
        // Store user data from the server response
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        
        // Navigate directly to dashboard
        navigate("/dashboard");
      } else {
        setErrorMessage(res.data.message || "Guest login failed. Please try again.");
      }
    } catch (err) {
      console.error("Guest Login Error:", err);
      
      if (err.response) {
        setErrorMessage(err.response.data.message || "Guest login failed. Please try again.");
      } else if (err.request) {
        // Network error - fall back to client-side guest login as a last resort
        console.log("Server unavailable, using fallback client-side guest login");
        
        // Create a guest user object with clear indication it's offline
        const guestUser = {
          id: `offline-guest-${Date.now()}`,
          username: "Offline Guest",
          email: `offline-guest-${Date.now()}@example.com`,
          role: "guest",
          isGuest: true,
          isOffline: true,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        // Store the guest user in localStorage
        localStorage.setItem('user', JSON.stringify(guestUser));
        
        // Clear any existing token
        localStorage.removeItem('token');
        
        // Navigate directly to dashboard
        navigate("/dashboard");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      // Reset loading state
      setLoadingStates(prev => ({
        ...prev,
        [buttonId]: false
      }));
    }
  };

  return (
    <section id="cardsl" className="land-section">
      <div className="land-header-container">
        <button 
          className="nav-arrow-btn"
          onClick={() => handleGuestLogin('landArrowButton')}
          disabled={loadingStates.landArrowButton}
        >
          <span className="circle-arrow">
            {loadingStates.landArrowButton ? "..." : "›"}
          </span>
        </button>
        <h2 className="land-title">Find Your Ideal Land</h2>
      </div>
      
      {/* Error Message Display */}
      {errorMessage && (
        <div className="error-container">
          <p className="error-message">{errorMessage}</p>
        </div>
      )}
      
      <div className="land-container">
        {lands.map((land) => (
          <div key={land.id} className="land-card">
            <img src={land.image} alt={land.name} className="land-image" />
            <div className="land-info">
              <h3>{land.name}</h3>
              <p>{land.location}</p>
              <button 
                className="view-btn"
                onClick={() => handleGuestLogin(`land-${land.id}`)}
                disabled={loadingStates[`land-${land.id}`]}
              >
                {loadingStates[`land-${land.id}`] ? "Logging in..." : "View"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LandCards;