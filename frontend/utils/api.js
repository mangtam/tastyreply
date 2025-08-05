// utils/api.js - API client with authentication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = getAuthToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      removeAuthToken();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth methods
  loginWithGoogle() {
    window.location.href = `${this.baseURL}/auth/google`;
  }

  async getCurrentUser() {
    return this.request('/api/user');
  }

  // Review methods
  async getGoogleReviews() {
    return this.request('/api/reviews/google');
  }

  async postReply(reviewId, reply) {
    return this.request(`/api/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply })
    });
  }

  // Google My Business methods
  async getGoogleAccounts() {
    return this.request('/api/google/accounts');
  }
}

export default new ApiClient();