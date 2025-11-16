import api from './api';

// Get all leads with filters
export const getLeads = async (params = {}) => {
  try {
    const response = await api.get('/leads/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single lead
export const getLead = async (id) => {
  try {
    const response = await api.get(`/leads/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create lead
export const createLead = async (data) => {
  try {
    const response = await api.post('/leads/', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update lead
export const updateLead = async (id, data) => {
  try {
    const response = await api.put(`/leads/${id}/`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete lead
export const deleteLead = async (id) => {
  try {
    const response = await api.delete(`/leads/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Convert lead to deal
export const convertLead = async (id, data) => {
  try {
    const response = await api.post(`/leads/${id}/convert/`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Assign lead
export const assignLead = async (id, userId) => {
  try {
    const response = await api.post(`/leads/${id}/assign/`, { user_id: userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get lead stats
export const getLeadStats = async (companyId) => {
  try {
    const response = await api.get('/leads/stats/', { params: { company_id: companyId } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get lead activities
export const getLeadActivities = async (id) => {
  try {
    const response = await api.get(`/leads/${id}/activities/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
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
