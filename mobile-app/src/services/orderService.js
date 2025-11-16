import api from './api';

const orderService = {
  // Get all orders with filters
  getOrders: async (params = {}) => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },

  // Get single order
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  // Create order
  createOrder: async (data) => {
    const response = await api.post('/orders/', data);
    return response.data;
  },

  // Update order
  updateOrder: async (id, data) => {
    const response = await api.put(`/orders/${id}/`, data);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id, data) => {
    const response = await api.patch(`/orders/${id}/status/`, data);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id) => {
    await api.delete(`/orders/${id}/`);
  },

  // Get order statistics
  getStats: async () => {
    const response = await api.get('/orders/stats/');
    return response.data;
  },
};

export default orderService;
