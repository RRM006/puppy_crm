/**
 * Order Management Service
 * Handles all order-related API calls for company users
 */

import api from './api';

const orderService = {
  /**
   * Get list of orders with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise} Orders list with pagination
   */
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.page) params.append('page', filters.page);
    if (filters.page_size) params.append('page_size', filters.page_size);
    
    const response = await api.get(`/orders/?${params.toString()}`);
    return response.data;
  },

  /**
   * Create new order
   * @param {Object} data - Order data
   * @returns {Promise} Created order
   */
  createOrder: async (data) => {
    const response = await api.post('/orders/', data);
    return response.data;
  },

  /**
   * Get order details
   * @param {number} orderId - Order ID
   * @returns {Promise} Order details
   */
  getOrderDetail: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/`);
    return response.data;
  },

  /**
   * Update order
   * @param {number} orderId - Order ID
   * @param {Object} data - Updated data
   * @returns {Promise} Updated order
   */
  updateOrder: async (orderId, data) => {
    const response = await api.put(`/orders/${orderId}/`, data);
    return response.data;
  },

  /**
   * Delete order
   * @param {number} orderId - Order ID
   * @returns {Promise} Delete result
   */
  deleteOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}/`);
    return response.data;
  },

  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {Object} data - Status update data
   * @returns {Promise} Updated order
   */
  updateStatus: async (orderId, data) => {
    const response = await api.post(`/orders/${orderId}/update-status/`, data);
    return response.data;
  },

  /**
   * Add item to order
   * @param {number} orderId - Order ID
   * @param {Object} data - Item data
   * @returns {Promise} Updated order
   */
  addItem: async (orderId, data) => {
    const response = await api.post(`/orders/${orderId}/add-item/`, data);
    return response.data;
  },

  /**
   * Remove item from order
   * @param {number} orderId - Order ID
   * @param {number} itemId - Item ID
   * @returns {Promise} Updated order
   */
  removeItem: async (orderId, itemId) => {
    const response = await api.delete(`/orders/${orderId}/items/${itemId}/`);
    return response.data;
  },

  /**
   * Get order statistics
   * @returns {Promise} Order stats
   */
  getOrderStats: async () => {
    const response = await api.get('/orders/stats/');
    return response.data;
  },

  /**
   * Get customer's orders
   * @param {number} customerId - Customer ID
   * @returns {Promise} Orders list
   */
  getCustomerOrders: async (customerId) => {
    const response = await api.get(`/orders/customer/${customerId}/`);
    return response.data;
  },
};

export default orderService;
