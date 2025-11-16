import React, { useState, useEffect } from 'react';
import { Package, Calendar, DollarSign, TrendingUp, Eye, Search } from 'lucide-react';
import customerPortalService from '../services/customerPortalService';
import OrderDetailModal from '../components/customer/OrderDetailModal';
import OrderTrackingModal from '../components/customer/OrderTrackingModal';
import './CustomerOrders.css';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    search: '',
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
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getMyOrders(filters);
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

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
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
    <div className="customer-orders-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            <Package size={32} />
            My Orders
          </h1>
          <p className="page-subtitle">View and track all your orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.search}
            onChange={handleSearch}
          />
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
        </div>
      </div>

      {/* Orders List */}
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
          {orders.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No orders yet</h3>
              <p>Your order history will appear here</p>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <span className="order-number">#{order.order_number}</span>
                      <h3 className="order-title">{order.title}</h3>
                    </div>
                    <span className={`status-badge ${order.status}`}>
                      {getStatusBadge(order.status)}
                    </span>
                  </div>

                  <div className="order-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>Order Date: {formatDate(order.order_date)}</span>
                    </div>
                    {order.delivery_date && (
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>Expected: {formatDate(order.delivery_date)}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <DollarSign size={16} />
                      <span>Total: {formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button className="btn-secondary" onClick={() => handleViewDetails(order)}>
                      <Eye size={16} />
                      View Details
                    </button>
                    {(order.status === 'processing' || order.status === 'shipped') && (
                      <button className="btn-primary" onClick={() => handleTrackOrder(order)}>
                        Track Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showTrackingModal && selectedOrder && (
        <OrderTrackingModal
          order={selectedOrder}
          onClose={() => {
            setShowTrackingModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerOrders;
