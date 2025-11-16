// Lead Service
// Handles all lead-related API calls

import { getAccessToken } from './authService';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`
});

// Get all leads with optional filters
export const getLeads = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.lead_source) params.append('lead_source', filters.lead_source);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.company_id) params.append('company_id', filters.company_id);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/leads/${queryString ? `?${queryString}` : ''}`;
    
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

// Get single lead by ID
export const getLead = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/`, {
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

// Create new lead
export const createLead = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/`, {
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

// Update lead
export const updateLead = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/`, {
      method: 'PUT',
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

// Delete lead (soft delete)
export const deleteLead = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Convert lead to deal
export const convertLead = async (id, dealData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/convert/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dealData)
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

// Assign lead to user
export const assignLead = async (id, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/assign/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId })
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

// Get lead statistics
export const getLeadStats = async (companyId = null) => {
  try {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/leads/stats/${queryString ? `?${queryString}` : ''}`;

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

// Get lead activities timeline
export const getLeadActivities = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${id}/activities/`, {
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

export default {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  assignLead,
  getLeadStats,
  getLeadActivities
};
