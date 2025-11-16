import React, { useState, useEffect } from 'react';
import { X, Package, User, Calendar, DollarSign, MapPin, MessageSquare } from 'lucide-react';
import orderService from '../../services/orderService';
import './OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose, onUpdate }) => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetail();
  }, [order.id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderDetail(order.id);
      setOrderDetail(data);
    } catch (err) {
      console.error('Failed to load order details:', err);
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

  if (loading || !orderDetail) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="loading-state">Loading order details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-detail-modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>
              <Package size={24} />
              Order #{orderDetail.order_number}
            </h2>
            <span className={`status-badge ${orderDetail.status}`}>
              {getStatusBadge(orderDetail.status)}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-item">
              <Calendar className="summary-icon" />
              <div>
                <label>Order Date</label>
                <p>{formatDate(orderDetail.order_date)}</p>
              </div>
            </div>
            <div className="summary-item">
              <Calendar className="summary-icon" />
              <div>
                <label>Delivery Date</label>
                <p>{formatDate(orderDetail.delivery_date) || 'Not set'}</p>
              </div>
            </div>
            <div className="summary-item">
              <DollarSign className="summary-icon" />
              <div>
                <label>Total Amount</label>
                <p className="amount">{formatCurrency(orderDetail.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Order Title & Description */}
          <div className="info-section">
            <h3>Order Details</h3>
            <h4>{orderDetail.title}</h4>
            {orderDetail.description && (
              <p className="description">{orderDetail.description}</p>
            )}
          </div>

          {/* Customer Information */}
          <div className="info-section">
            <h3>
              <User size={18} />
              Customer Information
            </h3>
            <div className="customer-card">
              <div className="customer-info">
                <p className="customer-name">{orderDetail.customer_name}</p>
                <p className="customer-email">{orderDetail.customer_email}</p>
                {orderDetail.customer_phone && (
                  <p className="customer-phone">{orderDetail.customer_phone}</p>
                )}
              </div>
              {orderDetail.customer_address && (
                <div className="customer-address">
                  <MapPin size={16} />
                  <span>
                    {orderDetail.customer_address}, {orderDetail.customer_city}, {orderDetail.customer_country}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="info-section">
            <h3>Order Items</h3>
            <div className="items-table">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetail.items && orderDetail.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">Total</td>
                    <td className="total-amount">{formatCurrency(orderDetail.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status Timeline */}
          {orderDetail.status_history && orderDetail.status_history.length > 0 && (
            <div className="info-section">
              <h3>Status History</h3>
              <div className="timeline">
                {orderDetail.status_history.map((entry, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className={`status-badge ${entry.status}`}>
                        {getStatusBadge(entry.status)}
                      </span>
                      <span className="timeline-date">{formatDate(entry.changed_at)}</span>
                      {entry.notes && <p className="timeline-notes">{entry.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {orderDetail.notes && (
            <div className="info-section">
              <h3>
                <MessageSquare size={18} />
                Internal Notes
              </h3>
              <p className="notes-text">{orderDetail.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={() => {
            // TODO: Open edit modal or navigate to edit page
            alert('Edit functionality coming soon');
          }}>
            Edit Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
