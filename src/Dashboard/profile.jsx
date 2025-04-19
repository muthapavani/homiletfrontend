import React from 'react';
import './profile.css';

class ProfileSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        name: '',
        email: '',
        phone: '',
        address: '',
        role: 'tenant'
      },
      isEditing: false,
      message: { text: '', type: '' },
      isLoading: false
    };
  }

  componentDidMount() {
    this.loadUserData();
  }

  loadUserData = async () => {
    this.setState({ isLoading: true });

    // Debug token
    const token = localStorage.getItem('token');
    console.log("Token in localStorage:", token);
    
    if (!token) {
      this.setState({ 
        isLoading: false,
        message: { 
          text: 'Authentication required. Please log in again.', 
          type: 'error' 
        } 
      });
      return;
    }

    try {
      // Ensure token is correctly formatted
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log("Authorization header:", authHeader);
      
      const response = await fetch('https://homilet-backend-2.onrender.com/api/user', {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Fetched User Data:", userData);

        // Update localStorage and state consistently
        localStorage.setItem('userData', JSON.stringify(userData));
        
        this.setState({
          formData: {
            name: userData.username || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            role: userData.role || 'tenant'
          },
          message: { text: '', type: '' }
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch user data:', errorData);
        
        // If token is invalid or expired, clear it
        if (response.status === 401) {
          localStorage.removeItem('token');
        }
        
        this.setState({ 
          message: { 
            text: errorData.message || 'Failed to load profile. Please log in again.', 
            type: 'error' 
          } 
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.setState({ 
        message: { 
          text: `Network error: ${error.message}`, 
          type: 'error' 
        } 
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ isLoading: true, message: { text: '', type: '' } });
    
    // Get token with debug
    const token = localStorage.getItem('token');
    console.log("Token for profile update:", token);
    
    if (!token) {
      this.setState({ 
        isLoading: false,
        message: { 
          text: 'Authentication required. Please log in again.', 
          type: 'error' 
        } 
      });
      return;
    }
    
    try {
      // Ensure token is correctly formatted
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch('https://homilet-backend-2.onrender.com/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        credentials: 'include',
        body: JSON.stringify(this.state.formData)
      });

      const responseData = await response.json();
      console.log("Server Response:", responseData);

      if (response.ok) {
        localStorage.setItem('userData', JSON.stringify(responseData.user));
        
        this.setState({ 
          message: { text: 'Profile updated successfully!', type: 'success' },
          isEditing: false
        });
      } else {
        // If token is invalid or expired, clear it
        if (response.status === 401) {
          localStorage.removeItem('token');
        }
        
        this.setState({ 
          message: { 
            text: responseData.message || 'Profile update failed', 
            type: 'error' 
          } 
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      this.setState({ 
        message: { 
          text: `Error: ${error.message}`, 
          type: 'error' 
        } 
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleEditButtonClick = () => {
    if (this.state.isEditing) {
      // Cancel editing, revert to saved data
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        this.setState({
          isEditing: false,
          formData: {
            name: userData.username || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            role: userData.role || 'tenant'
          },
          message: { text: '', type: '' }
        });
      }
    } else {
      // Enter edit mode
      this.setState({ isEditing: true });
    }
  };

  render() {
    const { formData, isEditing, message, isLoading } = this.state;

    return (
      <div className="profile-section">
        <div className="profile-header">
          <h2>My Profile</h2>
          <button 
            className={`edit-button ${isEditing ? 'cancel' : ''}`}
            onClick={this.handleEditButtonClick}
            type="button"
            disabled={isLoading}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        {isLoading && (
          <div className="loading-indicator">Loading...</div>
        )}
        
        <form onSubmit={this.handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={this.handleChange}
              readOnly={!isEditing}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={this.handleChange}
              readOnly={!isEditing}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Phone</label>
            <input 
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={this.handleChange}
              readOnly={!isEditing}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Address</label>
            <textarea 
              name="address"
              value={formData.address || ''}
              onChange={this.handleChange}
              readOnly={!isEditing}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <select 
              name="role"
              value={formData.role || 'tenant'}
              onChange={this.handleChange}
              disabled={!isEditing || isLoading}
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          </div>
          
          {isEditing && (
            <div className="form-group">
              <button 
                type="submit" 
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }
}

export default ProfileSection;