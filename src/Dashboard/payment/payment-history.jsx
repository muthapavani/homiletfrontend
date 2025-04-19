// PaymentHistory.jsx - Improved component with comprehensive error handling and retry logic
import React, { useState, useEffect } from 'react';
import './payment-history.css';

const PaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // API URL and token
  const API_BASE_URL = "https://homilet-backend-2.onrender.com";
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Identify if we're in development mode
  const isDevelopment = () => {
    return process.env.NODE_ENV === 'development' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  };
  
  useEffect(() => {
    // Call the function to fetch data
    fetchPaymentHistory();
  }, [token, retryCount]);
  
  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/test-db`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        message: data.message || 'Test completed',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  };
  
  // Fetch payment history with better error handling
  const fetchPaymentHistory = async () => {
    if (!token) {
      setError("Please log in to view payment history");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Debug logging in development
      if (isDevelopment()) {
        console.log('Fetching payment history with token:', token ? 'Token exists' : 'No token');
        console.log('Request URL:', `${API_BASE_URL}/api/payments/history`);
      }
      
      // Create headers object with authentication token
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };
      
      if (isDevelopment()) {
        console.log('Request headers:', headers);
      }
    
      // Make API request with comprehensive error handling
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/payments/history`, {
          method: 'GET',
          headers,
          credentials: 'include',
          mode: 'cors'
        });
      } catch (fetchError) {
        console.error("Network-level fetch error:", fetchError);
        
        // Test if the server is running at all
        try {
          await fetch(`${API_BASE_URL}/api/test`);
          throw new Error(`Network error while connecting to server: ${fetchError.message}`);
        } catch (testError) {
          throw new Error(`Server appears to be offline. Please check if the backend server is running.`);
        }
      }
      
      // Handle HTTP errors
      if (!response.ok) {
        let errorData = null;
        let errorText = '';
        
        // Try to parse error response as JSON
        try {
          errorData = await response.json();
          errorText = errorData.message || errorData.error || `HTTP ${response.status}`;
          
          if (isDevelopment()) {
            console.error('Error response from server:', errorData);
            setDebugInfo(JSON.stringify(errorData, null, 2));
          }
        } catch (jsonError) {
          // Fallback to plain text if not JSON
          try {
            errorText = await response.text();
            if (isDevelopment()) {
              console.error('Error response (text):', errorText);
              setDebugInfo(errorText);
            }
          } catch (textError) {
            errorText = `${response.status}: ${response.statusText}`;
          }
        }
        
        // Specific error handling based on status code
        if (response.status === 401 || response.status === 403) {
          throw new Error("Session expired. Please log in again.");
        } else if (response.status === 500) {
          // For 500 errors, provide more diagnostic information
          const dbTest = await testDatabaseConnection();
          if (!dbTest.success) {
            throw new Error(`Database connection error: ${dbTest.message}. Please check your database configuration.`);
          } else {
            throw new Error(`Server error (500): ${errorText}. Database appears to be working.`);
          }
        } else {
          throw new Error(`Server error: ${errorText}`);
        }
      }
      
      // Parse response data
      let data;
      try {
        data = await response.json();
        
        if (isDevelopment()) {
          console.log('Payment history response:', data);
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid data format received from server");
      }
      
      // Check for API success flag and history array
      if (data.success === false) {
        throw new Error(data.message || "API returned error");
      }
      
      if (!Array.isArray(data.history)) {
        throw new Error("Invalid history data format");
      }
      
      // Set history data
      setHistory(data.history);
      
      // If no data was found, show appropriate message
      if (data.history.length === 0) {
        setError("No payment records found in database");
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError(error.message || "Failed to load payment history");
      
      if (isDevelopment()) {
        console.log('Using development mock data since an error occurred');
        setHistory([
          {
            id: 'mock-1',
            payment_id: 'pay_dev_123456',
            property_id: '1',
            property_title: 'Development Property',
            amount: 5000,
            currency: 'INR',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'success'
          },
          {
            id: 'mock-2',
            payment_id: 'pay_dev_789012',
            property_id: '2',
            property_title: 'Another Development Property',
            amount: 7500,
            currency: 'INR',
            created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'success'
          }
        ]);
        
        setError("⚠️ Using mock data - actual database connection failed");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Format date in a readable format
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString || 'N/A';
    }
  };
  
  // Calculate days left for validity
  const calculateDaysLeft = (dateString) => {
    try {
      const paymentDate = new Date(dateString);
      if (isNaN(paymentDate.getTime())) return 0;
      
      const now = new Date();
      const expiryDate = new Date(paymentDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const diffTime = expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      console.error('Days calculation error:', e);
      return 0;
    }
  };
  
  // Helper function to determine if payment is valid or expired
  const isValidPayment = (dateString) => {
    return calculateDaysLeft(dateString) > 0;
  };
  
  // Handle retry button click
  const handleRetry = () => {
    setError(null);
    setRetryCount(prevCount => prevCount + 1);
  };
  
  // Run database setup if needed
  const runDatabaseSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/setup-database`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Database setup completed. Retrying fetch...');
        handleRetry();
      } else {
        alert(`Setup failed: ${data.message}`);
      }
    } catch (error) {
      alert(`Could not run setup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-history-container">
      <h2 className="payment-history-title">Payment History</h2>
      
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading payment history...</span>
        </div>
      )}
      
      {error && (
        <div className={`error-message ${error.includes('mock data') ? 'warning' : ''}`}>
          <p><strong>{error.includes('mock data') ? 'Warning:' : 'Error:'}</strong> {error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
            
            {error.includes('database') && isDevelopment() && (
              <button onClick={runDatabaseSetup} className="setup-button">
                Run Database Setup
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Enhanced debug section with additional tools */}
      {isDevelopment() && (debugInfo || error) && (
        <div className="debug-info">
          <h4>Debug Information</h4>
          {debugInfo && <pre>{debugInfo}</pre>}
          <div className="debug-tools">
            <button onClick={async () => {
              const result = await testDatabaseConnection();
              setDebugInfo(JSON.stringify(result, null, 2));
            }} className="test-button">
              Test Database Connection
            </button>
            <button onClick={() => setDebugInfo(null)} className="clear-button">
              Clear Debug Info
            </button>
          </div>
        </div>
      )}
      
      {!loading && history.length === 0 && !error && (
        <div className="empty-history">
          <p>No payment records found.</p>
        </div>
      )}
      
      {history.length > 0 && (
        <div className="history-list">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {history.map((payment) => (
                <tr 
                  key={payment.id || payment.payment_id || Math.random().toString(36)} 
                  className={isValidPayment(payment.created_at) ? 'valid' : 'expired'}
                >
                  <td>{formatDate(payment.created_at)}</td>
                  <td>
                    {payment.property_title || `Property #${payment.property_id || 'Unknown'}`}
                    {payment.property_address && (
                      <div className="property-address">{payment.property_address}</div>
                    )}
                  </td>
                  <td className="amount">
                    {payment.currency || '$'} {parseFloat(payment.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    {isValidPayment(payment.created_at) ? (
                      <span className="status valid">
                        Active
                        <div className="days-left">
                          {calculateDaysLeft(payment.created_at)} days left
                        </div>
                      </span>
                    ) : (
                      <span className="status expired">Expired</span>
                    )}
                  </td>
                  <td className="payment-id">{payment.payment_id || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="history-note">
            <p>Note: Payments are valid for 30 days. Payment history is maintained for the last 30 days.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
