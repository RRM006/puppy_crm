import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle, Truck, MapPin } from 'lucide-react';
import customerPortalService from '../../services/customerPortalService';
import './OrderTrackingModal.css';

const OrderTrackingModal = ({ order, onClose }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();
  }, [order.id]);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.trackOrder(order.id);
      setTracking(data);
    } catch (err) {
      console.error('Failed to load tracking info:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    return [
      { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
      { key: 'processing', label: 'Processing', icon: Package },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: MapPin }
    ];
  };

  const getCurrentStepIndex = (status) => {
    const steps = ['confirmed', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !tracking) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content order-tracking-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="loading-state">Loading tracking information...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(tracking.status);
  const steps = getStatusSteps();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-tracking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Truck size={24} />
            Track Order #{order.order_number}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Current Status */}
          <div className="current-status">
            <h3>Current Status</h3>
            <div className="status-display">
              <span className={`status-badge ${tracking.status}`}>
                {tracking.status.charAt(0).toUpperCase() + tracking.status.slice(1)}
              </span>
              {tracking.estimated_delivery && (
                <p className="eta">
                  Estimated Delivery: <strong>{formatDate(tracking.estimated_delivery)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Tracking Progress */}
          <div className="tracking-progress">
            <div className="progress-steps">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.key} className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="step-connector" />
                    <div className="step-icon-container">
                      <StepIcon size={24} />
                    </div>
                    <div className="step-label">{step.label}</div>
                    {tracking.status_history && tracking.status_history.find(h => h.status === step.key) && (
                      <div className="step-date">
                        {formatDate(tracking.status_history.find(h => h.status === step.key).changed_at)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Number */}
          {tracking.tracking_number && (
            <div className="tracking-info">
              <h4>Tracking Number</h4>
              <div className="tracking-number">{tracking.tracking_number}</div>
            </div>
          )}

          {/* Status History */}
          {tracking.status_history && tracking.status_history.length > 0 && (
            <div className="status-history">
              <h4>Status History</h4>
              <div className="history-timeline">
                {tracking.status_history.slice().reverse().map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-dot" />
                    <div className="history-content">
                      <p className="history-status">
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </p>
                      <p className="history-date">{formatDate(entry.changed_at)}</p>
                      {entry.notes && <p className="history-notes">{entry.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;
