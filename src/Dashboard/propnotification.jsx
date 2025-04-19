import React, { useState, useEffect } from 'react';
import './Property-notifications.css'; // You'll need to create this CSS file

const PropertyNotifications = ({ userId, propertyId }) => {
  const [notifications, setNotifications] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPropertyNotifications();
  }, [propertyId, userId]);

  const fetchPropertyNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token || !userId || !propertyId) {
        setError('Missing required information');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching notifications for property: ${propertyId}, user: ${userId}`);
      
      const response = await fetch(`https://homilet-backend-2.onrender.com/api/notifications/property/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch notifications');
      }
      
      const data = await response.json();
      console.log(`Received notifications:`, data);
      
      // Handle the new response format where data contains notifications array and metadata
      if (data && typeof data === 'object') {
        // Check if data has a notifications property that is an array
        if (data.notifications && Array.isArray(data.notifications)) {
          // Log each notification for debugging
          data.notifications.forEach((notification, index) => {
            console.log(`Notification ${index}:`, notification);
          });
          
          setNotifications(data.notifications);
          
          // Store metadata if available
          if (data.metadata) {
            setMetadata(data.metadata);
          }
          
          // Mark notifications as read if there are any
          if (data.notifications.length > 0) {
            await markNotificationsAsRead(data.notifications.map(n => n.id));
          }
        } else if (Array.isArray(data)) {
          // Fallback to handle case where API directly returns an array
          data.forEach((notification, index) => {
            console.log(`Notification ${index}:`, notification);
          });
          
          setNotifications(data);
          
          if (data.length > 0) {
            await markNotificationsAsRead(data.map(n => n.id));
          }
        } else {
          console.error('Could not find notifications array in:', data);
          setNotifications([]);
          setError('Invalid data format received from server');
        }
      } else {
        console.error('Expected object but received:', typeof data, data);
        setNotifications([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setError('Failed to load notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationsAsRead = async (notificationIds) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch('https://homilet-backend-2.onrender.com/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Check if a value is empty or null/undefined
  const isEmpty = (value) => {
    return value === null || value === undefined || value === '';
  };

  // Helper function to check if it's likely an anonymous submission
  const isAnonymousSubmission = (notification) => {
    // Check if explicitly set as anonymous
    if (notification.is_anonymous === true) {
      return true;
    }
    
    // Check if name is missing or explicitly set as anonymous
    const nameEmpty = !notification.name || notification.name.toLowerCase() === 'anonymous';
    
    // Check if both email and phone are missing
    const contactEmpty = !notification.email && !notification.phone;
    
    // Consider it anonymous if name is empty or explicitly anonymous AND contact info is missing
    return nameEmpty && contactEmpty;
  };

  if (loading) {
    return <div className="notifications-loading">Loading inquiries...</div>;
  }

  if (error) {
    return <div className="notifications-error">{error}</div>;
  }

  // Ensure notifications is an array
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  
  if (notificationsArray.length === 0) {
    return <div className="notifications-empty">No inquiries received for this property yet.</div>;
  }

  return (
    <div className="property-notifications">
      <h4 className="notifications-heading">
        Property Inquiries ({notificationsArray.length})
        {metadata.unreadCount > 0 && (
          <span className="unread-badge">{metadata.unreadCount} unread</span>
        )}
      </h4>
      
      <div className="notifications-list">
        {notificationsArray.map((notification) => {
          // Debug logging
          console.log(`Rendering notification ${notification.id}`, {
            name: notification.name, 
            email: notification.email, 
            phone: notification.phone
          });
          
          const anonymous = isAnonymousSubmission(notification);
          
          return (
            <div key={notification.id} className="notification-card">
              <div className="notification-header">
                <div className="contact-info">
                  <h5 className="contact-name">
                    {anonymous ? 'Anonymous' : (notification.name || 'Unnamed Contact')}
                  </h5>
                  <span className="notification-date">
                    {formatDate(notification.created_at)}
                  </span>
                </div>
                <div className="notification-status">
                  <span className={`status-badge ${notification.status || 'pending'}`}>
                    {notification.status || 'Pending'}
                  </span>
                </div>
              </div>
              
              <div className="notification-body">
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">Email:</span>
                    {notification.email ? (
                      <a href={`mailto:${notification.email}`} className="contact-value">
                        {notification.email}
                      </a>
                    ) : (
                      <span className="contact-value contact-unavailable">No email provided</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Phone:</span>
                    {notification.phone ? (
                      <a href={`tel:${notification.phone}`} className="contact-value">
                        {notification.phone}
                      </a>
                    ) : (
                      <span className="contact-value contact-unavailable">No phone provided</span>
                    )}
                  </div>
                </div>
                
                <div className="message-container">
                  <h6 className="message-label">Message:</h6>
                  <p className="message-content">{notification.message || 'No message provided'}</p>
                </div>
              </div>
              
              <div className="notification-actions">
                {notification.email && (
                  <button 
                    className="action-button respond"
                    onClick={() => window.location.href = `mailto:${notification.email}?subject=RE: Property Inquiry`}
                  >
                    Respond via Email
                  </button>
                )}
                {notification.phone && (
                  <button 
                    className="action-button call"
                    onClick={() => window.location.href = `tel:${notification.phone}`}
                  >
                    Call
                  </button>
                )}
                <button 
                  className="action-button mark-resolved"
                  onClick={() => updateNotificationStatus(notification.id, 'resolved')}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  
  async function updateNotificationStatus(notificationId, status) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://homilet-backend-2.onrender.com/api/notifications/status/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        // Update the local state
        setNotifications(prevNotifications => 
          Array.isArray(prevNotifications) 
            ? prevNotifications.map(notification => 
                notification.id === notificationId 
                  ? { ...notification, status } 
                  : notification
              )
            : []
        );
      } else {
        console.error('Error response from status update:', await response.json());
      }
    } catch (err) {
      console.error('Error updating notification status:', err);
    }
  }
};

export default PropertyNotifications;