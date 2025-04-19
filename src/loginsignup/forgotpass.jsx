import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./signup.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // Step 1: Email input, Step 2: OTP input
  const navigate = useNavigate();

  // Handle email submission to send OTP
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    axios
      .post("https://homilet-backend-2.onrender.com/forgot-password", { email })
      .then((res) => {
        setMessage(res.data.message);
        setStep(2); // Move to OTP verification step
      })
      .catch((err) => setError(err.response?.data?.error || "Error sending OTP"));
  };

  // Handle OTP verification
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    axios
      .post("https://homilet-backend-2.onrender.com/verify-otp", { email, otp })
      .then(() => {
        navigate("/reset-password", { state: { email } }); // Redirect with email state
      })
      .catch((err) => setError(err.response?.data?.error || "Invalid OTP"));
  };

  return (
    <>
      <div className="bg-mountain"></div>
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="login-container">
          <h2>Forgot Password</h2>

          {error && <div className="server-error">{error}</div>}
          {message && <div style={{ color: "white", textAlign: "center", marginBottom: "15px" }}>{message}</div>}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button type="submit" className="login-btn">Send OTP</button>
              <div className="login-link">
                <span>Remember your password? </span>
                <a href="/Login">Login</a>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <i className="fas fa-key" ></i>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the OTP sent to your email"
                  required
                />
              </div>
              <button type="submit" className="login-btn">Verify OTP</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;