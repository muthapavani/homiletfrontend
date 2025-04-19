import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import "./footer.css";
import logo from "../../assets/landingimg/homilet1.png"

const Footer = () => {
  return (
    <footer id="footer" className="footer">
      <div className="footer-container">
        <div className="footer-section logo-section">
          <img src={logo} alt="HomeLet Logo" className="footer-logo" />
          <p>Finding your perfect home should be simple. At Homelet, we connect people with properties they'll love.</p>
        </div>
        <div className="footer-section">
          <h3 className="footer-title">Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/properties">Properties</Link></li>
            <li><Link to="/agents">Agents</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Property Types</h3>
          <ul>
            <li>Apartments</li>
            <li>Houses</li>
            <li>Condos</li>
            <li>Commercial</li>
            <li>Vacation Rentals</li>
          </ul>
        </div>
        <div className="footer-section">
          <h3 className="footer-title">Contact Us</h3>
          <p><FaMapMarkerAlt /> kphb phase 1 road no 1 </p>
          <p><FaPhone /> (555) 123-4567</p>
          <p><FaEnvelope /> info@homilet.com</p>
        </div>
        <div className="footer-section">
          <h3 className="footer-title">Follow Us</h3>
          <div className="social-icons">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaLinkedin /></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 Homelet. All rights reserved.</p>
        <ul className="footer-links">
          <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          <li><Link to="/terms-of-service">Terms of Service</Link></li>
          <li><Link to="/cookie-policy">Cookie Policy</Link></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
