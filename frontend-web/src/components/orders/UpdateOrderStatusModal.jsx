import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import orderService from '../../services/orderService';
import './UpdateOrderStatusModal.css';

const UpdateOrderStatusModal = ({ order, onClose, onUpdate }) => {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', description: 'Order has been created but not confirmed' },
    { value: 'confirmed', label: 'Confirmed', description: 'Order confirmed and awaiting processing' },
    { value: 'processing', label: 'Processing', description: 'Order is being prepared' },
    { value: 'shipped', label: 'Shipped', description: 'Order has been shipped to customer' },
    { value: 'delivered', label: 'Delivered', description: 'Order successfully delivered' },
    { value: 'cancelled', label: 'Cancelled', description: 'Order has been cancelled' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData = {
        status,
        notes
      };

      if (status === 'shipped' && trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      await orderService.updateStatus(order.id, updateData);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusValue) => {
    const colors = {
      'pending': '#fbbf24',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#a855f7',
      'delivered': '#10b981',
      'cancelled': '#ef4444'
    };
    return colors[statusValue] || '#6b7280';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content update-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <CheckCircle size={24} />
            Update Order Status
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="order-info">
              <p className="order-number">Order #{order.order_number}</p>
              <p className="order-title">{order.title}</p>
              <p className="current-status">
                Current Status: <span className={`status-badge ${order.status}`}>{order.status}</span>
              </p>
            </div>

            <div className="form-group">
              <label>New Status <span className="required">*</span></label>
              <div className="status-options">
                {statusOptions.map(option => (
                  <label
                    key={option.value}
                    className={`status-option ${status === option.value ? 'selected' : ''}`}
                    style={{
                      borderColor: status === option.value ? getStatusColor(option.value) : '#e5e7eb',
                      backgroundColor: status === option.value ? getStatusColor(option.value) + '10' : 'white'
                    }}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={status === option.value}
                      onChange={(e) => setStatus(e.target.value)}
                    />
                    <div className="option-content">
                      <span className="option-label">{option.label}</span>
                      <span className="option-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {status === 'shipped' && (
              <div className="form-group">
                <label htmlFor="tracking_number">Tracking Number</label>
                <input
                  type="text"
                  id="tracking_number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Status Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateOrderStatusModal;
