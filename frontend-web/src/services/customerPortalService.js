/**
 * Customer Portal Service
 * Handles API calls for customer-facing portal features
 */

import api from './api';

const customerPortalService = {
  /**
   * Get customer dashboard data
   * @returns {Promise} Dashboard data
   */
  getDashboard: async () => {
    const response = await api.get('/customer/dashboard/');
    return response.data;
  },

  /**
   * Get customer's orders
   * @param {Object} filters - Filter parameters
   * @returns {Promise} Orders list
   */
  getMyOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.company_id) params.append('company_id', filters.company_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.page_size) params.append('page_size', filters.page_size);
    
    const response = await api.get(`/customer/my-orders/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get order details (customer view)
   * @param {number} orderId - Order ID
   * @returns {Promise} Order details
   */
  getOrderDetail: async (orderId) => {
    const response = await api.get(`/customer/orders/${orderId}/`);
    return response.data;
  },

  /**
   * Get order tracking information
   * @param {number} orderId - Order ID
   * @returns {Promise} Tracking info
   */
  trackOrder: async (orderId) => {
    const response = await api.get(`/customer/orders/${orderId}/tracking/`);
    return response.data;
  },

  /**
   * Get list of companies customer is linked to
   * @returns {Promise} Companies list
   */
  getMyCompanies: async () => {
    const response = await api.get('/customer/my-companies/');
    return response.data;
  },

  /**
   * Request verification from a company
   * @param {number} companyId - Company ID
   * @param {string} message - Optional message
   * @returns {Promise} Request result
   */
  requestVerification: async (companyId, message = '') => {
    const response = await api.post(`/customer/request-verification/${companyId}/`, {
      message
    });
    return response.data;
  },

  /**
   * Cancel order (if eligible)
   * @param {number} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Cancellation result
   */
  cancelOrder: async (orderId, reason = '') => {
    const response = await api.post(`/customer/orders/${orderId}/cancel/`, {
      reason
    });
    return response.data;
  },
};

export default customerPortalService;
