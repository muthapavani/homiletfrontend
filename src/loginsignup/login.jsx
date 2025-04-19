import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Validation from "./login_val";
import "./signup.css";

function Login() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoggingIn, setIsGuestLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Options request to login endpoint
        await axios.options("http://localhost:5000/login");
        setServerStatus("online");
      } catch (err) {
        if (err.response) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      }
    };
  
    checkServerStatus();
  }, []);

  // Handle input changes
  const handleInput = (event) => {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));

    if (errors[event.target.name]) {
      setErrors((prev) => ({
        ...prev,
        [event.target.name]: null,
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = Validation(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      setServerError("");

      try {
        // Use the original endpoint that was working
        const res = await axios.post("http://localhost:5000/login", values);
        console.log("Login API Response:", res.data);

        if (res.data.token) {
          console.log("Login successful!");
          // Store token without "Bearer " prefix
          localStorage.setItem('token', res.data.token);
          
          // Store user data
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify({
              ...res.data.user,
              isGuest: false
            }));
          }
          
          navigate("/dashboard");
        } else {
          setServerError(res.data.error || "Invalid email or password");
        }
      } catch (err) {
        console.error("Login API Error:", err);
        
        if (err.response) {
          setServerError(err.response.data.error || "Login failed. Please check your credentials.");
        } else if (err.request) {
          setServerError("Cannot connect to server. Please make sure the server is running.");
        } else {
          setServerError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Updated guest login function with corrected endpoint and better client-side fallback
 // Updated guest login function that connects to the server endpoint
const handleGuestLogin = async () => {
  setIsGuestLoggingIn(true);
  setServerError("");

  try {
    // Call the server endpoint instead of creating a local guest
    const res = await axios.post("http://localhost:5000/api/guest-login");
    
    if (res.data.success && res.data.token) {
      console.log("Guest login successful!");
      
      // Store token from the server response
      localStorage.setItem('token', res.data.token);
      
      // Store user data from the server response
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      
      navigate("/dashboard");
    } else {
      setServerError(res.data.message || "Guest login failed. Please try again.");
    }
  } catch (err) {
    console.error("Guest Login Error:", err);
    
    if (err.response) {
      setServerError(err.response.data.message || "Guest login failed. Please try again.");
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
      
      // Navigate to dashboard
      navigate("/dashboard");
    } else {
      setServerError("An unexpected error occurred. Please try again.");
    }
  } finally {
    setIsGuestLoggingIn(false);
  }
};

  return (
    <div className="bg-mountain">
      <div className="stars"></div>
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="login-container">
          <h2>Login</h2>
          {/* Server Status Indicator */}
          {serverStatus === "offline" && (
            <div className="server-status-warning">
              Server appears to be offline. Please ensure your backend server is running.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="form-groups">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Enter Email"
                name="email"
                id="email"
                onChange={handleInput}
                value={values.email}
              /> <br></br>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-groups password-field">
              <i className="fas fa-lock"></i>  
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                name="password"
                id="password"
                onChange={handleInput}
                value={values.password}
              />
              <div className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </div>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            {/* Forgot Password */}
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
            {/* Error Message */}
            {serverError && <div className="server-error">{serverError}</div>}
            {/* Login Button */}
            <button 
              type="submit" 
              className="login-btns" 
              disabled={isSubmitting || isGuestLoggingIn || serverStatus === "offline"}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            {/* Guest Login Button */}
            <button 
              type="button" 
              className="guest-login-btn" 
              onClick={handleGuestLogin}
              disabled={isSubmitting || isGuestLoggingIn || serverStatus === "offline"}
            >
              {isGuestLoggingIn ? "Creating guest account..." : "Continue as Guest"}
            </button>

            {/* Create Account Link */}
            <p className="signup-link">
              Don't have an account? <Link to="/signup">Create Account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;