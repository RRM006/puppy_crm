import api from './api';

// Get all pipelines
export const getPipelines = async (companyId) => {
  try {
    const response = await api.get('/pipelines/', {
      params: { company_id: companyId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single pipeline with stages
export const getPipeline = async (id) => {
  try {
    const response = await api.get(`/pipelines/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getPipelines,
  getPipeline
};
