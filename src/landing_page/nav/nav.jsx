import { Link, useNavigate } from "react-router-dom";
import "./nav.css";
import logo from "../../assets/landingimg/homilet1.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogin = () => {
    navigate("/login");
  };

  const handleGetStarted = () => {
    navigate("/signup");
  };
  
  // Function to toggle menu state
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Close menu function
  const closeMenu = () => {
    setIsMenuOpen(false);
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse.classList.contains('show')) {
      const bsCollapse = new bootstrap.Collapse(navbarCollapse);
      bsCollapse.hide();
    }
  };
  
  // Effect to handle body scrolling
  useEffect(() => {
    if (isMenuOpen) {
      // Prevent scrolling and add overlay class
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.documentElement.style.height = '100%';
      document.body.classList.add('offcanvas-open');
    } else {
      // Enable scrolling and remove overlay class
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.classList.remove('offcanvas-open');
    }
    
    // Clean up when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.classList.remove('offcanvas-open');
    };
  }, [isMenuOpen]);
  
  // Bootstrap event handling
  useEffect(() => {
    const handleBootstrapToggle = () => {
      const navbarCollapse = document.getElementById('navbarNav');
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isShown = navbarCollapse.classList.contains('show');
            setIsMenuOpen(isShown);
          }
        });
      });
      
      observer.observe(navbarCollapse, { attributes: true });
      
      // Clean up observer
      return () => observer.disconnect();
    };
    
    handleBootstrapToggle();
    
    // Import bootstrap JS dynamically
    import('bootstrap/dist/js/bootstrap.bundle.min').then(bootstrap => {
      window.bootstrap = bootstrap;
    });
  }, []);
  
  return (
    <section id="nav" className="hero-section">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg custom-navbar">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">
            <img src={logo} alt="Homelet Logo" className="nav-logo" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="navbar-close-btn">
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close" 
                onClick={closeMenu}
              ></button>
            </div>
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <a className="nav-link" href="#nav" onClick={closeMenu}>Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#homes" onClick={closeMenu}>Rent</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#cardsl" onClick={closeMenu}>Buy</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#cardsl" onClick={() => {handleLogin(); closeMenu();}}>Sell</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#features" onClick={closeMenu}>Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#footer" onClick={closeMenu}>Contact</a>
              </li>
            </ul>
            
            <div className="d-flex gap-2">
              <Link to="/login" onClick={() => {handleLogin(); closeMenu();}} className="btn custom-btn">Login</Link>
              <Link to="/signup" onClick={closeMenu} className="btn custom-btn">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Banner */}
      <div className="banner-content">
        <h1>
          Welcome to the<br />
          <span className="head">HomiLet</span>
          <p>Let Home Rent Home </p>
        </h1>
        <p className="p">Buy, Rent, and Sell Your Property in One Place.</p>
        {/* Changed from anchor tag to button with onClick handler */}
        <button onClick={handleGetStarted}>Get Started</button>
      </div>
    </section>
  );
};

export default HeroSection;