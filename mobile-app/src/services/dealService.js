import api from './api';

// Get all deals with filters
export const getDeals = async (params = {}) => {
  try {
    const response = await api.get('/deals/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single deal
export const getDeal = async (id) => {
  try {
    const response = await api.get(`/deals/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create deal
export const createDeal = async (data) => {
  try {
    const response = await api.post('/deals/', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update deal
export const updateDeal = async (id, data) => {
  try {
    const response = await api.put(`/deals/${id}/`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete deal
export const deleteDeal = async (id) => {
  try {
    const response = await api.delete(`/deals/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Move deal to stage
export const moveDealStage = async (id, stageId) => {
  try {
    const response = await api.post(`/deals/${id}/move-stage/`, { stage_id: stageId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Close deal
export const closeDeal = async (id, status, reason = '') => {
  try {
    const response = await api.post(`/deals/${id}/close/`, { status, reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Assign deal
export const assignDeal = async (id, userId) => {
  try {
    const response = await api.post(`/deals/${id}/assign/`, { user_id: userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get deal stats
export const getDealStats = async (companyId, pipelineId) => {
  try {
    const response = await api.get('/deals/stats/', {
      params: { company_id: companyId, pipeline_id: pipelineId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get deals by stage
export const getDealsByStage = async (stageId) => {
  try {
    const response = await api.get(`/deals/by-stage/${stageId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get deal activities
export const getDealActivities = async (id) => {
  try {
    const response = await api.get(`/deals/${id}/activities/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDealStage,
  closeDeal,
  assignDeal,
  getDealStats,
  getDealsByStage,
  getDealActivities
};
