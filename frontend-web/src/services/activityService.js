// Activity Service
// Handles all activity-related API calls

import { getAccessToken } from './authService';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`
});

// Get activities with optional filters
export const getActivities = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.lead) params.append('lead', filters.lead);
    if (filters.deal) params.append('deal', filters.deal);
    if (filters.user) params.append('user', filters.user);
    if (filters.activity_type) params.append('activity_type', filters.activity_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.company_id) params.append('company_id', filters.company_id);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/activities/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Create activity
export const createActivity = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Mark activity as complete
export const markActivityComplete = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/${id}/complete/`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export default {
  getActivities,
  createActivity,
  markActivityComplete
};

