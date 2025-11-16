import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Package, MessageSquare, Activity } from 'lucide-react';
import companyCustomerService from '../../services/companyCustomerService';
import orderService from '../../services/orderService';
import './CustomerDetailModal.css';

const CustomerDetailModal = ({ customer, onClose, onUpdate, tags }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customerDetail, setCustomerDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerDetail();
  }, [customer.id]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      const data = await companyCustomerService.getCustomerDetail(customer.id);
      setCustomerDetail(data);
      
      if (data.recent_orders) {
        setOrders(data.recent_orders);
      }
      
      if (data.recent_interactions) {
        setInteractions(data.recent_interactions);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
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

  if (loading || !customerDetail) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content customer-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="loading-state">Loading customer details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content customer-detail-modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <User size={24} />
            {customerDetail.customer.first_name} {customerDetail.customer.last_name}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders ({customerDetail.order_count})
          </button>
          <button
            className={`tab ${activeTab === 'interactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('interactions')}
          >
            Interactions ({customerDetail.interaction_count})
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Customer Info */}
              <div className="info-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <Mail className="info-icon" />
                    <div>
                      <label>Email</label>
                      <p>{customerDetail.customer.email}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <Phone className="info-icon" />
                    <div>
                      <label>Phone</label>
                      <p>{customerDetail.customer.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <MapPin className="info-icon" />
                    <div>
                      <label>Address</label>
                      <p>
                        {customerDetail.customer.address && (
                          <>
                            {customerDetail.customer.address}<br />
                            {customerDetail.customer.city}, {customerDetail.customer.country}
                          </>
                        ) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="info-section">
                <h3>Statistics</h3>
                <div className="stats-row">
                  <div className="stat-box">
                    <label>Lifetime Value</label>
                    <p className="stat-value">{formatCurrency(customerDetail.total_spent)}</p>
                  </div>
                  <div className="stat-box">
                    <label>Total Orders</label>
                    <p className="stat-value">{customerDetail.order_count}</p>
                  </div>
                  <div className="stat-box">
                    <label>Status</label>
                    <p className="stat-value">
                      <span className={`status-badge ${customerDetail.customer_status}`}>
                        {customerDetail.customer_status}
                      </span>
                    </p>
                  </div>
                  <div className="stat-box">
                    <label>Verified</label>
                    <p className="stat-value">
                      <span className={`status-badge ${customerDetail.verified ? 'verified' : 'unverified'}`}>
                        {customerDetail.verified ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Manager */}
              {customerDetail.account_manager && (
                <div className="info-section">
                  <h3>Account Manager</h3>
                  <div className="manager-info">
                    <User size={40} />
                    <div>
                      <p className="manager-name">
                        {customerDetail.account_manager.first_name} {customerDetail.account_manager.last_name}
                      </p>
                      <p className="manager-email">{customerDetail.account_manager.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {customerDetail.profile?.tags && customerDetail.profile.tags.length > 0 && (
                <div className="info-section">
                  <h3>Tags</h3>
                  <div className="tags-display">
                    {customerDetail.profile.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="tag-badge"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {customerDetail.notes && (
                <div className="info-section">
                  <h3>Internal Notes</h3>
                  <p className="notes-text">{customerDetail.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-tab">
              <div className="tab-header">
                <h3>Order History</h3>
                <button className="btn-primary">Add Order</button>
              </div>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <span className="order-number">{order.order_number}</span>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-details">
                        <p>{order.title}</p>
                        <p className="order-date">{formatDate(order.order_date)}</p>
                      </div>
                      <div className="order-footer">
                        <span className="order-amount">{formatCurrency(order.total_amount)}</span>
                        <button className="btn-link">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="interactions-tab">
              <div className="tab-header">
                <h3>Interaction Timeline</h3>
                <button className="btn-primary">Add Interaction</button>
              </div>
              {interactions.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <p>No interactions recorded</p>
                </div>
              ) : (
                <div className="interactions-timeline">
                  {interactions.map(interaction => (
                    <div key={interaction.id} className="interaction-item">
                      <div className="interaction-icon">
                        <MessageSquare size={20} />
                      </div>
                      <div className="interaction-content">
                        <div className="interaction-header">
                          <span className="interaction-type">{interaction.interaction_type}</span>
                          <span className="interaction-date">{formatDate(interaction.created_at)}</span>
                        </div>
                        <p className="interaction-subject">{interaction.subject}</p>
                        <p className="interaction-user">by {interaction.user_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="empty-state">
                <Activity size={48} />
                <p>Activity log coming soon</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
