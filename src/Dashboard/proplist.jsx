import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './proplist.css';

const PropertyListing = ({ userData, searchQuery, category, searchActive = false, searchResults = null, noResultsFound = false }) => {
  // Define the API base URL for image paths
  const API_BASE_URL = "https://homilet-backend-2.onrender.com";
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [filters, setFilters] = useState({
    propertyType: 'all',
    listingType: 'all',
    bhkType: 'all',
    minPrice: '',
    maxPrice: ''
  });

  // Define minimum items to show per section
  const MIN_ITEMS_TO_SHOW = {
    houses: 9,
    apartments: 9,
    villas: 9,
    lands: 9,
    commercial: 9
  };

  // Set initial filters based on category
  useEffect(() => {
    let newFilters = { ...filters };
    
    // Reset ALL filters when no category is selected (on dashboard homepage)
    if (!category || category === 'dashboard') {
      newFilters = {
        propertyType: 'all',
        listingType: 'all',
        bhkType: 'all',
        minPrice: '',
        maxPrice: ''
      };
    } else {
      // Handle other categories
      switch (category) {
        case 'homes':
          newFilters.propertyType = 'house';
          newFilters.listingType = 'all';
          break;
        case 'rent':
          newFilters.propertyType = 'all';
          newFilters.listingType = 'rent';
          break;
        case 'sale':  
          newFilters.propertyType = 'all';
          newFilters.listingType = 'sale';
          break;
        case 'lands':
          newFilters.propertyType = 'land';
          newFilters.listingType = 'all';
          break;
        default:
          newFilters.propertyType = 'all';
          newFilters.listingType = 'all';
      }
    }
    
    setFilters(newFilters);
  }, [category]);

  // Fetch properties when component mounts or category changes
  useEffect(() => {
    if (!searchActive) {
      fetchProperties();
    }
  }, [category, searchActive]); 

  // FIXED: Improved normalization function for listing types
  const normalizeListingType = (listingType) => {
    if (!listingType) return 'unknown';
    
    const normalized = String(listingType).toLowerCase().trim();
    
    // Sale-related terms
    if (['sale', 'sell', 'buy', 'purchase', 'selling', 'forsale', 'for-sale', 'for sale'].includes(normalized)) {
      return 'sale';
    }
    
    // Rent-related terms
    if (['rent', 'rental', 'renting', 'lease', 'forrent', 'for-rent', 'for rent'].includes(normalized)) {
      return 'rent';
    }
    
    return normalized;
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/properties`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
  
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid JSON response from server");
      }
  
      const data = await response.json();
      
      // Process the data to ensure all properties have the required fields
      const processedData = data.map(property => {
        // Create a valid images array if it doesn't exist or is invalid
        let images = [];
        
        if (property.images) {
          try {
            // If images is stored as a JSON string, parse it
            if (typeof property.images === 'string') {
              try {
                images = JSON.parse(property.images);
              } catch (e) {
                // If parsing fails, treat it as a single URL
                images = [property.images];
              }
            } 
            // If images is already an array
            else if (Array.isArray(property.images)) {
              images = property.images;
            }
          } catch (error) {
            console.error(`Error processing images for property ${property.id}:`, error);
            images = [];
          }
        }
        
        // FIXED: Use the dedicated normalization function
        const normalizedListingType = normalizeListingType(property.listing_type);
        
        // For debugging - log each property's normalized listing type
        console.log(`Property ${property.id} listing_type: ${property.listing_type} → normalized: ${normalizedListingType}`);
        
        return {
          ...property,
          images: images,
          listing_type: normalizedListingType // Always use normalized value
        };
      });
      
      setProperties(processedData);
      
      // Debug: Log filters and processed data
      console.log("Current filters:", filters);
      console.log("Total properties loaded:", processedData.length);
      console.log("Properties by listing type:", {
        'sale': processedData.filter(p => p.listing_type === 'sale').length,
        'rent': processedData.filter(p => p.listing_type === 'rent').length,
        'other/unknown': processedData.filter(p => p.listing_type !== 'sale' && p.listing_type !== 'rent').length
      });
      
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  
  // Handle filter change logic - FIXED to ensure values are properly normalized
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name} = ${value}`);
    
    // FIXED: Normalize listing type value for consistent comparison
    if (name === 'listingType') {
      const normalizedValue = normalizeListingType(value);
      console.log(`Normalized listing type filter value: ${value} → ${normalizedValue}`);
      
      setFilters(prev => ({
        ...prev,
        [name]: normalizedValue
      }));
    } else {
      // For other filters, use value directly
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Add more debug info
    console.log(`Updated filter ${name} to: ${value}`);
  };

  // Clear filters function
  const clearFilters = useCallback(() => {
    // Create a new filter object
    const resetFilters = {
      propertyType: 'all',
      listingType: 'all',
      bhkType: 'all',
      minPrice: '',
      maxPrice: ''
    };
    
    // Update the filters state with the new object
    setFilters(resetFilters);
    
    // If we're on a specific category view, navigate back to dashboard
    if (category !== 'dashboard') {
      navigate('/dashboard');
    }
  }, [category, navigate]);

  const handleImageError = useCallback((propertyId) => {
    setImageErrors(prev => ({
      ...prev,
      [propertyId]: true
    }));
  }, []);

  // Helper function to properly format image URLs
  const formatImageUrl = useCallback((imagePath) => {
    // If the path already starts with http:// or https://, it's already a full URL
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      return imagePath;
    }
    
    // Otherwise, prepend the API base URL to complete the path
    return `${API_BASE_URL}${imagePath}`;
  }, [API_BASE_URL]);

  // Toggle the expanded state for a section
  const toggleSectionExpansion = useCallback((sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  }, []);

  // Improved search query filter function - handles BHK and general search
  const applySearchQuery = useCallback((property, query) => {
    if (!query) return true;
    
    // Skip properties without a title
    if (!property.title) return false;
    
    const propertyTitleLower = property.title.toLowerCase().trim();
    const propertyDescriptionLower = property.description ? property.description.toLowerCase().trim() : '';
    const propertyLocationLower = property.city ? property.city.toLowerCase().trim() : '';
    const searchLower = query.toLowerCase().trim();
    
    // Check for BHK search
    const bhkRegex = /(\d+)[\s-]?bhk/i;
    const propertyBhkMatch = propertyTitleLower.match(bhkRegex);
    const queryBhkMatch = searchLower.match(bhkRegex);
    
    // If query is explicitly searching for BHK
    if (queryBhkMatch) {
      const queryBhkNumber = queryBhkMatch[1];
      
      // Check property title for BHK
      if (propertyBhkMatch && propertyBhkMatch[1] === queryBhkNumber) {
        return true;
      }
      
      // Check property bedrooms field
      if (property.bedrooms !== undefined && property.bedrooms.toString() === queryBhkNumber) {
        return true;
      }
      
      return false;
    }
    
    // General search - check if any relevant field contains the search term
    return propertyTitleLower.includes(searchLower) || 
           propertyDescriptionLower.includes(searchLower) || 
           propertyLocationLower.includes(searchLower);
  }, []);

  // FIXED: Apply filters with proper logging and consistent comparison
  const applyFilters = useCallback((property) => {
    // Property Type Filter
    if (filters.propertyType !== 'all' && property.property_type !== filters.propertyType) {
      return false;
    }
    
    // FIXED: Listing Type Filter with improved comparison
    if (filters.listingType !== 'all') {
      // Normalize property's listing type again for absolutely consistent comparison
      const normalizedPropertyListingType = normalizeListingType(property.listing_type);
      const normalizedFilterListingType = normalizeListingType(filters.listingType);
      
      // Add debug logging with both original and normalized values
      console.log(`Comparing property ${property.id}: 
        property.listing_type="${property.listing_type}" (normalized: "${normalizedPropertyListingType}") 
        with filters.listingType="${filters.listingType}" (normalized: "${normalizedFilterListingType}")`);
      
      // Check if property's normalized listing type matches the normalized filter
      if (normalizedPropertyListingType !== normalizedFilterListingType) {
        console.log(`Property ${property.id} filtered out: listing type mismatch`);
        return false;
      }
    }
    
    // BHK Type Filter
    if (filters.bhkType !== 'all') {
      // Convert BHK type to a number
      const filterBhkNumber = parseInt(filters.bhkType);
      
      // Get property bedrooms as a number
      let propertyBedrooms = 0;
      
      if (property.bedrooms !== null && property.bedrooms !== undefined) {
        if (typeof property.bedrooms === 'string') {
          const match = property.bedrooms.match(/(\d+)/);
          propertyBedrooms = match ? parseInt(match[0]) : 0;
        } else {
          propertyBedrooms = parseInt(property.bedrooms) || 0;
        }
      }
      
      // Check title for BHK if bedrooms field isn't conclusive
      if (propertyBedrooms === 0 && property.title) {
        const titleMatch = property.title.match(/(\d+)[\s-]?bhk/i);
        if (titleMatch) {
          propertyBedrooms = parseInt(titleMatch[1]);
        }
      }
      
      if (propertyBedrooms !== filterBhkNumber) {
        return false;
      }
    }
    
    // Price Range Filters
    if (filters.minPrice && (!property.price || property.price < parseInt(filters.minPrice))) {
      return false;
    }
    
    if (filters.maxPrice && (!property.price || property.price > parseInt(filters.maxPrice))) {
      return false;
    }
    
    return true;
  }, [filters, normalizeListingType]);

  // Memoize filtered properties to prevent recalculations
  const filteredProperties = useMemo(() => {
    // Use search results if available and search is active
    if (searchActive && searchResults) {
      return searchResults;
    }
    
    // Debug: Log current filters state before filtering
    console.log("Filtering with:", filters);
    
    const filtered = properties.filter(property => {
      // First apply search query filter
      if (searchQuery && !applySearchQuery(property, searchQuery)) {
        return false;
      }
      
      // Then apply all other filters
      return applyFilters(property);
    });
    
    // Debug: Log filtered results
    console.log(`Filtered properties: ${filtered.length} of ${properties.length} total`);
    console.log("Filtered properties by listing type:", {
      'sale': filtered.filter(p => p.listing_type === 'sale').length,
      'rent': filtered.filter(p => p.listing_type === 'rent').length,
      'other/unknown': filtered.filter(p => p.listing_type !== 'sale' && p.listing_type !== 'rent').length
    });
    
    return filtered;
  }, [properties, searchQuery, applySearchQuery, applyFilters, filters, searchActive, searchResults]);

  // Group properties by type
  const propertiesByType = useMemo(() => {
    return {
      houses: filteredProperties.filter(property => 
        property.property_type === 'house'
      ),
      apartments: filteredProperties.filter(property => 
        property.property_type === 'apartment'
      ),
      villas: filteredProperties.filter(property => 
        property.property_type === 'villa'
      ),
      lands: filteredProperties.filter(property => 
        property.property_type === 'land'
      ),
      commercial: filteredProperties.filter(property => 
        property.property_type === 'commercial'
      )
    };
  }, [filteredProperties]);

  // Handle View Details button click
  const handleViewDetails = useCallback((propertyId) => {
    navigate(`/dashboard/property/${propertyId}`);
  }, [navigate]);

  // Fallback image based on property type
  const getFallbackImage = useCallback((propertyType) => {
    const typeText = propertyType?.charAt(0).toUpperCase() + (propertyType?.slice(1) || '');
    return `https://via.placeholder.com/400x300?text=${typeText || 'Property'}`;
  }, []);

  // Check if any filters are active or search query exists
  const hasActiveFilters = useMemo(() => {
    return filters.propertyType !== 'all' || 
           filters.listingType !== 'all' || 
           filters.bhkType !== 'all' || 
           filters.minPrice !== '' || 
           filters.maxPrice !== '' ||
           searchQuery !== '';
  }, [filters, searchQuery]);

  const renderPropertyCard = useCallback((property) => {
    // Safely check if property has images
    let validImageUrl = null;
  
    if (property.images) {
      // Get the first valid image if available
      if (Array.isArray(property.images) && property.images.length > 0 && !imageErrors[property.id]) {
        validImageUrl = formatImageUrl(property.images[0]);
      }
    }
    
    // Use the formatted image URL or fallback
    const imageUrl = validImageUrl || getFallbackImage(property.property_type);

    const propertyTypeIcon = {
      'house': '🏠',
      'apartment': '🏢',
      'villa': '🏛️',
      'land': '🏞️',
      'commercial': '🏪'
    }[property.property_type] || '🏡';

    // FIXED: Badge logic using normalized values with explicit handling of sale/rent
    const normalizedType = normalizeListingType(property.listing_type);
    const listingBadge = normalizedType === 'rent' ? 'For Rent' : 
                         normalizedType === 'sale' ? 'For Sale' : 
                         'Unknown Listing';

    return (
      <div key={property.id} className="property-card">
        <div className="property-image">
          <img 
            src={imageUrl} 
            alt={property.title || 'Property'} 
            onError={() => handleImageError(property.id)}
          />
          <div className="property-badge">
            {listingBadge}
          </div>
        </div>
        
        <div className="property-content">
          <h3 className="property-title">
            {propertyTypeIcon} {property.title || 'Unnamed Property'}
          </h3>
          
          <p className="property-location">
            <i className="location-icon">📍</i> {property.city || 'Unknown Location'}
            {property.state ? `, ${property.state}` : ''}
          </p>
          
          <div className="property-features">
            {property.bedrooms !== undefined && (
              <div className="feature">
                <span className="feature-icon">🛏️</span>
                <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="feature">
                <span className="feature-icon">🚿</span>
                <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
              </div>
            )}
            
            {property.area && (
              <div className="feature">
                <span className="feature-icon">📏</span>
                <span>{property.area} sq ft</span>
              </div>
            )}
          </div>
          
          <div className="property-footer">
            <div className="property-price">
              {property.price !== undefined 
                ? `₹${property.price.toLocaleString()}`
                : 'Price on request'
              }
              {normalizedType === 'rent' && <span>/month</span>}
            </div>
            
            <button 
              className="view-details-button" 
              onClick={() => handleViewDetails(property.id)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }, [formatImageUrl, getFallbackImage, handleImageError, handleViewDetails, imageErrors, normalizeListingType]);

  const renderPropertySection = useCallback((title, properties, sectionKey) => {
    if (properties.length === 0) {
      return null;
    }
    
    const isExpanded = expandedSections[sectionKey] || false;
    const minItemsToShow = MIN_ITEMS_TO_SHOW[sectionKey] || 9;
    const hasMoreItems = properties.length > minItemsToShow;
    
    // Determine how many items to display
    const displayProperties = isExpanded 
      ? properties 
      : properties.slice(0, minItemsToShow);
    
    return (
      <div className="property-section">
        <div className="section-header">
          <h2 className="section-heading">{title}</h2>
          {hasMoreItems && (
            <button 
              className="view-more-button" 
              onClick={() => toggleSectionExpansion(sectionKey)}
              aria-label={isExpanded ? "View less" : "View more"}
            >
              {isExpanded ? 'View Less' : `View More (${properties.length - minItemsToShow})`} 
              <span className="arrow-icon">{isExpanded ? '↑' : '↓'}</span>
            </button>
          )}
        </div>
        <div className="properties-grid">
          {displayProperties.map(property => renderPropertyCard(property))}
        </div>
      </div>
    );
  }, [expandedSections, renderPropertyCard, toggleSectionExpansion]);

  // Section visibility logic
  const shouldShowSection = useCallback((sectionKey) => {
    // First check if this section has any properties after filtering
    if (propertiesByType[sectionKey].length === 0) {
      return false;
    }
    
    // For property type filters, only show the selected section
    if (filters.propertyType !== 'all') {
      const sectionToTypeMap = {
        'houses': 'house',
        'apartments': 'apartment',
        'villas': 'villa',
        'lands': 'land',
        'commercial': 'commercial'
      };
      
      return sectionToTypeMap[sectionKey] === filters.propertyType;
    }
    
    // For category-based display
    if (category === 'lands') {
      return sectionKey === 'lands';
    }
    
    if (category === 'homes') {
      return ['houses', 'apartments', 'villas'].includes(sectionKey);
    }

    if (category === 'sale') {
      return ['houses', 'apartments', 'villas', 'lands', 'commercial'].includes(sectionKey);
    }
    
    return true;
  }, [category, filters.propertyType, propertiesByType]);

  // Function that handles both filter reset and navigation
  const handleResetFiltersAndGoHome = useCallback(() => {
    // Reset filters
    setFilters({
      propertyType: 'all',
      listingType: 'all',
      bhkType: 'all',
      minPrice: '',
      maxPrice: ''
    });
    
    // Navigate to dashboard
    navigate('/dashboard');
  }, [navigate]);

  // Debug component re-renders
  console.log("Component rendering. Current state:", {
    filters,
    category,
    filteredCount: filteredProperties.length,
    hasActiveFilters,
    searchActive
  });

  // Determine whether to show no results message
  const showNoResults = noResultsFound || 
    (!loading && !error && filteredProperties.length === 0);

  return (
    <div className="property-listing">
      <div className="property-listing-header">
        <h2>
          {searchActive ? 'Search Results' :
           !category || category === 'dashboard' ? 'All Properties' :
           category === 'homes' ? 'Homes' : 
           category === 'rent' ? 'Properties For Rent' : 
           category === 'sale' ? 'Properties For Sale' : 
           category === 'lands' ? 'Land Properties' : 
           'Available Properties'}
           {filters.bhkType !== 'all' ? ` - ${filters.bhkType} BHK` : ''}
           {searchQuery ? ` for "${searchQuery}"` : ''}
        </h2>
        
        {/* Only show filters when not in search mode */}
        {!searchActive && (
          <div className="filter-container">
            <div className="filter-group">
              <select 
                name="propertyType" 
                value={filters.propertyType}
                onChange={handleFilterChange}
                aria-label="Filter by property type"
              >
                <option value="all">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                name="listingType" 
                value={filters.listingType}
                onChange={handleFilterChange}
                aria-label="Filter by listing type"
              >
                <option value="all">Rent & Sale</option>
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option> 
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                name="bhkType" 
                value={filters.bhkType}
                onChange={handleFilterChange}
                aria-label="Filter by BHK"
              >
                <option value="all">All BHK</option>
                <option value="1">1BHK</option>
                <option value="2">2BHK</option>
                <option value="3">3BHK</option>
                <option value="4">4BHK</option>
              </select>
            </div>
            
            <div className="filter-group price-range">
              <input 
                type="number" 
                name="minPrice" 
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min ₹"
                aria-label="Minimum price"
              />
              <span className="price-separator">-</span>
              <input 
                type="number" 
                name="maxPrice" 
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max ₹"
                aria-label="Maximum price"
              />
            </div>
            
            {hasActiveFilters && (
              <div className="filter-group">
                <button 
                  onClick={handleResetFiltersAndGoHome}
                  className="clear-filters-button"
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Show search results count if in search mode */}
        {searchActive && filteredProperties.length > 0 && (
          <div className="search-summary">
            Found {filteredProperties.length} properties matching your search
            <button 
              onClick={() => navigate('/dashboard')}
              className="back-to-dashboard-button"
            >
              Back to All Properties
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading properties...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <h3>Error Loading Properties</h3>
            <p>{error}</p>
            <button onClick={fetchProperties} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      ) : showNoResults ? (
        <div className="no-properties">
          <div className="empty-state-icon">🔍</div>
          <h3>No properties found</h3>
          <p>
            {searchActive ? 
              "No properties match your search criteria." : 
              "Try adjusting your filters to see more results."}
          </p>
          <button 
            onClick={searchActive ? () => navigate('/dashboard') : handleResetFiltersAndGoHome} 
            className="reset-filters-button"
          >
            {searchActive ? "Back to All Properties" : "Reset Filters"}
          </button>
        </div>
      ) : (
        <div className="property-sections-container">
          {shouldShowSection("houses") && 
            renderPropertySection("Houses", propertiesByType.houses, "houses")}
          
          {shouldShowSection("apartments") && 
            renderPropertySection("Apartments", propertiesByType.apartments, "apartments")}
          
          {shouldShowSection("villas") && 
            renderPropertySection("Villas", propertiesByType.villas, "villas")}
          
          {shouldShowSection("lands") && 
            renderPropertySection("Lands", propertiesByType.lands, "lands")}
          
          {shouldShowSection("commercial") && 
            renderPropertySection("Commercial Properties", propertiesByType.commercial, "commercial")}
        </div>
      )}
    </div>
  );
};

export default PropertyListing;