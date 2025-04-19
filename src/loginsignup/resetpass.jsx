import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  // ✅ Password strength validation
  const isStrongPassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!isStrongPassword(newPassword)) {
      setError("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const requestData = { email, newPassword };

    try {
      const res = await axios.post(
        "http://localhost:5000/reset-password",
        requestData
      );

      setMessage("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);  // Auto-redirect after success
    } catch (err) {
      setError(err.response?.data?.error || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mountain">
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="forgot-password-container">
          <h2>Reset Password</h2>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="server-success">{message}</div>}

          <form onSubmit={handleReset}>
            {/* New Password Field */}
            <div className="form-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <span
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>

            {/* Confirm Password Field */}
            <div className="form-group password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <span
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Reset Password"}
            </button>
          </form>

          {message && (
            <div className="login-link">
              <a onClick={() => navigate("/login")}>Go to Login</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
