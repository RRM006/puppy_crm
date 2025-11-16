// Deal Service
// Handles all deal-related API calls

import { getAccessToken } from './authService';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`
});

// Get all deals with optional filters
export const getDeals = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.pipeline) params.append('pipeline', filters.pipeline);
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.status) params.append('status', filters.status);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.company_id) params.append('company_id', filters.company_id);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/deals/${queryString ? `?${queryString}` : ''}`;
    
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

// Get deals grouped by stage for Kanban board
export const getDealsByStage = async (pipelineId) => {
  try {
    const params = new URLSearchParams();
    if (pipelineId) params.append('pipeline_id', pipelineId);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/deals/by-stage/${queryString ? `?${queryString}` : ''}`;
    
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

// Get single deal by ID
export const getDeal = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}/`, {
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

// Create new deal
export const createDeal = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/`, {
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

// Update deal
export const updateDeal = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}/`, {
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

// Delete deal (soft delete)
export const deleteDeal = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}/`, {
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

// Move deal to another stage
export const moveDealStage = async (id, stageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}/move-stage/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage_id: stageId })
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

// Close deal (won/lost)
export const closeDeal = async (id, status, lostReason = null) => {
  try {
    const payload = { status };
    if (lostReason) payload.lost_reason = lostReason;
    
    const response = await fetch(`${API_BASE_URL}/deals/${id}/close/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
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

// Assign deal to user
export const assignDeal = async (id, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}/assign/`, {
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

// Get deal statistics
export const getDealStats = async (companyId = null) => {
  try {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/deals/stats/${queryString ? `?${queryString}` : ''}`;

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

// Get deal activities timeline
export const getDealActivities = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}/activities/`, {
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
  getDeals,
  getDealsByStage,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDealStage,
  closeDeal,
  assignDeal,
  getDealStats,
  getDealActivities
};

