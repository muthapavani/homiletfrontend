import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./card.css"; 
import img1BHKFlat from "../../assets/landingimg/1_bhk_flat.avif"; 
import img2BHKFlat from "../../assets/landingimg/2- bhk-flat.jpg"; 
import img3BHKFlat from "../../assets/landingimg/3-bhk-flat.jpeg"; 
import img1BHKHouse from "../../assets/landingimg/1-bhk-house.webp"; 
import img2BHKHouse from "../../assets/landingimg/2-bhk-house.jpg"; 
import img3BHKHouse from "../../assets/landingimg/3-BHK-home.webp";

const properties = [
  {
    id: 1,
    name: "1BHK Apartment",
    type: "Flat",
    location: "hyderabad, Ind",
    price: "Rs 5,200/month",
    image: img1BHKFlat,
  },
  {
    id: 2,
    name: "2BHK Apartment",
    type: "Flat",
    location: "vizag, Ind",
    price: "Rs 6,800/month",
    image: img2BHKFlat,
  },
  {
    id: 3,
    name: "3BHK Apartment",
    type: "Flat",
    location: "vijayawada, Ind",
    price: "Rs 7,500/month",
    image: img3BHKFlat,
  },
  {
    id: 4,
    name: "1BHK House",
    type: "House",
    location: "rajamadry, Ind",
    price: "Rs 5,500/month",
    image: img1BHKHouse,
  },
  {
    id: 5,
    name: "2BHK House",
    type: "House",
    location: "hyderabad, Ind",
    price: "Rs 6,200/month",
    image: img2BHKHouse,
  },
  {
    id: 6,
    name: "3BHK House",
    type: "House",
    location: "vizag, Ind",
    price: "RS 7,000/month",
    image: img3BHKHouse,
  },
];

const Cards = () => {
  const navigate = useNavigate();
  const [loadingStates, setLoadingStates] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Direct guest login function (same as in Login component)
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
    <section id="homes" className="h-section">
      <div className="h-header-container">
      <button 
          className="nav-arrow-btn"
          onClick={() => handleGuestLogin('landArrowButton')}
          disabled={loadingStates.landArrowButton}
        >
          <span className="circle-arrow">
            {loadingStates.landArrowButton ? "..." : "›"}
          </span>
        </button>
        <h2 className="h-title">Find Your Ideal Home</h2>
      </div>
      
      {/* Error Message Display */}
      {errorMessage && (
        <div className="error-container">
          <p className="error-message">{errorMessage}</p>
        </div>
      )}
      
      <div className="h-container">
        {properties.map((property) => (
          <div key={property.id} className="h-card">
            <img src={property.image} alt={property.name} className="h-image" />
            <div className="h-info">
              <h3>{property.name}</h3>
              <p>{property.type} - {property.location}</p>
              <span className="price">{property.price}</span>
              <button 
                className="view-btn"
                onClick={() => handleGuestLogin(`property-${property.id}`)}
                disabled={loadingStates[`property-${property.id}`]}
              >
                {loadingStates[`property-${property.id}`] ? "Logging in..." : "View"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Cards;