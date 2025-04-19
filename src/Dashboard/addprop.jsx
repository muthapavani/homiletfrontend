import React, { useState, useEffect, useRef } from 'react';
import './addprop.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const AddProperty = ({ userData }) => {
  // Updated state with owner fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'house',
    listingType: 'rent',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    amenities: [],
    images: [],
    ownerName: '', // Owner name field
    ownerMobile: '', // Owner mobile field
    location: {
      lat: null,
      lng: null
    }
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const amenitiesList = [
    'Parking', 'Garden', 'Swimming Pool', 'Gym', 'Security', 
    'Furnished', 'Air Conditioning', 'Balcony', 'Elevator', 'Pet Friendly'
  ];

  // Initialize map with Leaflet/StreetMap API
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Default center (India)
      const defaultPosition = [20.5937, 78.9629];
      
      // Create Leaflet map
      const map = L.map(mapRef.current).setView(defaultPosition, 5);
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Create marker
      const marker = L.marker(defaultPosition, {
        draggable: true
      }).addTo(map);
      
      // Store references
      mapInstanceRef.current = map;
      markerRef.current = marker;
      
      // Add event listener for marker drag end
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.lat,
            lng: position.lng
          }
        }));
        
        // Perform reverse geocoding when marker is dragged
        reverseGeocode(position.lat, position.lng);
      });
      
      // Add event listener for map click
      map.on('click', (e) => {
        const position = e.latlng;
        marker.setLatLng(position);
        
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.lat,
            lng: position.lng
          }
        }));
        
        // Perform reverse geocoding with the clicked position
        reverseGeocode(position.lat, position.lng);
      });
      
      setMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMessage({ text: 'Map functionality disabled. Continue filling other fields.', type: 'error' });
      setMapLoaded(true); // Still mark as loaded to prevent further errors
    }
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Perform geocoding with OSM Nominatim
  const geocodeAddress = async (query) => {
    if (!query.trim()) return null;
    
    try {
      setIsSearching(true);
      setMessage({ text: 'Searching location...', type: 'info' });
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setMessage({ text: 'Location found!', type: 'success' });
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name
        };
      } else {
        setMessage({ text: 'No results found for this location', type: 'error' });
        return null;
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      if (error.name === 'AbortError') {
        setMessage({ text: 'Location search timed out. Please try again.', type: 'error' });
      } else {
        setMessage({ text: 'Error searching location. Please try again.', type: 'error' });
      }
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  // Perform reverse geocoding with OSM Nominatim
  const reverseGeocode = async (lat, lng) => {
    if (!lat || !lng) return;
    
    try {
      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Update form data with retrieved address components
        setFormData(prev => ({
          ...prev,
          address: [address.road, address.house_number].filter(Boolean).join(', ') || prev.address,
          city: address.city || address.town || address.village || prev.city,
          state: address.state || prev.state,
          pincode: address.postcode || prev.pincode
        }));
        
        // Also update search query for consistency
        const newAddressQuery = [
          [address.road, address.house_number].filter(Boolean).join(', '),
          address.city || address.town || address.village,
          address.state,
          address.postcode
        ].filter(Boolean).join(', ');
        
        setSearchQuery(newAddressQuery);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      if (error.name === 'AbortError') {
        // Don't show error to user for reverse geocoding timeouts
        console.log('Reverse geocoding timed out');
      }
    }
  };

  const getUserLocation = () => {
    // First check if map is initialized
    if (!mapInstanceRef.current || !markerRef.current) {
      setMessage({ text: 'Map is not ready yet. Please try again in a moment.', type: 'error' });
      return;
    }
  
    setMessage({ text: 'Requesting your location...', type: 'info' });
    
    // Check for geolocation support
    if (!navigator.geolocation) {
      setMessage({ text: 'Geolocation is not supported by your browser', type: 'error' });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        try {
          // Extract and validate coordinates
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Explicit validation of coordinates
          if (typeof lat !== 'number' || isNaN(lat) || 
              typeof lng !== 'number' || isNaN(lng) || 
              lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error('Invalid coordinates received');
          }
          
          console.log('Valid location coordinates obtained:', lat, lng);
          
          // Get the current refs to ensure we're working with the latest instances
          const map = mapInstanceRef.current;
          const marker = markerRef.current;
          
          if (!map || !marker) {
            throw new Error('Map or marker reference not available');
          }
          
          // Set location with validated coordinates
          const userLocation = { lat, lng };
          
          // Update marker position with validated coordinates
          marker.setLatLng([lat, lng]);
          
          // Update map view with animation
          map.setView([lat, lng], 16, {
            animate: true,
            duration: 1.0
          });
          
          // Update form data with new location
          setFormData(prev => ({
            ...prev,
            location: userLocation
          }));
          
          setMessage({ text: 'Your location has been set!', type: 'success' });
          
          // Perform reverse geocoding with validated coordinates
          reverseGeocode(lat, lng);
        } catch (err) {
          console.error('Error processing location:', err);
          setMessage({ 
            text: `Error processing your location: ${err.message}. Please try selecting manually.`, 
            type: 'error' 
          });
        }
      },
      // Error callback
      (error) => {
        console.error('Geolocation error:', error);
        
        // Provide specific messages based on error code
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setMessage({ 
              text: 'Location permission denied. Please enable location access in your browser settings.', 
              type: 'error' 
            });
            break;
          case error.POSITION_UNAVAILABLE:
            setMessage({ 
              text: 'Location information is unavailable. Try selecting manually on the map.', 
              type: 'error' 
            });
            break;
          case error.TIMEOUT:
            setMessage({ 
              text: 'Location request timed out. Please try again or select manually.', 
              type: 'error' 
            });
            break;
          default:
            setMessage({ 
              text: 'Unknown error getting your location. Please select manually.', 
              type: 'error' 
            });
        }
      },
      // Options
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 15000,           // 15 second timeout
        maximumAge: 0             // Don't use cached position
      }
    );
  };

  // Other handlers remain the same
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      // Handle amenities checkboxes
      setFormData(prev => ({
        ...prev,
        amenities: checked 
          ? [...prev.amenities, value]
          : prev.amenities.filter(item => item !== value)
      }));
    } else if (type === 'file') {
      // Handle file uploads
      const selectedFiles = Array.from(files);
      
      // Limit to 5 images
      if (selectedFiles.length > 5) {
        setMessage({ text: 'Maximum 5 images allowed', type: 'error' });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        images: selectedFiles
      }));
      
      // Create preview URLs
      const previewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(previewUrls);
    } else {
      // Handle normal inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Clean up object URLs when component unmounts or when images change
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const validateForm = () => {
    // Basic validation
    if (!formData.title.trim()) return 'Property title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || formData.price <= 0) return 'Valid price is required';
    if (!formData.address.trim()) return 'Address is required';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.state.trim()) return 'State is required';
    if (!formData.pincode.trim()) return 'Pincode is required';
    if (formData.images.length === 0) return 'At least one image is required';
    if (!formData.ownerName.trim()) return 'Owner name is required';
    if (!formData.ownerMobile.trim()) return 'Owner mobile number is required';
    
    // Validate mobile number format (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.ownerMobile)) {
      return 'Please enter a valid 10-digit mobile number';
    }
    
    // Only validate location if map was successfully loaded
    if (mapLoaded && (!formData.location.lat || !formData.location.lng)) {
      return 'Please select a location on the map';
    }
    
    return null; // No errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validationError = validateForm();
    if (validationError) {
      setMessage({ text: validationError, type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Create FormData to handle file uploads
      const propertyFormData = new FormData();
      
      // Debug log the actual coordinates before form submission
      console.log('Location data before submission:', {
        lat: formData.location.lat,
        lng: formData.location.lng,
        type: typeof formData.location.lat,
        isNull: formData.location.lat === null,
        isNaN: isNaN(formData.location.lat)
      });
      
      // Log owner details for debugging
      console.log('Owner details before submission:', {
        ownerName: formData.ownerName,
        ownerMobile: formData.ownerMobile
      });
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          formData.images.forEach((image) => {
            propertyFormData.append('images', image);
          });
        } else if (key === 'amenities') {
          propertyFormData.append('amenities', JSON.stringify(formData.amenities));
        } else if (key === 'location') {
          // Enhanced coordinate handling
          if (formData.location && 
              formData.location.lat !== null && formData.location.lat !== undefined && 
              formData.location.lng !== null && formData.location.lng !== undefined) {
            
            // Explicitly convert to number and validate
            const lat = parseFloat(formData.location.lat);
            const lng = parseFloat(formData.location.lng);
            
            if (!isNaN(lat) && !isNaN(lng) && 
                lat >= -90 && lat <= 90 && 
                lng >= -180 && lng <= 180) {
                
              // Format with fixed precision to ensure proper string conversion
              propertyFormData.append('latitude', lat.toFixed(8));
              propertyFormData.append('longitude', lng.toFixed(8));
              
              // Debug log to verify the values
              console.log('Sending validated coordinates:', lat.toFixed(8), lng.toFixed(8));
            } else {
              throw new Error('Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180.');
            }
          } else {
            throw new Error('Please select a valid location on the map');
          }
        } else {
          propertyFormData.append(key, formData[key]);
        }
      });
      
      // Add user ID
      propertyFormData.append('userId', userData?.id || '');
      
      // Debug - log all values being sent
      for (let pair of propertyFormData.entries()) {
        if (pair[0] !== 'images') { // Skip logging images
          console.log(pair[0] + ': ' + pair[1]);
        }
      }
      
      // Use the environment variable for API URL if available, otherwise use a default
      const API_BASE_URL = 'https://homilet-backend-2.onrender.com';
      const apiUrl = `${API_BASE_URL}/api/properties`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          // Don't set Content-Type header when using FormData
        },
        body: propertyFormData,
        credentials: 'include'
      });
      
      // Parse response even if it's an error, to get more details
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText };
      }
      
      // Check for network or HTTP errors
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      setMessage({ text: 'Property added successfully!', type: 'success' });
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        propertyType: 'house',
        listingType: 'rent',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        amenities: [],
        images: [],
        ownerName: '',
        ownerMobile: '',
        location: {
          lat: null,
          lng: null
        }
      });
      setImagePreviewUrls([]);
      
    } catch (error) {
      console.error('Error adding property:', error);
      setMessage({ 
        text: error.message || 'Network or server error occurred', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Improved search map location function
  const searchMapLocation = async () => {
    if (!searchQuery.trim()) {
      setMessage({ text: 'Please enter a location to search', type: 'error' });
      return;
    }
    
    if (!mapInstanceRef.current || !markerRef.current) {
      setMessage({ text: 'Map not initialized. Please try again.', type: 'error' });
      return;
    }
    
    try {
      const geocodeResult = await geocodeAddress(searchQuery);
      
      if (geocodeResult) {
        // Update marker and map
        markerRef.current.setLatLng([geocodeResult.lat, geocodeResult.lng]);
        mapInstanceRef.current.setView([geocodeResult.lat, geocodeResult.lng], 16);
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          location: {
            lat: geocodeResult.lat,
            lng: geocodeResult.lng
          }
        }));
        
        // Perform reverse geocoding to get address details
        reverseGeocode(geocodeResult.lat, geocodeResult.lng);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setMessage({ text: 'Error searching location. Please try again.', type: 'error' });
    }
  };

  // Handle map search on Enter key press
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      searchMapLocation();
    }
  };

  return (
    <div className="add-property">
      <div className="add-property-header">
        <h2>Add New Property</h2>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="add-property-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Property Title*</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange}
                required
                placeholder="e.g., Modern 2BHK Apartment"
              />
            </div>
            
            <div className="form-group">
              <label>Property Type*</label>
              <select 
                name="propertyType" 
                value={formData.propertyType} 
                onChange={handleChange}
                required
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Listing Type*</label>
              <select 
                name="listingType" 
                value={formData.listingType} 
                onChange={handleChange}
                required
              >
                <option value="rent">For Rent</option>
                <option value="sell">For Sale</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Price* (₹)</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange}
                required
                min="1"
                placeholder="Property price or monthly rent"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description*</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              required
              placeholder="Describe your property with details..."
              rows="4"
            />
          </div>
        </div>
        
        {/* Owner Information Section */}
        <div className="form-section">
          <h3>Owner Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Owner Name*</label>
              <input 
                type="text" 
                name="ownerName" 
                value={formData.ownerName} 
                onChange={handleChange}
                required
                placeholder="Full name of property owner"
              />
            </div>
            
            <div className="form-group">
              <label>Whatsapp Mobile Number*</label>
              <input 
                type="tel" 
                name="ownerMobile" 
                value={formData.ownerMobile} 
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
              />
            </div>
          </div>
        </div>
        
        {/* Rest of the form remains the same */}
        <div className="form-section">
          <h3>Property Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Bedrooms</label>
              <input 
                type="number" 
                name="bedrooms" 
                value={formData.bedrooms} 
                onChange={handleChange}
                min="0"
                placeholder="Number of bedrooms"
              />
            </div>
            
            <div className="form-group">
              <label>Bathrooms</label>
              <input 
                type="number" 
                name="bathrooms" 
                value={formData.bathrooms} 
                onChange={handleChange}
                min="0"
                placeholder="Number of bathrooms"
              />
            </div>
            
            <div className="form-group">
              <label>Area (sq ft)</label>
              <input 
                type="number" 
                name="area" 
                value={formData.area} 
                onChange={handleChange}
                min="0"
                placeholder="Property area in sq ft"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Location</h3>
          
          <div className="map-container">
            <div className="map-search">
              <input
                type="text"
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="map-search-input"
              />
              <button 
                type="button" 
                onClick={searchMapLocation}
                disabled={isSearching || !searchQuery.trim()}
                className="map-search-button"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button 
                type="button" 
                onClick={getUserLocation}
                className="location-button"
              >
                Use My Location
              </button>
            </div>
            
            <div 
              ref={mapRef} 
              className="property-map"
              style={{ height: '300px', width: '100%', marginBottom: '20px' }}
            ></div>
            
            <div className="location-info">
              {formData.location.lat && formData.location.lng ? (
                <p className="location-coordinates">
                  Selected Location: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="location-prompt">Please select a location on the map*</p>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Address*</label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              required
              placeholder="Street address"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>City*</label>
              <input 
                type="text" 
                name="city" 
                value={formData.city} 
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>
            
            <div className="form-group">
              <label>State*</label>
              <input 
                type="text" 
                name="state" 
                value={formData.state} 
                onChange={handleChange}
                required
                placeholder="State"
              />
            </div>
            
            <div className="form-group">
              <label>Pincode*</label>
              <input 
                type="text" 
                name="pincode"
                value={formData.pincode} 
                onChange={handleChange}
                required
                pattern="[0-9]{6}"
                title="Please enter a valid 6-digit pincode"
                placeholder="Pincode"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Amenities</h3>
          
          <div className="amenities-container">
            {amenitiesList.map(amenity => (
              <div key={amenity} className="amenity-checkbox">
                <input 
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  name="amenities"
                  value={amenity}
                  checked={formData.amenities.includes(amenity)}
                  onChange={handleChange}
                />
                <label htmlFor={`amenity-${amenity}`}>{amenity}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h3>Property Images</h3>
          
          <div className="form-group">
            <label>Upload Images* (Max 5 images)</label>
            <input
              type="file"
              name="images"
              onChange={handleChange}
              accept="image/*"
              multiple
              required={imagePreviewUrls.length === 0}
              className="file-input"
            />
            <small>Supported formats: JPG, PNG, WEBP. Max file size: 5MB per image.</small>
            <div className="image-preview-container">
              {imagePreviewUrls.length > 0 && imagePreviewUrls.map((url, index) => (
                <div key={index} className="image-preview">
                  <img src={url} alt={`Preview ${index}`} />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={() => {
                      const newImages = [...formData.images];
                      newImages.splice(index, 1);
                      setFormData({...formData, images: newImages});
                      
                      const newUrls = [...imagePreviewUrls];
                      URL.revokeObjectURL(newUrls[index]);
                      newUrls.splice(index, 1);
                      setImagePreviewUrls(newUrls);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Property...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProperty;
