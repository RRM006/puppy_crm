import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import companyCustomerService from '../../services/companyCustomerService';
import './VerifyCustomerModal.css';

const VerifyCustomerModal = ({ customer, onClose, onVerify }) => {
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      await companyCustomerService.verifyCustomer(customer.id);
      // TODO: Send welcome email if sendEmail is true
      onVerify();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify customer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content verify-customer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <CheckCircle size={24} />
            Verify Customer
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="verification-info">
            <p className="info-text">
              You are about to verify the customer link for:
            </p>
            
            <div className="customer-summary">
              <h3>{customer.customer_name}</h3>
              <p>{customer.customer_email}</p>
            </div>

            <div className="verification-effects">
              <p className="effects-title">This will:</p>
              <ul>
                <li>Mark the customer as verified in your system</li>
                <li>Set the "Customer Since" date to today</li>
                <li>Allow full access to customer features</li>
                <li>Enable order creation for this customer</li>
              </ul>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span>Send welcome email to customer</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleVerify} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Customer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCustomerModal;
