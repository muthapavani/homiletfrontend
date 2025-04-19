import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./signup.css";
import SignValidation from "./signup_val";

function Signup() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Clear server error when user modifies input
    if (serverError) {
      setServerError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = SignValidation(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      setServerError("");

      try {
        const response = await axios.post("https://homilet-backend-2.onrender.com/signup", values);
        alert(response.data.message);
        navigate("/login");
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
                             err.response?.data?.error || 
                             "Signup failed. Please try again.";
        setServerError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-mountain">
      <div className="stars"></div>
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="signup-container">
          <h2>Sign Up</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-groups">
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Enter Name"
                name="name"
                id="name"
                onChange={handleInput}
                value={values.name}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-groups">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Enter Email"
                name="email"
                id="email"
                onChange={handleInput}
                value={values.email}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-groups password-group">
              <i className="fas fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password" 
                name="password"
                id="password" 
                onChange={handleInput}
                value={values.password}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            {serverError && <div className="server-error">{serverError}</div>}

            <button 
              type="submit" 
              className="signup-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </button>

            <p className="login-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;