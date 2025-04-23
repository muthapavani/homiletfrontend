import React, { useState, useEffect } from 'react';
import './payment-history.css';

const PaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // API URL and token
  const API_BASE_URL = "https://homilet-backend-2.onrender.com";
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  useEffect(() => {
    fetchPaymentHistory();
  }, []);
  
  // Fetch payment history from the backend
  const fetchPaymentHistory = async () => {
    if (!token) {
      setError("Please log in to view payment history");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const cleanToken = token.replace(/"/g, '').trim();
      console.log("Fetching payment history...");
      
      const response = await fetch(`${API_BASE_URL}/api/payments/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Session expired. Please log in again.");
        } else {
          throw new Error(`Server error (${response.status}): ${data.message || 'Unknown error'}`);
        }
      }
      
      if (!data.success) {
        throw new Error(data.message || "Server returned an error");
      }
      
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error("Invalid response format from server");
      }
      
      if (data.history.length === 0) {
        setError("No payment records found");
      } else {
        // Sort and set the payment history
        sortPaymentsData(data.history, sortBy, sortOrder);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError(error.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };
  
  // Sort payments data
  const sortPaymentsData = (data, field, order) => {
    const sortedData = [...data].sort((a, b) => {
      if (field === 'date') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (field === 'amount') {
        return order === 'asc' ? parseFloat(a.amount) - parseFloat(b.amount) : parseFloat(b.amount) - parseFloat(a.amount);
      } else if (field === 'property') {
        const propA = (a.property_title || '').toLowerCase();
        const propB = (b.property_title || '').toLowerCase();
        return order === 'asc' ? propA.localeCompare(propB) : propB.localeCompare(propA);
      }
      return 0;
    });
    
    setHistory(sortedData);
  };
  
  // Update sort order and re-sort data
  const handleSort = (field) => {
    const newOrder = field === sortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    sortPaymentsData(history, field, newOrder);
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
      return 0;
    }
  };
  
  // Check if a payment is still valid
  const isValidPayment = (dateString) => {
    return calculateDaysLeft(dateString) > 0;
  };
  
  // Handle retry button click
  const handleRetry = () => {
    fetchPaymentHistory();
  };
  
  // Render the sort header
  const renderSortHeader = (label, field) => {
    const isActive = sortBy === field;
    
    return (
      <th 
        className={`sortable-header ${isActive ? 'active-sort' : ''}`}
        onClick={() => handleSort(field)}
      >
        {label}
        {isActive && (
          <span className="sort-indicator">
            {sortOrder === 'asc' ? ' ▲' : ' ▼'}
          </span>
        )}
      </th>
    );
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
        <div className="error-message">
          <p><strong>Error:</strong> {error}</p>
          <button onClick={handleRetry} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
      {!loading && history.length === 0 && !error && (
        <div className="empty-history">
          <p>No payment records found.</p>
          <button onClick={handleRetry} className="retry-button">
            Refresh
          </button>
        </div>
      )}
      
      {history.length > 0 && (
        <div className="history-list">
          <table className="payment-table">
            <thead>
              <tr>
                {renderSortHeader('Date', 'date')}
                {renderSortHeader('Property', 'property')}
                {renderSortHeader('Amount', 'amount')}
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
                  <td className="date-cell">{formatDate(payment.created_at)}</td>
                  <td className="property-cell">
                    <div className="property-title">{payment.property_title || `Property #${payment.property_id || 'Unknown'}`}</div>
                    {payment.property_address && (
                      <div className="property-address">{payment.property_address}</div>
                    )}
                  </td>
                  <td className="amount">
                    {payment.currency || 'INR'} {parseFloat(payment.amount || 0).toLocaleString()}
                  </td>
                  <td className="status-cell">
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

export default PaymentHistory;