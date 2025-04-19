import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import ProfileSection from "./profile.jsx";
import PropertyListing from "./proplist.jsx";
import AddProperty from "./addprop.jsx";
import MyProperties from "./myprop.jsx";
import PropertyDetailsView from "./propdetview.jsx";
import "./dash.css";

// Guest Banner component to prompt login
const GuestBanner = () => {
  const navigate = useNavigate();
  
  return (
    <div className="guest-banner">
      <div className="guest-message">
        <h3>You're browsing as a guest</h3>
        <p>Sign in to access all features and save your preferences</p>
      </div>
      <div className="guest-actions">
        <button 
          className="login-btn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
        <button 
          className="register-btn"
          onClick={() => navigate("/signup")}
        >
          Register
        </button>
      </div>
    </div>
  );
};

// Protected route component that redirects guests to dashboard
const ProtectedRoute = ({ children, isGuest }) => {
  return isGuest ? <Navigate to="/dashboard" /> : children;
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [noResultsFound, setNoResultsFound] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    searchAll: true,  // Default to search all fields
    searchTitle: true,
    searchDescription: true,
    searchLocation: true,
    searchPrice: true,
    searchAmenities: true
  });
  const [searchController, setSearchController] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const topRef = useRef(null);
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);

  // Function to control body scroll
  const toggleBodyScroll = (disable) => {
    if (disable) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  };

  // Check if the viewport is mobile-sized
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 900);
    };
    
    // Initial check
    checkMobileView();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobileView);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Handle clicks outside sidebar to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarVisible) {
        toggleSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarVisible]);

  // Apply body scroll lock when sidebar is visible
  useEffect(() => {
    toggleBodyScroll(sidebarVisible);
    
    // Cleanup function to ensure scroll is restored when component unmounts
    return () => {
      if (sidebarVisible) {
        toggleBodyScroll(false);
      }
    };
  }, [sidebarVisible]);

  // Update activeTab based on current location
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/homes')) {
      setActiveTab("homes");
    } else if (path.includes('/rent')) {
      setActiveTab("rent");
    } else if (path.includes('/sale')) {
      setActiveTab("sale");
    } else if (path.includes('/lands')) {
      setActiveTab("lands");
    } else if (path.includes('/profile')) {
      setActiveTab("profile");
    } else if (path.includes('/add-property')) {
      setActiveTab("addProperty");
    } else if (path.includes('/my-properties')) {
      setActiveTab("myProperties");
    } else {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Important: Check for guest user first before checking token
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        
        // Check if user is a guest
        if (user.isGuest) {
          console.log("Guest user detected");
          setIsGuest(true);
          setUserData({
            username: user.username || "Guest User",
            role: user.role || "Guest"
          });
          setLoading(false);
          return;
        }
        
        // If not a guest, check for token
        const token = localStorage.getItem("token");
        
        // If no token and not guest, redirect to login
        if (!token) {
          console.log("No token found, redirecting to login");
          navigate("/login");
          return;
        }

        // Try to fetch user data with token
        const response = await axios.get("https://homilet-backend-2.onrender.com/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        
        // Simplified error handling
        if (process.env.NODE_ENV === 'development') {
          // Use mock data in development mode
          setUserData({
            username: "DevUser",
            role: "Developer"
          });
        } else {
          // Clear credentials and redirect in production
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Cleanup function to ensure scroll is restored when component unmounts
    return () => {
      toggleBodyScroll(false);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleSidebar = (forcedState = null) => {
    const newState = forcedState !== null ? forcedState : !sidebarVisible;
    setSidebarVisible(newState);
  };

  // Function to scroll to top when logo is clicked
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Extract category from path
  const extractCategoryFromPath = (path) => {
    if (path.includes('/homes')) return 'homes';
    if (path.includes('/rent')) return 'rent';
    if (path.includes('/sale')) return 'sale';
    if (path.includes('/lands')) return 'lands';
    return null;
  };

  // Perform case-insensitive search
  const performSearch = async (query) => {
    if (!query || !query.trim()) {
      setSearchActive(false);
      setNoResultsFound(false);
      setSearchResults([]);
      return;
    }
    
    setSearchActive(true);
    
    try {
      // Get the current category from the URL
      const currentCategory = extractCategoryFromPath(location.pathname);
      
      // For development/testing, do client-side search if API is not available
      if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_API) {
        // Mock API response - this simulates searching through properties
        const mockProperties = []; // You would fetch this from local storage or a mock data file
        
        // Perform case-insensitive search
        const lowercaseQuery = query.toLowerCase();
        const results = mockProperties.filter(property => {
          return (
            (property.title || "").toLowerCase().includes(lowercaseQuery) ||
            (property.description || "").toLowerCase().includes(lowercaseQuery) ||
            (property.location || "").toLowerCase().includes(lowercaseQuery) ||
            (property.purpose || "").toLowerCase().includes(lowercaseQuery)
          );
        });
        
        setSearchResults(results);
        setNoResultsFound(results.length === 0);
        return;
      }
      
      // Actual API call
      const queryParams = new URLSearchParams();
      queryParams.append('query', query.trim());
      
      if (currentCategory) {
        queryParams.append('category', currentCategory);
        
        // Add fallback for "sale" category if API uses different terminology
        if (currentCategory === 'sale') {
          queryParams.append('purpose', 'sale');
          queryParams.append('type', 'sale');
        }
      }
      
      // Add search options as fields
      const fields = [];
      if (searchOptions.searchTitle) fields.push('title');
      if (searchOptions.searchDescription) fields.push('description');
      if (searchOptions.searchLocation) fields.push('location');
      if (searchOptions.searchPrice) fields.push('price');
      if (searchOptions.searchAmenities) fields.push('amenities');
      
      if (fields.length > 0) {
        fields.forEach(field => queryParams.append('fields', field));
      }
      
      // Use axios cancellation to prevent race conditions
      if (searchController) {
        searchController.abort();
      }
      
      const controller = new AbortController();
      setSearchController(controller);
      
      // Debug the actual URL being called
      const apiUrl = `https://homilet-backend-2.onrender.com/api/properties/search?${queryParams.toString()}`;
      
      const response = await axios.get(
        apiUrl,
        { signal: controller.signal }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setSearchResults(response.data);
        setNoResultsFound(response.data.length === 0);
      } else {
        setSearchResults([]);
        setNoResultsFound(true);
      }
    } catch (error) {
      // Ignore if canceled
      if (axios.isCancel(error)) {
        console.log('Search request canceled');
        return;
      }
      
      console.error("Search error:", error);
      setSearchResults([]);
      setNoResultsFound(true);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    performSearch(searchQuery);
  };

  // Clear search query and results
  const clearSearch = () => {
    setSearchQuery("");
    setSearchActive(false);
    setNoResultsFound(false);
    setSearchResults([]);
    
    // Reset search input focus
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle navigation with sidebar closing
  const handleNavigation = (path) => {
    clearSearch();
    navigate(path);
    if (sidebarVisible) {
      toggleSidebar(false);
    }
  };

  // Update search results when query changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchOptions, location.pathname]);

  if (loading) return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-container" ref={topRef}>
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarVisible ? 'visible' : ''}`} 
        onClick={() => toggleSidebar(false)}
      ></div>
      
      {/* Sidebar - Updated with ref and position absolute for better mobile experience */}
      <aside 
        ref={sidebarRef} 
        className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}
      >
        <div className="sidebar-header">
          <button className="close-sidebar" onClick={() => toggleSidebar(false)}>×</button>
        </div>
        <div className="user-info">
          <div className="avatar">{userData?.username?.charAt(0).toUpperCase() || "U"}</div>
          <h3>{userData?.username || "User"}</h3>
          <p>{userData?.role}</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {/* These items show on mobile only */}
            <div className="mobile-only-nav">
              <li className={activeTab === "dashboard" ? "active" : ""}>
                <Link to="/dashboard" onClick={() => handleNavigation("/dashboard")}>
                  <span className="nav-icon">🏠</span>
                  <span className="nav-text">Dashboard</span>
                </Link>
              </li>
              <li className={activeTab === "homes" ? "active" : ""}>
                <Link to="/dashboard/homes" onClick={() => handleNavigation("/dashboard/homes")}>
                  <span className="nav-icon">🏘️</span>
                  <span className="nav-text">Homes</span>
                </Link>
              </li>
              <li className={activeTab === "lands" ? "active" : ""}>
                <Link to="/dashboard/lands" onClick={() => handleNavigation("/dashboard/lands")}>
                  <span className="nav-icon">🌲</span>
                  <span className="nav-text">Lands</span>
                </Link>
              </li>
              <li className={activeTab === "rent" ? "active" : ""}>
                <Link to="/dashboard/rent" onClick={() => handleNavigation("/dashboard/rent")}>
                  <span className="nav-icon">🔑</span>
                  <span className="nav-text">Rent</span>
                </Link>
              </li>
              <li className={activeTab === "sale" ? "active" : ""}>
                <Link to="/dashboard/sale" onClick={() => handleNavigation("/dashboard/sale")}>
                  <span className="nav-icon">💰</span>
                  <span className="nav-text">Sale</span>
                </Link>
              </li>
            </div>
            
            {/* These items always show */}
            <li className={activeTab === "profile" ? "active" : ""}>
              <Link to="/dashboard/profile" onClick={() => handleNavigation("/dashboard/profile")}>
                <span className="nav-icon">👤</span>
                <span className="nav-text">Profile</span>
              </Link>
            </li>
            
            {/* Only show these options if not a guest */}
            {!isGuest && (
              <>
                <li className={activeTab === "addProperty" ? "active" : ""}>
                  <Link to="/dashboard/add-property" onClick={() => handleNavigation("/dashboard/add-property")}>
                    <span className="nav-icon">➕</span>
                    <span className="nav-text">Add Property</span>
                  </Link>
                </li>
                <li className={activeTab === "myProperties" ? "active" : ""}>
                  <Link to="/dashboard/my-properties" onClick={() => handleNavigation("/dashboard/my-properties")}>
                    <span className="nav-icon">🏘️</span>
                    <span className="nav-text">My Properties</span>
                  </Link>
                </li>
              </>
            )}
            
            <li>
              {isGuest ? (
                <Link to="/login" className="login-btn" onClick={() => handleNavigation("/login")}>
                  <span className="nav-icon">🔑</span>
                  <span className="nav-text">Login</span>
                </Link>
              ) : (
                <button className="logout-btn" onClick={handleLogout}>
                  <span className="nav-icon">🚪</span>
                  <span className="nav-text">Logout</span>
                </button>
              )}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarVisible ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="dashboard-header">
          {/* Redesigned header with new arrangement */}
          <div className="header-left">
            {/* Logo with bookmark functionality */}
            <a 
              className="logo" 
              href="#top" 
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
              }}
            >
              Homilet 
            </a>
            
            {/* Search bar moved next to logo */}
            <form className="search-container" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) {
                      clearSearch();
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit();
                    } else if (e.key === 'Escape') {
                      clearSearch();
                    }
                  }}
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <h1 
                    className="clear-search-btn"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                      ✕ 
                   </h1>
                )}
              </div>
              <button type="submit">Search</button>
            </form>
          </div>
          
          {/* Desktop navigation - will be hidden on mobile */}
          <nav className="top-nav">
            <ul>
              <li className={activeTab === "dashboard" ? "active" : ""}>
                <Link to="/dashboard">Home</Link>
              </li>
              <li className={activeTab === "homes" ? "active" : ""}>
                <Link to="/dashboard/homes">Homes</Link>
              </li>
              <li className={activeTab === "lands" ? "active" : ""}>
                <Link to="/dashboard/lands">Lands</Link>
              </li>
              <li className={activeTab === "rent" ? "active" : ""}>
                <Link to="/dashboard/rent">Rent</Link>
              </li>
              <li className={activeTab === "sale" ? "active" : ""}>
                <Link to="/dashboard/sale">Sale</Link>
              </li>
            </ul>
          </nav>
          
          {/* Right-aligned profile section with Add Property button */}
          <div className="header-right">
            {/* Add Property button - show only if not a guest */}
            {!isGuest && (
              <button 
                className={`add-property-button ${activeTab === "addProperty" ? "active" : ""}`}
                onClick={() => handleNavigation("/dashboard/add-property")}
              >
                <span className="btn-icon">+</span> Add Property
              </button>
            )}
            
            <div className="profile-icon" onClick={() => toggleSidebar()}>
              <div className="avatar">{userData?.username?.charAt(0).toUpperCase() || "U"}</div>
            </div>
          </div>
        </header>

        {/* Guest Banner */}
        {isGuest && <GuestBanner />}

        <div className="content-area">
          <Routes>
            {/* Main dashboard route */}
            <Route path="/" element={<PropertyListing 
              userData={userData} 
              searchQuery={searchQuery} 
              searchActive={searchActive} 
              searchOptions={searchOptions}
              searchResults={searchResults}
              noResultsFound={noResultsFound}
            />} />
            
            {/* Routes that need protection from guest users */}
            <Route path="/profile" element={
              isGuest ? (
                <div className="guest-restriction">
                  <h2>Profile Access Restricted</h2>
                  <p>Please log in to access your profile</p>
                  <button onClick={() => navigate("/login")} className="login-btn">
                    Login now
                  </button>
                </div>
              ) : (
               <div><ProfileSection userData={userData} /></div> 
              )
            } />
            <Route path="/add-property" element={
              <ProtectedRoute isGuest={isGuest}>
                <AddProperty userData={userData} />
              </ProtectedRoute>
            } />
            <Route path="/my-properties" element={
              <ProtectedRoute isGuest={isGuest}>
                <MyProperties userData={userData} />
              </ProtectedRoute>
            } />
            
            {/* Category routes - available to both guests and users */}
            <Route path="/homes" element={<PropertyListing 
              userData={userData} 
              searchQuery={searchQuery} 
              searchActive={searchActive} 
              category="homes" 
              searchOptions={searchOptions}
              searchResults={searchResults}
              noResultsFound={noResultsFound}
            />} />
            <Route path="/rent" element={<PropertyListing 
              userData={userData} 
              searchQuery={searchQuery} 
              searchActive={searchActive} 
              category="rent" 
              searchOptions={searchOptions}
              searchResults={searchResults}
              noResultsFound={noResultsFound}
            />} />
            <Route path="/sale" element={<PropertyListing 
              userData={userData} 
              searchQuery={searchQuery} 
              searchActive={searchActive} 
              category="sale" 
              purpose="sale"
              searchOptions={searchOptions}
              searchResults={searchResults}
              noResultsFound={noResultsFound}
            />} />
            <Route path="/lands" element={<PropertyListing 
              userData={userData} 
              searchQuery={searchQuery} 
              searchActive={searchActive} 
              category="lands" 
              searchOptions={searchOptions}
              searchResults={searchResults}
              noResultsFound={noResultsFound}
            />} />
            <Route path="/property/:propertyId" element={<PropertyDetailsView />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;