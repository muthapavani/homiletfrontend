import React, { useState, useEffect } from 'react';
import './payment.css';

const PaymentButton = ({ propertyId, propertyTitle, price, isLoggedIn, onLoginRedirect }) => {
  // Essential state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({ status: 'checking', details: null });
  
  // Payment history state
  const [showHistory, setShowHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Configuration
  const token = localStorage.getItem('token');
  console.log(token)
  const API_BASE_URL = "https://homilet-backend-2.onrender.com";
  
  // Development mode detection
  const isDevelopment = () => {
    return process.env.NODE_ENV === 'development' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  };

  // Check payment status for this property
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!isLoggedIn || !token || !propertyId) {
        setPaymentStatus({ status: 'unpaid', details: null });
        return;
      }
      
      try {
        console.log("Checking payment status for property:", propertyId);
        console.log("Token status:", token ? "Token exists" : "No token");
        
        const response = await fetch(
          `${API_BASE_URL}/api/payments/check-status?propertyId=${propertyId}`, 
          {
            headers: { 
              'Authorization': `Bearer ${token.trim()}`,
              'Accept': 'application/json'
            },
            credentials: 'include'
          }
        );
        
        console.log("Status check response:", response.status);
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Payment status data:", data);
        
        if (data.success) {
          setPaymentStatus({
            status: data.paymentStatus,
            details: data.paymentInfo || null,
            daysSincePayment: data.daysSincePayment
          });
        } else {
          setPaymentStatus({ status: 'error', details: data.message });
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
        setPaymentStatus({ status: 'error', details: error.message });
      }
    };
    
    checkPaymentStatus();
    const intervalId = setInterval(checkPaymentStatus, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, [propertyId, isLoggedIn, token, API_BASE_URL]);
  
  // Fetch payment history with better error handling
  const fetchPaymentHistory = async () => {
    if (!isLoggedIn || !token) {
      setHistoryError("Please log in to view payment history");
      return;
    }
    
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      // Development mode debugging
      if (isDevelopment()) {
        console.log('Fetching payment history with token:', token ? 'Token exists' : 'No token');
        console.log('Request URL:', `${API_BASE_URL}/api/payments/history`);
      }
      
      // More detailed error reporting
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/payments/history`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token.trim()}`,
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          credentials: 'include'
        });
      } catch (networkError) {
        console.error('Network-level fetch error:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
      }
      
      // Handle HTTP errors with detailed status code info
      if (!response.ok) {
        // Attempt to parse error response as JSON
        let errorMessage = `HTTP error ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (isDevelopment()) {
            console.error('Error response details:', errorData);
          }
          
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // More specific error messages based on status codes
          if (response.status === 401 || response.status === 403) {
            throw new Error("Session expired. Please log in again.");
          } else if (response.status === 500) {
            console.error('Server error details:', errorData);
            throw new Error("Database connection error. Our team has been notified.");
          }
        } catch (jsonError) {
          // If JSON parsing fails, try to get text
          try {
            const textError = await response.text();
            if (isDevelopment()) {
              console.error('Error response (text):', textError);
            }
            errorMessage = textError || errorMessage;
          } catch (e) {} // Ignore text parsing errors
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse the response data
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
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid data format received from server");
      }
      
      if (data.success === false) {
        throw new Error(data.message || "API returned error");
      }
      
      if (!Array.isArray(data.history)) {
        throw new Error("Invalid history data format");
      }
      
      // Set the payment history data
      setPaymentHistory(data.history);
      
      // If no data was found, show appropriate message
      if (data.history.length === 0) {
        setHistoryError("No payment records found in database");
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setHistoryError(error.message || "Failed to load payment history");
      
      // In development mode, provide sample data even if there's an error
      if (isDevelopment()) {
        console.log('Using development mock data since an error occurred');
        setPaymentHistory([
          {
            id: 'mock-1',
            payment_id: 'pay_dev_123456',
            property_id: propertyId || '1',
            property_title: propertyTitle || 'Development Property',
            amount: price || 5000,
            currency: 'INR',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'success'
          },
          {
            id: 'mock-2',
            payment_id: 'pay_dev_789012',
            property_id: propertyId || '1',
            property_title: propertyTitle || 'Development Property',
            amount: price || 5000,
            currency: 'INR',
            created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'success'
          }
        ]);
        
        // Make it clear these are development mock values
        setHistoryError("⚠️ Using mock data - actual database connection failed");
      }
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Toggle payment history visibility
  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);
    
    if (newShowHistory && paymentHistory.length === 0 && !historyLoading) {
      fetchPaymentHistory();
    }
  };
  
  // Utility functions
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };
  
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
      return 0;
    }
  };
  
  const isValidPayment = (dateString) => {
    return calculateDaysLeft(dateString) > 0;
  };
  
  // Modified validatePrice to remove upper limit
  const validatePrice = (priceValue) => {
    const parsedPrice = parseFloat(priceValue);
    
    if (isNaN(parsedPrice)) {
      return {
        valid: false,
        message: "Invalid price format"
      };
    }
    
    if (parsedPrice <= 0) {
      return {
        valid: false,
        message: "Price must be greater than zero"
      };
    }
    
    return {
      valid: true,
      value: parsedPrice
    };
  };
  
  // Load Razorpay script
  const loadScript = (src) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

// Updated handlePayment function to use existing endpoints
const handlePayment = async () => {
  if (!isLoggedIn) {
    onLoginRedirect();
    return;
  }
  
  if (!token) {
    setError("Authentication required. Please log in again.");
    onLoginRedirect();
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    // Enhanced price validation
    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) {
      throw new Error(priceValidation.message);
    }
    
    const validatedPrice = priceValidation.value;
    
    // Log payment attempt for debugging
    console.log(`Payment attempt: ₹${validatedPrice} for property ID ${propertyId}`);
    console.log("Token status:", token ? "Token exists" : "No token");
    
    const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!scriptLoaded) {
      throw new Error('Failed to load payment gateway.');
    }
    
    console.log("Creating payment order...");
    
    // Use the existing endpoint instead of the public one
    const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      credentials: 'include',
      body: JSON.stringify({ 
        amount: validatedPrice, 
        propertyId,
        currency: 'INR',
        paymentType: 'listing'
      })
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    // Get response data
    let data;
    try {
      data = await response.json();
      console.log("Response data:", data);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Invalid response format from server");
    }

    // Handle error responses
    if (!response.ok) {
      // Handle 401 authentication errors - these require logout
      if (response.status === 401) {
        console.error("Authentication error - logging out");
        localStorage.removeItem('token');
        onLoginRedirect();
        throw new Error(`Your session has expired. Please log in again.`);
      }
      
      // For all other errors
      throw new Error(data.message || "Payment processing failed. Please try again.");
    }

    // Check for valid order data
    if (!data.success || !data.order || !data.order.id) {
      throw new Error(data.message || "Failed to create payment order");
    }

    const orderDetails = data.order;
    console.log('Order Details:', orderDetails);

    //const keyId = data.keyId || data.key_id || "rzp_test_jb2DnMBdQxe1KO";
    const keyId = "rzp_test_Fqrbpr6LU7Ka8y";

    const options = {
      key: keyId,
      amount: orderDetails.amount,
      currency: orderDetails.currency || 'INR',
      name: 'Real Estate Portal',
      description: `Payment for ${propertyTitle}`,
      order_id: orderDetails.id,
      handler: async function(response) {
        try {
          console.log("Payment completed, verifying...");
          console.log("Verification payload:", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature ? "Signature exists" : "No signature"
          });

          console.log("Sending token in Authorization header:", token);
          // Use the existing verification endpoint instead of the public one
          const verifyResponse = await fetch(`${API_BASE_URL}/api/payments/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.trim()}`,
              'Accept': 'application/json',
              'Origin': window.location.origin
            },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentType: 'listing'
            })
          });
          
          console.log("Verify response status:", verifyResponse.status);
          
          let verifyData;
          try {
            verifyData = await verifyResponse.json();
            console.log("Verify response data:", verifyData);
          } catch (e) {
            console.error("Failed to parse verification response:", e);
            throw new Error("Invalid verification response");
          }
          
          // Handle verification response
          if (!verifyResponse.ok) {
            // Only consider 401 as authentication error
            if (verifyResponse.status === 401) {
              localStorage.removeItem('token');
              onLoginRedirect();
              throw new Error('Session expired during payment verification');
            }
            
            // For other errors
            throw new Error(`Payment verification failed: ${verifyData.message || 'Please try again.'}`);
          }
          
          // Normal success flow
          if (verifyData.success) {
            setPaymentStatus({
              status: 'paid',
              details: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                amount: validatedPrice,
                currency: orderDetails.currency || 'INR',
                date: new Date().toISOString(),
                expiresIn: 30
              }
            });
            
            if (showHistory) {
              fetchPaymentHistory();
            }
            setError('Payment completed successfully!');
            setTimeout(() => setError(null), 5000);
          } else {
            setError('Payment verification failed: ' + verifyData.message);
          }
        } catch (error) {
          console.error("Verification error:", error);
          setError(error.message);
        }
      },
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        contact: localStorage.getItem('userPhone') || ''
      },
      theme: { color: '#3399cc' },
      modal: {
        ondismiss: function() {
          console.log("Payment modal dismissed");
          setLoading(false);
        }
      }
    };
    
    console.log("Opening Razorpay with options:", {
      key: options.key,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      order_id: options.order_id
    });
    
    const razorpay = new window.Razorpay(options);
    razorpay.open();
    
  } catch (error) {
    console.error("Payment error details:", error);
    
    // Show clear error message
    setError(error.message || 'Payment initiation failed');
  } finally {
    setLoading(false);
  }
};

  // Render payment button based on status
  const renderPaymentButton = () => {
    if (paymentStatus.status === 'checking') {
      return (
        <button className="payment-button loading" disabled={true}>
          <span className="loading-indicator">Checking status...</span>
        </button>
      );
    }
    
    if (paymentStatus.status === 'paid') {
      return (
        <button className="payment-button completed" disabled={true}>
          <span>
            Payment Completed
            {paymentStatus.details?.expiresIn && (
              <small className="expiry-notice"> (Valid for {paymentStatus.details.expiresIn} days)</small>
            )}
          </span>
        </button>
      );
    }
    
    if (paymentStatus.status === 'expired') {
      return (
        <button 
          onClick={handlePayment}
          className={`payment-button renewal ${loading ? 'loading' : ''}`}
          disabled={loading || !isLoggedIn}
        >
          {loading 
            ? <span className="loading-indicator">Processing...</span>
            : <span>Renew Now ₹{price?.toLocaleString()}</span>
          }
        </button>
      );
    }
    
    return (
      <button 
        onClick={handlePayment}
        className={`payment-button ${loading ? 'loading' : ''}`}
        disabled={loading || !isLoggedIn}
      >
        {loading 
          ? <span className="loading-indicator">Processing...</span>
          : <span>Pay Now ₹{price?.toLocaleString()}</span>
        }
      </button>
    );
  };

  // Render payment history
  const renderPaymentHistory = () => {
    if (!showHistory) return null;
    
    return (
      <div className="payment-history-container">
        <h3 className="payment-history-title">Payment History</h3>
        
        {historyLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Loading payment history...</span>
          </div>
        )}
        
        {historyError && (
          <div className="history-error-message">
            <p><strong>Note:</strong> {historyError}</p>
            <button onClick={fetchPaymentHistory} className="retry-button">
              Retry
            </button>
          </div>
        )}
        
        {!historyLoading && paymentHistory.length === 0 && !historyError && (
          <div className="empty-history">
            <p>No payment records found.</p>
          </div>
        )}
        
        {paymentHistory.length > 0 && (
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
                {paymentHistory.map((payment) => (
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
                      {payment.currency || 'INR'} {parseFloat(payment.amount || 0).toLocaleString()}
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
              <p>Note: Payments are valid for 30 days.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="payment-button-container">      
      {renderPaymentButton()}
      
      {error && (
        <div className={`payment-error ${error.includes('successfully') ? 'success' : ''}`}>
          <strong>{error.includes('successfully') ? 'Success:' : 'Error:'}</strong> {error}
          <button onClick={() => setError(null)} className="clear-error-button">
            Clear
          </button>
        </div>
      )}
      
      {isLoggedIn && (
        <div className="payment-history-toggle">
          <button 
            onClick={toggleHistory} 
            className={`history-toggle-button ${showHistory ? 'active' : ''}`}
          >
            {showHistory ? 'Hide Payment History' : 'View Payment History'}
          </button>
        </div>
      )}
      
      {renderPaymentHistory()}
    </div>
  );
};

export default PaymentButton;