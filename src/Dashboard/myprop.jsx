import React, { useState, useEffect } from 'react';
import './MyProp.css';
import PropertyNotifications from './propnotification'; // Import the notifications component

// Function to handle display of image URL
const getImageUrl = (imagePath) => {
// Check if the image path is a full URL or a relative path
  if (imagePath && typeof imagePath === 'string') {
    if (imagePath.startsWith('http')) {
      return imagePath;
    } else {
      return `http://localhost:5000${imagePath}`;
    }
  }
// Return a placeholder if image path is invalid
  return 'https://via.placeholder.com/400x300?text=No+Image';
};

const PropertyItem = ({ property, activeTab, handleTabChange, activeImageIndex, toggleCarousel, handleImageNavigation, handlePropertyDelete, isCarouselOpen, userData }) => {
  // Debug property data to identify field names
  console.log("Property data in item:", property);
  // Extract property type with fallbacks for different possible field names
  const propertyType = property.type || 
                       property.propertyType || 
                       property.property_type || 
                       (property.details && property.details.type) || 
                       'Not specified';
  // Extract listing type with improved fallbacks and default logic
  const getListingTypeDisplay = () => {
    // Check for listingType field first (with various possible names)
    const listingTypeValue = property.listingType || 
                             property.listing_type || 
                             property.listing || 
                             property.for_rent || 
                             property.forRent;
    
    // Check if any of these fields exist and determine the display text
    if (listingTypeValue) {
      const lowerListingType = String(listingTypeValue).toLowerCase();
      if (lowerListingType === 'rent' || lowerListingType === 'for rent' || lowerListingType === 'true' || lowerListingType === '1') {
        return 'For Rent';
      } else if (lowerListingType === 'sale' || lowerListingType === 'for sale' || lowerListingType === 'sell' || lowerListingType === 'false' || lowerListingType === '0') {
        return 'For Sale';
      }
    }
    // If we still don't have a result, try to infer from other potential fields
    if (property.hasOwnProperty('rent_amount') || property.hasOwnProperty('rentAmount')) {
      return 'For Rent';
    } else if (property.hasOwnProperty('sale_price') || property.hasOwnProperty('salePrice')) {
      return 'For Sale';
    }
    // If all else fails
    return 'Not specified';
  };
  const listingTypeDisplay = getListingTypeDisplay();
  // Extract coordinates with fallbacks
  const latitude = property.latitude || property.lat || 
                  (property.coordinates && property.coordinates.lat) || 
                  (property.location && property.location.latitude) || null;
                  
  const longitude = property.longitude || property.lng || property.lon || 
                   (property.coordinates && property.coordinates.lng) || 
                   (property.location && property.location.longitude) || null;
  // Check if we have valid coordinates
  const hasValidCoordinates = latitude !== null && longitude !== null && 
                             !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
  // Generate Google Maps URL if coordinates are valid
  const getGoogleMapsUrl = () => {
    if (!hasValidCoordinates) return null;
    return `https://www.google.com/maps/search/?api=1&query=${parseFloat(latitude)},${parseFloat(longitude)}`;
  };
  return (
    <div className="property-item">
      <div className="property-image-container">
        <div className="property-gallery">
          {property.images && property.images.length > 0 ? (
            <>
              <div className="gallery-preview" onClick={() => toggleCarousel(property.id)}>
                <img 
                  src={getImageUrl(property.images[activeImageIndex[property.id] || 0])} 
                  alt={`${property.title || 'Property'} - Image ${(activeImageIndex[property.id] || 0) + 1}`}
                  className="preview-image"
                />
                <div className="gallery-controls">
                  <button 
                    className="gallery-nav prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageNavigation(property.id, 'prev');
                    }}
                  >
                    &lt;
                  </button>
                  <span className="image-counter">
                    {(activeImageIndex[property.id] || 0) + 1}/{property.images.length}
                  </span>
                  <button 
                    className="gallery-nav next"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageNavigation(property.id, 'next');
                    }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
              
              {isCarouselOpen[property.id] && (
                <div className="fullscreen-carousel">
                  <button className="close-carousel" onClick={() => toggleCarousel(property.id)}>
                    &times;
                  </button>
                  <div className="carousel-container">
                    <button 
                      className="carousel-nav prev"
                      onClick={() => handleImageNavigation(property.id, 'prev')}
                    >
                      &lt;
                    </button>
                    <div className="carousel-image-container">
                      <img 
                        src={getImageUrl(property.images[activeImageIndex[property.id] || 0])} 
                        alt={`${property.title || 'Property'} - Image ${(activeImageIndex[property.id] || 0) + 1}`}
                        className="carousel-image"
                      />
                    </div>
                    <button 
                      className="carousel-nav next"
                      onClick={() => handleImageNavigation(property.id, 'next')}
                    >
                      &gt;
                    </button>
                  </div>
                  <div className="carousel-counter">
                    {(activeImageIndex[property.id] || 0) + 1}/{property.images.length}
                  </div>
                </div>
              )}
            </>   
          ) : (
            <div className="no-images">
              <span className="no-images-text">No images available</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="property-content-container">
        <div className="property-header">
          <h3 className="property-title">{property.title || 'Not specified'}</h3>
          <span className={`property-badge ${property.status || 'active'}`}>
            {property.status || 'Active'}
          </span>
          <div className="property-actions">
            {/* Edit button removed */}
            <button className="delete-property-button" onClick={() => handlePropertyDelete(property.id)}>
              Delete
            </button>
          </div>
        </div>
        
        <div className="property-tabs">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab[property.id] === 'details' ? 'active' : ''}`}
              onClick={() => handleTabChange(property.id, 'details')}
            >
              Details
            </button>
            <button 
              className={`tab-button ${activeTab[property.id] === 'location' ? 'active' : ''}`}
              onClick={() => handleTabChange(property.id, 'location')}
            >
              Location
            </button>
            <button 
              className={`tab-button ${activeTab[property.id] === 'amenities' ? 'active' : ''}`}
              onClick={() => handleTabChange(property.id, 'amenities')}
            >
              Amenities
            </button>
            <button 
              className={`tab-button ${activeTab[property.id] === 'inquiries' ? 'active' : ''}`}
              onClick={() => handleTabChange(property.id, 'inquiries')}
            >
              Inquiries
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab[property.id] === 'details' && (
              <div className="scrollable-tab-content">
                <div className="detail-section">
                  <h4 className="section-title">Property Details</h4>
                  <div className="property-info-grid">
                    <div className="info-item">
                      <span className="info-label">Listed On: </span>
                      <span className="info-value">
                        {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'Not specified'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type: </span>
                      <span className="info-value">
                        {propertyType}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Listing: </span>
                      <span className="info-value">
                        {listingTypeDisplay}
                      </span>
                    </div>
                  </div>
                  <div className="property-info-grid">
                    <div className="info-item">
                      <span className="info-label">Price</span>
                      <span className="info-value">
                        {property.price ? `₹${parseInt(property.price).toLocaleString()}` : 'Not specified'}
                        {property.price && listingTypeDisplay === 'For Rent' && <small>/month</small>}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Bedrooms</span>
                      <span className="info-value">{property.bedrooms || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Bathrooms</span>
                      <span className="info-value">{property.bathrooms || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Area</span>
                      <span className="info-value">{property.area ? `${property.area} sq ft` : 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Available From</span>
                      <span className="info-value">
                        {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Immediately'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4 className="section-title">Description</h4>
                  <p>{property.description || 'Not specified'}</p>
                </div>
              </div>
            )}
            
            {activeTab[property.id] === 'location' && (
              <div className="scrollable-tab-content">
                <div className="detail-section">
                  <h4 className="section-title">Property Location</h4>
                  <div className="location-compact">
                    <div className="address-line">
                      <span className="icon">📍</span>
                      <span>{property.address || 'Not specified'}</span>
                    </div>
                    <div className="address-line">
                      <span className="icon">🏙️</span>
                      <span>
                        {property.city || 'Not specified'}
                        {property.city && property.state ? ', ' : ''}
                        {property.state || ''}
                        {(property.city || property.state) && property.pincode ? ' - ' : ''}
                        {property.pincode || ''}
                      </span>
                    </div> 
                    {/* Coordinates section */}
                    <div className="coordinates-section">
                      {/* Google Maps link if coordinates are valid */}
                      {hasValidCoordinates && (
                        <div className="map-link-container">
                          <a 
                            href={getGoogleMapsUrl()} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="view-on-map-button"
                          >
                            View on Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {property.nearbyPlaces && (
                  <div className="detail-section">
                    <h4 className="section-title">Nearby Places</h4>
                    <div className="property-info-grid">
                      {typeof property.nearbyPlaces === 'object' ? (
                        Object.entries(property.nearbyPlaces).map(([place, distance]) => (
                          <div key={place} className="info-item">
                            <span className="info-label">{place}</span>
                            <span className="info-value">{distance || 'Not specified'}</span>
                          </div>
                        ))
                      ) : (
                        <p>{property.nearbyPlaces}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab[property.id] === 'amenities' && (
              <div className="scrollable-tab-content">
                <div className="detail-section">
                  <h4 className="section-title">Amenities</h4>
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="amenities-tags">
                      {property.amenities.map((amenity, index) => (
                        <span key={index} className="amenity-tag">{amenity}</span>
                      ))}
                    </div>
                  ) : (
                    <p>No amenities specified for this property.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* New tab for property-specific inquiries */}
            {activeTab[property.id] === 'inquiries' && (
              <div className="scrollable-tab-content">
                <div className="detail-section">
                  <PropertyNotifications userId={userData?.id} propertyId={property.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MyProperties = ({ userData }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [isCarouselOpen, setIsCarouselOpen] = useState({});

  useEffect(() => {
    if (userData && userData.id) {
      fetchMyProperties();
    }
  }, [userData]);

  const fetchMyProperties = async () => {
    try {
      setLoading(true);
      
      // Check if userData exists
      if (!userData || !userData.id) {
        setError('User information is missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token is missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      const requestUrl = 'http://localhost:5000/api/properties/user';
      
      console.log(`Making request to: ${requestUrl}`);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      console.log(`Response status: ${response.status}`);
      
      // Check if response is not OK
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Server returned ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            // For non-JSON responses, get the text
            const textResponse = await response.text();
            console.error("Non-JSON response received:", textResponse.substring(0, 500) + "...");
            errorMessage = `Server returned ${response.status}. Non-JSON response received.`;
          }
        } catch (parseError) {
          errorMessage = `Server returned ${response.status} with invalid response format`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      console.log(`Response content type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        // Try to log the actual response content
        const textResponse = await response.text();
        console.error("Expected JSON but received:", textResponse.substring(0, 500) + "...");
        throw new Error(`Expected JSON response but got ${contentType || 'unknown'} content type`);
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log("Fetched properties:", data);
      
      // Process the properties data
      const processedProperties = data.map(property => {
        // Parse JSON strings if needed
        let images = property.images;
        let amenities = property.amenities;
        let coordinates = null;
        
        try {
          if (typeof property.images === 'string') {
            images = JSON.parse(property.images);
          }
          if (typeof property.amenities === 'string') {
            amenities = JSON.parse(property.amenities);
          }
          // Parse coordinates if stored as JSON string
          if (typeof property.coordinates === 'string') {
            coordinates = JSON.parse(property.coordinates);
          }
        } catch (e) {
          console.error("Error parsing property JSON fields:", e);
        }
        
        // Extract coordinate values with fallbacks
        const latitude = property.latitude || 
                        (coordinates && coordinates.lat) || 
                        (property.location && property.location.latitude);
                        
        const longitude = property.longitude || 
                         (coordinates && coordinates.lng) || 
                         (property.location && property.location.longitude);
        
        return {
          ...property,
          images: images || [],
          amenities: amenities || [],
          latitude: latitude || null,
          longitude: longitude || null,
          toggleStatus: togglePropertyStatus
        };
      });
      
      console.log("Processed properties:", processedProperties);
      
      setProperties(processedProperties);
      
      // Initialize active tabs and images
      const tabs = {};
      const imageIndices = {};
      const carouselState = {};
      processedProperties.forEach(property => {
        tabs[property.id] = 'details';
        imageIndices[property.id] = 0;
        carouselState[property.id] = false;
      });
      setActiveTabs(tabs);
      setActiveImageIndex(imageIndices);
      setIsCarouselOpen(carouselState);
      
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.message || 'Failed to fetch your properties');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (propertyId, tab) => {
    setActiveTabs(prev => ({
      ...prev,
      [propertyId]: tab
    }));
  };

  const handlePropertyDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Authentication token is missing. Please log in again.');
          return;
        }
        
        const requestUrl = `http://localhost:5000/api/properties/${propertyId}`;
        
        const response = await fetch(requestUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          // Remove the property from the state
          setProperties(prev => prev.filter(property => property.id !== propertyId));
          alert('Property deleted successfully!');
        } else {
          let errorMessage = 'Failed to delete property';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            }
          } catch (e) {
            errorMessage = `Server returned ${response.status}`;
          }
          alert(errorMessage);
        }
      } catch (error) {
        alert('An error occurred while deleting the property');
        console.error('Error deleting property:', error);
      }
    }
  };

  const togglePropertyStatus = async (propertyId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update property status');
      }
      
      // Update local state
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property.id === propertyId 
            ? { ...property, is_active: !currentStatus } 
            : property
        )
      );
      
    } catch (err) {
      console.error('Error updating property status:', err);
    }
  };

  const handleImageNavigation = (propertyId, direction) => {
    setActiveImageIndex(prev => {
      const property = properties.find(p => p.id === propertyId);
      if (!property || !property.images || property.images.length === 0) return prev;
      
      const currentIndex = prev[propertyId] || 0;
      const imageCount = property.images.length;
      
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % imageCount;
      } else {
        newIndex = (currentIndex - 1 + imageCount) % imageCount;
      }
      
      return {
        ...prev,
        [propertyId]: newIndex
      };
    });
  };

  const toggleCarousel = (propertyId) => {
    setIsCarouselOpen(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  if (loading) {
    return <div className="loading-container">Loading your properties...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (properties.length === 0) {
    return (
      <div className="no-properties-container">
        <h2>No Properties Found</h2>
        <p>You haven't added any properties yet.</p>
        <button className="add-property-btn" onClick={() => window.location.href = '/add-property'}>
          Add Your First Property
        </button>
      </div>
    );
  }

  return (
    <div className="my-properties-container">
      <div className="my-properties-header">
        <h2>My Properties</h2>
      </div>
      <div className="properties-list">
        {properties.map(property => (
          <PropertyItem
            key={property.id}
            property={property}
            activeTab={activeTabs}
            handleTabChange={handleTabChange}
            activeImageIndex={activeImageIndex}
            toggleCarousel={toggleCarousel}
            handleImageNavigation={handleImageNavigation}
            handlePropertyDelete={handlePropertyDelete}
            isCarouselOpen={isCarouselOpen}
            userData={userData}
          />
        ))}
      </div>
    </div>
  );
};

export default MyProperties;