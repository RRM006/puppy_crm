// Pipeline Service
// Handles pipeline and stage-related API calls

import { getAccessToken } from './authService';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`
});

// Get all pipelines
export const getPipelines = async (companyId = null) => {
  try {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/pipelines/${queryString ? `?${queryString}` : ''}`;

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

// Get single pipeline by ID
export const getPipeline = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines/${id}/`, {
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

// Create pipeline
export const createPipeline = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines/`, {
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

// Update pipeline
export const updatePipeline = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines/${id}/`, {
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

// Delete pipeline
export const deletePipeline = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Create stage
export const createStage = async (pipelineId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines/${pipelineId}/stages/`, {
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

// Update stage
export const updateStage = async (stageId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stages/${stageId}/`, {
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

// Delete stage
export const deleteStage = async (stageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stages/${stageId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Reorder stages
export const reorderStages = async (pipelineId, stageUpdates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pipelines/${pipelineId}/reorder-stages/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage_updates: stageUpdates })
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
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
  createStage,
  updateStage,
  deleteStage,
  reorderStages
};
