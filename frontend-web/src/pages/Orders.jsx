import React, { useState, useEffect } from 'react';
import { Package, Plus, Download, Search, Filter, ChevronDown, Eye, Edit, X, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import orderService from '../services/orderService';
import CreateOrderModal from '../components/orders/CreateOrderModal';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import UpdateOrderStatusModal from '../components/orders/UpdateOrderStatusModal';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    start_date: '',
    end_date: '',
    search: '',
    sort_by: '-order_date',
    page: 1,
    page_size: 20
  });
  
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null
  });

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders(filters);
      setOrders(data.results || data);
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous
      });
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await orderService.getOrderStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (field) => {
    const isDesc = filters.sort_by === `-${field}`;
    setFilters(prev => ({
      ...prev,
      sort_by: isDesc ? field : `-${field}`
    }));
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await orderService.deleteOrder(orderId);
      loadOrders();
      loadStats();
    } catch (err) {
      alert('Failed to delete order');
      console.error(err);
    }
  };

  const exportOrders = async () => {
    try {
      // TODO: Implement export functionality
      alert('Export functionality coming soon');
    } catch (err) {
      alert('Failed to export orders');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="page-header">
        <h1>
          <Package size={32} />
          Orders
        </h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={exportOrders}>
            <Download size={18} />
            Export
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Orders</span>
              <Package className="stat-icon" size={20} />
            </div>
            <div className="stat-value">{stats.total_orders || 0}</div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              <span>+12% from last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Revenue</span>
              <TrendingUp className="stat-icon" size={20} />
            </div>
            <div className="stat-value">{formatCurrency(stats.total_revenue || 0)}</div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              <span>+8% from last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Average Order</span>
              <TrendingUp className="stat-icon" size={20} />
            </div>
            <div className="stat-value">{formatCurrency(stats.average_order_value || 0)}</div>
            <div className="stat-trend">
              <span>Across all orders</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Pending Orders</span>
              <Package className="stat-icon" size={20} />
            </div>
            <div className="stat-value">{stats.pending_orders || 0}</div>
            <div className="stat-trend">
              <span>Requires attention</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>
            <Filter size={18} />
            Filters
          </h3>
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="error-container">
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('order_number')}>Order #</th>
                  <th onClick={() => handleSort('customer')}>Customer</th>
                  <th onClick={() => handleSort('title')}>Title</th>
                  <th onClick={() => handleSort('order_date')}>Order Date</th>
                  <th onClick={() => handleSort('status')}>Status</th>
                  <th onClick={() => handleSort('total_amount')}>Amount</th>
                  <th onClick={() => handleSort('delivery_date')}>Delivery Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <Package size={48} />
                        <p>No orders found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <span className="order-number">{order.order_number}</span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{order.customer_name}</div>
                          <div className="customer-email">{order.customer_email}</div>
                        </div>
                      </td>
                      <td>{order.title}</td>
                      <td>{formatDate(order.order_date)}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {getStatusBadge(order.status)}
                        </span>
                      </td>
                      <td className="amount">{formatCurrency(order.total_amount)}</td>
                      <td>{formatDate(order.delivery_date)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleView(order)}
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleUpdateStatus(order)}
                            title="Update status"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(order.id)}
                            title="Delete order"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.count > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {((filters.page - 1) * filters.page_size) + 1} to {Math.min(filters.page * filters.page_size, pagination.count)} of {pagination.count} orders
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.previous}
                >
                  Previous
                </button>
                <span className="page-number">Page {filters.page}</span>
                <button
                  className="pagination-button"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.next}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadOrders();
            loadStats();
          }}
        />
      )}

      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          onUpdate={() => {
            loadOrders();
            loadStats();
          }}
        />
      )}

      {showStatusModal && selectedOrder && (
        <UpdateOrderStatusModal
          order={selectedOrder}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
          onUpdate={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
            loadOrders();
            loadStats();
          }}
        />
      )}
    </div>
  );
};

export default Orders;
