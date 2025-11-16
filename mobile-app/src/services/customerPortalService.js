import api from './api';

const customerPortalService = {
  // Get customer's orders
  getMyOrders: async (params = {}) => {
    const response = await api.get('/portal/orders/', { params });
    return response.data;
  },

  // Get single order
  getOrderDetail: async (id) => {
    const response = await api.get(`/portal/orders/${id}/`);
    return response.data;
  },

  // Get order tracking info
  getOrderTracking: async (id) => {
    const response = await api.get(`/portal/orders/${id}/tracking/`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id, data) => {
    const response = await api.post(`/portal/orders/${id}/cancel/`, data);
    return response.data;
  },

  // Get linked companies
  getLinkedCompanies: async () => {
    const response = await api.get('/portal/linked-companies/');
    return response.data;
  },

  // Search companies
  searchCompanies: async (query) => {
    const response = await api.get('/portal/companies/search/', {
      params: { q: query },
    });
    return response.data;
  },

  // Request company link
  requestCompanyLink: async (data) => {
    const response = await api.post('/portal/company-link-requests/', data);
    return response.data;
  },

  // Get link requests
  getLinkRequests: async () => {
    const response = await api.get('/portal/company-link-requests/');
    return response.data;
  },

  // Get order statistics
  getOrderStats: async () => {
    const response = await api.get('/portal/orders/stats/');
    return response.data;
  },
};

export default customerPortalService;
