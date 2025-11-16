/**
 * Company Customer Management Service
 * Handles all customer management API calls for company users
 */

import api from './api';

const companyCustomerService = {
  /**
   * Get list of customers with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise} Customer list with pagination
   */
  getCustomers: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.verified !== undefined) params.append('verified', filters.verified);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.account_manager) params.append('account_manager', filters.account_manager);
    if (filters.since_from) params.append('since_from', filters.since_from);
    if (filters.since_to) params.append('since_to', filters.since_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.page) params.append('page', filters.page);
    if (filters.page_size) params.append('page_size', filters.page_size);
    
    const response = await api.get(`/customers/?${params.toString()}`);
    return response.data;
  },

  /**
   * Add new customer to company
   * @param {Object} data - Customer data
   * @returns {Promise} Created customer
   */
  addCustomer: async (data) => {
    const response = await api.post('/customers/', data);
    return response.data;
  },

  /**
   * Get customer details
   * @param {number} customerId - Customer ID
   * @returns {Promise} Customer details
   */
  getCustomerDetail: async (customerId) => {
    const response = await api.get(`/customers/${customerId}/`);
    return response.data;
  },

  /**
   * Update customer information
   * @param {number} customerId - Customer ID
   * @param {Object} data - Updated data
   * @returns {Promise} Updated customer
   */
  updateCustomer: async (customerId, data) => {
    const response = await api.put(`/customers/${customerId}/`, data);
    return response.data;
  },

  /**
   * Verify customer's link to company
   * @param {number} customerId - Customer ID
   * @returns {Promise} Verification result
   */
  verifyCustomer: async (customerId) => {
    const response = await api.post(`/customers/${customerId}/verify/`);
    return response.data;
  },

  /**
   * Assign account manager to customer
   * @param {number} customerId - Customer ID
   * @param {number} managerId - User ID of account manager
   * @returns {Promise} Assignment result
   */
  assignManager: async (customerId, managerId) => {
    const response = await api.post(`/customers/${customerId}/assign-manager/`, {
      account_manager_id: managerId
    });
    return response.data;
  },

  /**
   * Unlink customer from company
   * @param {number} customerId - Customer ID
   * @returns {Promise} Unlink result
   */
  unlinkCustomer: async (customerId) => {
    const response = await api.post(`/customers/${customerId}/unlink/`);
    return response.data;
  },

  /**
   * Get customer statistics
   * @returns {Promise} Customer stats
   */
  getCustomerStats: async () => {
    const response = await api.get('/customers/stats/');
    return response.data;
  },

  /**
   * Get customer interactions
   * @param {number} customerId - Customer ID
   * @returns {Promise} Interactions list
   */
  getCustomerInteractions: async (customerId) => {
    const response = await api.get(`/customers/${customerId}/interactions/`);
    return response.data;
  },

  // ============================================================================
  // Tags Management
  // ============================================================================

  /**
   * Get all tags
   * @returns {Promise} Tags list
   */
  getTags: async () => {
    const response = await api.get('/customers/tags/');
    return response.data;
  },

  /**
   * Create new tag
   * @param {Object} data - Tag data (name, color)
   * @returns {Promise} Created tag
   */
  createTag: async (data) => {
    const response = await api.post('/customers/tags/', data);
    return response.data;
  },

  /**
   * Update tag
   * @param {number} tagId - Tag ID
   * @param {Object} data - Updated tag data
   * @returns {Promise} Updated tag
   */
  updateTag: async (tagId, data) => {
    const response = await api.put(`/customers/tags/${tagId}/`, data);
    return response.data;
  },

  /**
   * Delete tag
   * @param {number} tagId - Tag ID
   * @returns {Promise} Delete result
   */
  deleteTag: async (tagId) => {
    const response = await api.delete(`/customers/tags/${tagId}/`);
    return response.data;
  },

  // ============================================================================
  // Segments Management
  // ============================================================================

  /**
   * Get all segments
   * @returns {Promise} Segments list
   */
  getSegments: async () => {
    const response = await api.get('/customers/segments/');
    return response.data;
  },

  /**
   * Create new segment
   * @param {Object} data - Segment data (name, description, criteria)
   * @returns {Promise} Created segment
   */
  createSegment: async (data) => {
    const response = await api.post('/customers/segments/', data);
    return response.data;
  },

  /**
   * Update segment
   * @param {number} segmentId - Segment ID
   * @param {Object} data - Updated segment data
   * @returns {Promise} Updated segment
   */
  updateSegment: async (segmentId, data) => {
    const response = await api.put(`/customers/segments/${segmentId}/`, data);
    return response.data;
  },

  /**
   * Delete segment
   * @param {number} segmentId - Segment ID
   * @returns {Promise} Delete result
   */
  deleteSegment: async (segmentId) => {
    const response = await api.delete(`/customers/segments/${segmentId}/`);
    return response.data;
  },

  /**
   * Get customers in segment
   * @param {number} segmentId - Segment ID
   * @returns {Promise} Customers list
   */
  getSegmentCustomers: async (segmentId) => {
    const response = await api.get(`/customers/segments/${segmentId}/customers/`);
    return response.data;
  },
};

export default companyCustomerService;
