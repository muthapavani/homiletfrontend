import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContactAgentButton from './contactagent.jsx';
import './propdetails.css'; 
import PaymentButton from './payment/payment.jsx';

// SVG icon components remain the same
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconBath = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h20M4 12v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M4 6v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6M6 6V3c0-.6.4-1 1-1h3c.6 0 1 .4 1 1v3" />
  </svg>
);

const IconBedDouble = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v3" />
    <path d="M2 12v3c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-3" />
    <path d="M4 18v3" />
    <path d="M20 18v3" />
    <path d="M4 14h16" />
    <path d="M4 9h16" />
  </svg>
);

const IconRuler = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    <path d="M6 0v24" />
    <path d="M10 0v24" />
    <path d="M14 0v24" />
    <path d="M18 0v24" />
    <path d="M0 6h24" />
    <path d="M0 10h24" />
    <path d="M0 14h24" />
    <path d="M0 18h24" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Updated Map component to partially show location for guests
const PropertyMap = ({ latitude, longitude, city, state, address, isLoggedIn, isGuest }) => {
  // Convert coordinates to numbers and validate
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoordinates = !isNaN(lat) && !isNaN(lng);
  
  const getMaskedValue = (text) => {
    if (!text) return '';
    // Show first 3 characters followed by xxxx for guests
    return text.substring(0, 3) + 'xxxx';
  };

  // Create location text for display based on login status
  let locationText = '';
  
  if (address) {
    locationText = isLoggedIn ? address : getMaskedValue(address);
    locationText += ', ';
  }
  
  locationText += `${isLoggedIn ? city : getMaskedValue(city) || ''}`;
  if (city && state) locationText += ', ';
  locationText += `${isLoggedIn ? state : getMaskedValue(state) || ''}`;
  
  if (isLoggedIn || isGuest) {
    if (hasValidCoordinates && isLoggedIn) {
      // Show full map for logged-in users
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&amp;layer=mapnik&amp;marker=${lat}%2C${lng}`;
      const largerMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
      
      return (
        <div className="map-container">
          <h3>Location</h3>
          <div className="map-frame">
            <iframe
              title="Property Location Map"
              width="100%"
              height="250"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={osmUrl}
              style={{ border: '1px solid #ccc', borderRadius: '4px', display: 'block' }}
            />
            {isLoggedIn && (
              <div className="map-link">
                <a href={largerMapUrl} target="_blank" rel="noopener noreferrer">
                  View larger map
                </a>
              </div>
            )}
          </div>
          <div className="location-text">
            <IconMapPin />
            <p>{locationText}</p>
          </div>
          {isGuest && (
            <div className="guest-notice">
              <IconLock /> 
              <p>Login for full location details</p>
            </div>
          )}
        </div>
      );
    } else {
      // Show text location only when coordinates are not available
      return (
        <div className="map-container">
          <h3>Location</h3>
          <div className="map-static">
            <div className="map-placeholder location-known">
              <IconMapPin />
              <p>{locationText}</p>
            </div>
          </div>
          {isGuest && (
            <div className="guest-notice">
              <IconLock /> 
              <p>Login for full location details</p>
            </div>
          )}
        </div>
      );
    }
  } else {
    // Show login prompt for non-logged in users who aren't guests
    return (
      <div className="map-container">
        <h3>Location</h3>
        <div className="map-static">
          <div className="map-placeholder login-required">
            <IconLock />
            <p>Log in to view property location</p>
          </div>
        </div>
      </div>
    );
  }
};

const PropertyDetailsView = () => {
  // Get propertyId from URL parameters
  const { propertyId } = useParams();
  const navigate = useNavigate();
  
  // Define the API base URL for image paths, matching proplist.jsx
  const API_BASE_URL = "https://homilet-backend-2.onrender.com";
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userType, setUserType] = useState('none'); // 'none', 'guest', or 'user'

  // Check login and user type status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userTypeFromStorage = localStorage.getItem('userType'); // Assuming you store user type in localStorage
    
    setIsLoggedIn(!!token);
    setUserType(userTypeFromStorage || 'none');
    setIsGuest(userTypeFromStorage === 'guest');
  }, []);

  // Helper function to mask sensitive data for guests
  const getMaskedValue = (text) => {
    if (!text) return '';
    // Show first 3 characters followed by xxxx for guests
    return text.substring(0, 3) + 'xxxx';
  };

  // Fetch property data when component mounts or propertyId changes
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const requestUrl = `${API_BASE_URL}/api/properties/${propertyId}`;
        const response = await fetch(requestUrl, { headers });
        
        if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid JSON response from server");
        }
        
        const data = await response.json();
        
        // Process the data to ensure all properties have the required fields
        let processedData = { ...data };
        
        // Create a valid images array
        let images = processImages(data.images);
        
        // Process amenities
        let amenities = processAmenities(data.amenities);
        
        processedData = {
          ...processedData,
          images: images,
          amenities: amenities
        };
        
        setProperty(processedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId, API_BASE_URL, isLoggedIn]);

  // Improved helper function to process images
  const processImages = useCallback((imagesData) => {
    // Default to empty array
    if (!imagesData) return [];
    
    let images = [];
    
    try {
      // If it's a string, try to parse it as JSON
      if (typeof imagesData === 'string') {
        try {
          // Attempt to parse as JSON
          const parsed = JSON.parse(imagesData);
          images = Array.isArray(parsed) ? parsed : [imagesData];
        } catch (e) {
          // If parsing fails, treat as a single URL
          images = [imagesData];
        }
      } 
      // If it's already an array, use it directly
      else if (Array.isArray(imagesData)) {
        images = imagesData;
      }
      // Handle other data types
      else {
        images = [String(imagesData)]; // Convert to string
      }
    } catch (error) {
      console.error("Error processing images:", error);
      images = [];
    }
    
    // Filter out any null, undefined or empty strings
    return images.filter(img => img && img.trim() !== '');
  }, []);
  
  // Improved helper function to process amenities
  const processAmenities = useCallback((amenitiesData) => {
    // Default to empty array
    if (!amenitiesData) return [];
    
    let amenities = [];
    
    try {
      // String handling
      if (typeof amenitiesData === 'string') {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(amenitiesData);
          if (Array.isArray(parsed)) {
            amenities = parsed;
          } else if (typeof parsed === 'string') {
            // Handle case where parsed result is a string
            amenities = parsed.split(',').map(item => item.trim());
          } else {
            // Handle other JSON structures
            amenities = Object.values(parsed)
              .filter(val => typeof val === 'string')
              .map(val => val.trim());
          }
        } catch (e) {
          // Not valid JSON, treat as comma-separated list
          amenities = amenitiesData.split(',').map(item => item.trim());
        }
      } 
      // Array handling
      else if (Array.isArray(amenitiesData)) {
        amenities = amenitiesData.map(item => 
          typeof item === 'string' ? item.trim() : String(item)
        );
      }
      // Object handling
      else if (typeof amenitiesData === 'object' && amenitiesData !== null) {
        amenities = Object.values(amenitiesData)
          .filter(val => val)
          .map(val => typeof val === 'string' ? val.trim() : String(val));
      }
    } catch (error) {
      console.error("Error processing amenities:", error);
      amenities = [];
    }
    
    // Filter out any empty strings
    return amenities.filter(amenity => amenity && amenity.trim() !== '');
  }, []);

  // Handle back to listings button
  const handleBackToListings = useCallback(() => {
    navigate(-1); // Navigate back to the previous page
  }, [navigate]);
  
  // Helper function to properly format image URLs
  const formatImageUrl = useCallback((imagePath) => {
    // Return null for empty paths
    if (!imagePath) return null;
    
    // If the path already starts with http:// or https://, it's already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Make sure path starts with a slash if it doesn't already
    const formattedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Return the complete URL
    return `${API_BASE_URL}${formattedPath}`;
  }, [API_BASE_URL]);
  
  const handleImageError = useCallback((index) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true        
    }));
  }, []);

  // Fallback image based on property type
  const getFallbackImage = useCallback((propertyType) => {
    const typeText = propertyType?.charAt(0).toUpperCase() + (propertyType?.slice(1) || '');
    return `https://via.placeholder.com/800x600?text=${encodeURIComponent(typeText || 'Property')}`;
  }, []);

  const navigateImages = useCallback((direction) => {
    if (!property || !property.images || property.images.length === 0) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      );
    } else {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      );
    }
  }, [property]);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  // Format price
  const formatPrice = useCallback((price) => {
    if (price === undefined || price === null) return 'Price on request';
    
    try {
      return `${Number(price).toLocaleString()}`;
    } catch (error) {
      return 'Price on request';
    }
  }, []);

  // Redirect to login
  const handleLoginRedirect = () => {
    navigate('/login', { state: { returnUrl: `/properties/${propertyId}` } });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <div className="error-message">
          <h3>Error Loading Property</h3>
          <p>{error}</p>
          <button 
            onClick={handleBackToListings}
            className="back-button"
          >
            <IconChevronLeft />
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="not-found-state">
        <div className="not-found-icon">🔍</div>
        <h3>Property Not Found</h3>
        <p>The property you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={handleBackToListings}
          className="back-button"
        >
         <IconChevronLeft />
        </button>
      </div>
    );
  }

  // Check if we have valid images before trying to access them
  const hasValidImages = property.images && Array.isArray(property.images) && property.images.length > 0;
  
  // Get current image URL with proper error handling
  let currentImageUrl = null;
  
  if (hasValidImages && !imageErrors[currentImageIndex]) {
    currentImageUrl = formatImageUrl(property.images[currentImageIndex]);
  }
  
  // If no valid image or there was an error, use fallback
  if (!currentImageUrl) {
    currentImageUrl = getFallbackImage(property.property_type);
  }

  return (
    <div className="property-details-container">
      {/* Back Button */}
      <button 
        onClick={handleBackToListings}
        className="back-button"
      >
        <IconChevronLeft />
        
      </button>
      
      <h1 className="property-title1">{property.title || 'Property Details'}</h1>
      
      {/* Image Carousel */}
      <div className="image-carousel">
        {hasValidImages ? (
          <>
            <div className="main-image-container">
              <img 
                src={currentImageUrl} 
                alt={`Property image ${currentImageIndex + 1}`} 
                className="main-image"
                onError={() => handleImageError(currentImageIndex)}
              />
              
              {/* Image Navigation Buttons */}
              {property.images.length > 1 && (
                <>
                  <button 
                    onClick={() => navigateImages('prev')}
                    className="image-nav-button prev-button"
                    aria-label="Previous image"
                  >
                    <IconChevronLeft />
                  </button>
                  <button 
                    onClick={() => navigateImages('next')}
                    className="image-nav-button next-button"
                    aria-label="Next image"
                  >
                    <IconChevronRight />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="image-counter">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </div>
            
            {/* Thumbnail Navigation */}
            {property.images.length > 1 && (
              <div className="thumbnails-container">
                {property.images.map((image, index) => {
                  // Skip rendering thumbnails for images with errors
                  if (imageErrors[index]) return null;
                  
                  const thumbUrl = formatImageUrl(image);
                  if (!thumbUrl) return null;
                  
                  return (
                    <button 
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img 
                        src={thumbUrl} 
                        alt={`Thumbnail ${index + 1}`} 
                        onError={() => handleImageError(index)}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="no-image-container">
            <img 
              src={getFallbackImage(property.property_type)} 
              alt="No property images available" 
              className="main-image"
            />
            <p>No images available</p>
          </div>
        )}
      </div>
      
      {/* Property Overview */}
      <div className="property-overview">
        <div className="badge">
          {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
        </div>
        
        <div className="price">
          <span> &#x20b9;
            {formatPrice(property.price)}
            {property.listing_type === 'rent' && <span className="price-period">/month</span>}
          </span>
        </div>
        
        <div className="property-features">
          <div className="feature">
            <IconHome />
            <span>{property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1) || 'Property'}</span>
          </div>
          
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <div className="feature">
              <IconBedDouble />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
            </div>
          )}
          
          {property.bathrooms !== undefined && property.bathrooms !== null && (
            <div className="feature">
              <IconBath />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
            </div>
          )}
          
          {property.area && (
            <div className="feature">
              <IconRuler />
              <span>{property.area} sq ft</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Property Details Section */}
      <div className="details-grid">
        {/* Main Details */}
        <div className="main-details">
          <div className="details-section">
            <h2>Description</h2>
            <div className="description">
              {property.description || 'No description available.'}
            </div>
          </div>
          
          {property.amenities && property.amenities.length > 0 && (
            <div className="details-section">
              <h2>Amenities</h2>
              <div className="amenities-grid">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <div className="amenity-dot"></div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="details-section">
            <h2>Property Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Property ID</span>
                <span className="info-value">{property.id || 'N/A'}</span>
              </div>
              
              {/* Location information - Show partially for guests and fully for logged-in users */}
              {(isLoggedIn || isGuest) && (
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">
                    {isLoggedIn ? property.address : getMaskedValue(property.address) || 'N/A'}
                    {property.city ? `, ${isLoggedIn ? property.city : getMaskedValue(property.city)}` : ''}
                    {property.state ? `, ${isLoggedIn ? property.state : getMaskedValue(property.state)}` : ''}
                  </span>
                  {isGuest && (
                    <span className="masked-info-notice">Login for full details</span>
                  )}
                </div>
              )}
              
              <div className="info-item">
                <span className="info-label">Property Type</span>
                <span className="info-value">
                  {property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1) || 'N/A'}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Listing Type</span>
                <span className="info-value">
                  {property.listing_type === 'rent' ? 'For Rent' : property.listing_type === 'sell' ? 'For Sale' : 'N/A'}
                </span>
              </div>
              
              {property.year_built && (
                <div className="info-item">
                  <span className="info-label">Year Built</span>
                  <span className="info-value">{property.year_built}</span>
                </div>
              )}
              
              {property.listed_date && (
                <div className="info-item">
                  <span className="info-label">Listed On</span>
                  <span className="info-value">{formatDate(property.listed_date)}</span>
                </div>
              )}
              
              {/* Show login prompt for location if not logged in or guest */}
              {!isLoggedIn && !isGuest && (
                <div className="info-item login-prompt-info">
                  <span className="info-label">Location</span>
                  <span className="info-value login-required">
                    <IconLock size={16} />
                    <span>Log in to view location</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="contact-section">
          <div className="contact-card">
            <h3>Contact Information</h3>
            
            {!isLoggedIn && !isGuest && (
              <div className="login-prompt-container">
                <div className="login-prompt">
                  <IconLock />
                  <p>Full contact details are only visible to logged-in users</p>
                  <button 
                    onClick={handleLoginRedirect}
                    className="login-button"
                  >
                    Log in to view
                  </button>
                </div>
              </div>
            )}
            
            <div className="contact-info">
              {/* Show full details for logged-in users, partial for guests */}
              {(isLoggedIn || isGuest) && property.owner_name && (
                <div className="contact-item">
                  <IconUser />
                  <span>{isLoggedIn ? property.owner_name : getMaskedValue(property.owner_name)}</span>
                  {isGuest && <span className="masked-info-notice">Login for full name</span>}
                </div>
              )}
              
              {(isLoggedIn || isGuest) && property.owner_mobile && (
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span>{isLoggedIn ? property.owner_mobile : getMaskedValue(property.owner_mobile)}</span>
                  {isGuest && <span className="masked-info-notice">Login for full number</span>}
                </div>
              )}
              
              {!isLoggedIn && !isGuest && (
                <div className="contact-item blurred">
                  <IconUser />
                  <span>Contact details hidden</span>
                </div>
              )}
            </div>
            
            <ContactAgentButton 
              propertyDetails={property} 
              isLoggedIn={isLoggedIn}
              isGuest={isGuest}
              onLoginRedirect={handleLoginRedirect}
            />
            <PaymentButton
              propertyId={property.id}
              propertyTitle={property.title}
              price={property.price}
              isLoggedIn={isLoggedIn}
              onLoginRedirect={handleLoginRedirect}
            />
          </div>
          
          {/* Map Component with login/guest check */}
          <PropertyMap 
            latitude={property.latitude} 
            longitude={property.longitude}
            city={property.city}
            state={property.state}
            address={property.address}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsView;