import React, { useState, useEffect, useCallback } from 'react';
import './contact-agent.css';

// Environment configuration with fallback
const API_URL =  'http://localhost:5000';

const ContactAgentModal = ({ propertyDetails }) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  // Form state and error handling
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Pre-fill the form data when property details change
  useEffect(() => {
    if (propertyDetails && propertyDetails.id) {
      console.log('Property details loaded:', {
        id: propertyDetails.id,
        title: propertyDetails.title || 'Untitled Property'
      });
      
      setFormData(prev => ({
        ...prev,
        message: `Hi, I'm interested in the property ${propertyDetails?.title || ''}. Please contact me with more information.`
      }));
    } else {
      console.warn('Property details missing or invalid:', propertyDetails);
    }
  }, [propertyDetails]);

  // Comprehensive form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }
    
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanedPhone.length < 10) {
      newErrors.phone = 'Please enter a complete phone number';
    }
    
    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    return newErrors;
  }, [formData]);

  // Handle input changes with basic sanitization
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Special handling for phone number
    if (name === 'phone') {
      // Format phone number as user types
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 10) {
        // Format as (XXX) XXX-XXXX for US numbers
        if (cleaned.length > 3 && cleaned.length <= 6) {
          processedValue = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else if (cleaned.length > 6) {
          processedValue = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        } else if (cleaned.length <= 3) {
          processedValue = cleaned;
        }
      } else {
        // For international numbers, just limit to 15 digits
        processedValue = cleaned.slice(0, 15);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear specific field error when typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear submission errors when editing form
    if (submitError) {
      setSubmitError(null);
    }
    
    if (connectionError) {
      setConnectionError(false);
    }
    
    if (rateLimitError) {
      setRateLimitError(false);
    }
    
    // Reset retry counter when form is edited
    if (retryCount > 0) {
      setRetryCount(0);
    }
  }, [errors, submitError, connectionError, rateLimitError, retryCount]);

  // Form submission handler with retry logic
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Reset error states
    setSubmitError(null);
    setConnectionError(false);
    setRateLimitError(false);
    
    // Check if property details exist
    if (!propertyDetails || !propertyDetails.id) {
      setSubmitError('Property information is missing. Please try again later.');
      return;
    }
    
    // Validate form
    const validationErrors = validateForm();
    
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      setSubmitError('Authentication required. Please log in.');
      return;
    }
    
    // Prepare submission payload
    const payload = {
      propertyId: propertyDetails.id,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.replace(/\D/g, ''),
      message: formData.message.trim()
    };
    
    // Set submission state
    setIsSubmitting(true);
    
    try {
      console.log('Token available:', !!token);
      console.log('Property details:', { 
        id: propertyDetails.id, 
        title: propertyDetails.title || 'Untitled Property' 
      });
      console.log('Submitting payload:', payload);
      console.log('Current retry attempt:', retryCount + 1, 'of', MAX_RETRIES + 1);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Submit contact request
      const response = await fetch(`${API_URL}/api/contact-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      
      // Handle non-JSON responses with fallback
      let responseData = {};
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const textResponse = await response.text();
          responseData = { message: textResponse || 'Unknown response' };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = { message: 'Unable to parse server response' };
      }
      
      // Handle rate limit response
      if (response.status === 429) {
        console.error('Rate limit exceeded:', responseData);
        setRateLimitError(true);
        setSubmitError(responseData.message || 'You have sent too many messages. Please try again later.');
        return;
      }
      
      // Handle rate limit error message in a 500 response
      if (response.status === 500 && 
          (responseData.message?.toLowerCase().includes('rate limit') || 
           responseData.error?.toLowerCase().includes('rate limit'))) {
        console.error('Rate limit error in 500 response:', responseData);
        setRateLimitError(true);
        setSubmitError("Message rate limit check failed. Please try again later.");
        return;
      }
      
      // Handle database-specific errors
      if (response.status === 500 && 
          (responseData.error === 'DB_OPERATION_ERROR' || 
           responseData.error === 'DB_CONNECTION_ERROR')) {
        
        // Increment retry count
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        // Allow retries for database errors
        if (newRetryCount <= MAX_RETRIES) {
          console.log(`Database error, retrying (${newRetryCount}/${MAX_RETRIES})...`);
          setSubmitError(`Database connection issue. Retrying... (${newRetryCount}/${MAX_RETRIES})`);
          
          // Wait a moment before retrying
          setTimeout(() => {
            handleSubmit();
          }, 2000);
          return;
        }
      }
      
      // Handle other error responses
      if (!response.ok) {
        // Extract specific error information if available
        const errorMessage = responseData.message || `Error (${response.status})`;
        const errorDetails = responseData.errors || responseData.details || null;
        
        console.error('Server error response:', {
          status: response.status,
          message: errorMessage,
          details: errorDetails
        });
        
        if (errorDetails && typeof errorDetails === 'object') {
          // Handle structured validation errors
          const newFieldErrors = {};
          let hasFieldErrors = false;
          
          Object.entries(errorDetails).forEach(([field, message]) => {
            if (['name', 'email', 'phone', 'message'].includes(field)) {
              newFieldErrors[field] = message;
              hasFieldErrors = true;
            }
          });
          
          if (hasFieldErrors) {
            setErrors(newFieldErrors);
            setSubmitError("Please correct the highlighted fields.");
          } else {
            setSubmitError(errorMessage);
          }
        } else {
          setSubmitError(errorMessage);
        }
        
        return;
      }
      
      // Show success state
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setIsOpen(false);
        setSubmitSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: `Hi, I'm interested in the property ${propertyDetails?.title || ''}. Please contact me with more information.`
        });
        setRetryCount(0);
      }, 3000);
    
    } catch (error) {
      // Check if it's a network or timeout error
      if (error.name === 'TypeError' || error.name === 'AbortError') {
        console.error('Network or timeout error:', error);
        setConnectionError(true);
        
        // Increment retry count
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        // Allow retries for connection errors
        if (newRetryCount <= MAX_RETRIES) {
          setSubmitError(`Connection error. Retrying... (${newRetryCount}/${MAX_RETRIES})`);
          
          // Wait before retrying
          setTimeout(() => {
            handleSubmit();
          }, 3000);
          return;
        } else {
          setSubmitError('Could not connect to the server after multiple attempts. Please check your internet connection and try again later.');
        }
      } else {
        // Handle other submission errors
        console.error('Message submission error:', error);
        setSubmitError(error.message || 'Failed to send message. Please try again.');
      }
    } finally {
      // Reset submitting state if we're not retrying
      if (retryCount >= MAX_RETRIES) {
        setIsSubmitting(false);
      }
    }
  }, [formData, propertyDetails, validateForm, retryCount, MAX_RETRIES]);

  // Render the contact agent modal
  return (
    <div className="contact-agent-wrapper">
      {/* Contact Agent Button */}
      <button 
        onClick={() => {
          setIsOpen(true);
          setSubmitError(null);
          setConnectionError(false);
          setRateLimitError(false);
          setRetryCount(0);
          // Pre-fill message with property details
          setFormData(prev => ({
            ...prev,
            message: `Hi, I'm interested in the property ${propertyDetails?.title || ''}. Please contact me with more information.`
          }));
        }}
        className="contact-agent-btn"
        disabled={!propertyDetails}
        aria-label="Contact agent about this property"
      >
        Contact Agent
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="modal-overlay"
          onClick={() => isSubmitting ? null : setIsOpen(false)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="modal-title"
          >
            {/* Conditional Rendering based on submission state */}
            {submitSuccess ? (
              <div className="success-message" role="alert">
                <span className="success-icon">✓</span>
                Message sent successfully! An agent will contact you soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 id="modal-title">Contact Agent for {propertyDetails?.title || 'this property'}</h2>

                {/* Connection Error Message */}
                {connectionError && (
                  <div className="error-message connection-error" role="alert">
                    <strong>Connection Error:</strong> {retryCount > 0 && retryCount <= MAX_RETRIES 
                      ? `Retrying (${retryCount}/${MAX_RETRIES})...` 
                      : "Could not reach the server. Please check your internet connection and try again."}
                  </div>
                )}

                {/* Rate Limit Error Message */}
                {rateLimitError && (
                  <div className="error-message rate-limit-error" role="alert">
                    <strong>Rate Limit Exceeded:</strong> {submitError || "You've sent too many messages. Please try again later."}
                  </div>
                )}

                {/* General Error Message */}
                {submitError && !connectionError && !rateLimitError && (
                  <div className="error-message" role="alert">{submitError}</div>
                )}

                {/* Name Input */}
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Full Name"
                    required
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.name && <span className="error" id="name-error">{errors.name}</span>}
                </div>

                {/* Email Input */}
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.email && <span className="error" id="email-error">{errors.email}</span>}
                </div>

                {/* Phone Input */}
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 555-5555"
                    required
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.phone && <span className="error" id="phone-error">{errors.phone}</span>}
                </div>

                {/* Message Input */}
                <div className="form-group">
                  <label htmlFor="message">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    required
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.message && <span className="error" id="message-error">{errors.message}</span>}
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || rateLimitError}
                    className="btn-submit"
                  >
                    {isSubmitting ? (retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Sending...') : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactAgentModal;