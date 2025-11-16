import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, DollarSign, MapPin } from 'lucide-react';
import customerPortalService from '../../services/customerPortalService';
import './OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetail();
  }, [order.id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getOrderDetail(order.id);
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
      month: 'long',
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
        <div className="modal-content customer-order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="loading-state">Loading order details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content customer-order-detail-modal large" onClick={(e) => e.stopPropagation()}>
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
          <div className="order-summary-card">
            <h3>{orderDetail.title}</h3>
            {orderDetail.description && (
              <p className="description">{orderDetail.description}</p>
            )}
            
            <div className="summary-grid">
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
                  <label>Expected Delivery</label>
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
          </div>

          {/* Delivery Address */}
          {orderDetail.delivery_address && (
            <div className="info-section">
              <h4>
                <MapPin size={18} />
                Delivery Address
              </h4>
              <div className="address-card">
                <p>{orderDetail.delivery_address}</p>
                <p>{orderDetail.delivery_city}, {orderDetail.delivery_state} {orderDetail.delivery_postal_code}</p>
                <p>{orderDetail.delivery_country}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="info-section">
            <h4>Order Items</h4>
            <div className="items-list">
              {orderDetail.items && orderDetail.items.map(item => (
                <div key={item.id} className="item-row">
                  <div className="item-info">
                    <p className="item-description">{item.description}</p>
                    <p className="item-meta">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <div className="item-total">{formatCurrency(item.quantity * item.unit_price)}</div>
                </div>
              ))}
            </div>
            
            <div className="order-total">
              <span>Total</span>
              <span className="total-amount">{formatCurrency(orderDetail.total_amount)}</span>
            </div>
          </div>

          {/* Company Info */}
          <div className="info-section">
            <h4>Company</h4>
            <div className="company-card">
              <p className="company-name">{orderDetail.company_name}</p>
              {orderDetail.company_email && (
                <p className="company-email">{orderDetail.company_email}</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {orderDetail.status !== 'cancelled' && orderDetail.status !== 'delivered' && (
            <button className="btn-danger" onClick={() => {
              // TODO: Implement cancel order
              alert('Cancel order functionality coming soon');
            }}>
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
