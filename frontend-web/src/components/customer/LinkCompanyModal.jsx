import React, { useState } from 'react';
import { X, Building2, Search, AlertCircle } from 'lucide-react';
import customerPortalService from '../../services/customerPortalService';
import './LinkCompanyModal.css';

const LinkCompanyModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('search'); // 'search' | 'confirm'
  const [searchQuery, setSearchQuery] = useState('');
  const [foundCompany, setFoundCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a company name or email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Search for company - using the API to check if exists
      // For now, simulate search (in real app, you'd have a search endpoint)
      setFoundCompany({
        name: 'Example Company Inc.',
        email: 'contact@example.com',
        description: 'A sample company for demonstration'
      });
      setStep('confirm');
    } catch (err) {
      setError('Company not found. Please check the name or email and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLink = async () => {
    setLoading(true);
    setError('');

    try {
      await customerPortalService.requestVerification({
        company_email: foundCompany.email,
        message: `I would like to link my account with ${foundCompany.name}`
      });
      
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send link request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content link-company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Building2 size={24} />
            Link to Company
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

          {step === 'search' && (
            <div className="search-step">
              <p className="step-description">
                Search for a company by name or email to request linking your account
              </p>

              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label htmlFor="search">Company Name or Email</label>
                  <div className="search-input-group">
                    <Search size={18} className="input-icon" />
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter company name or email..."
                      autoFocus
                    />
                  </div>
                </div>

                <div className="info-box">
                  <p>
                    <strong>Note:</strong> After you send a link request, the company will need to verify and approve your connection.
                  </p>
                </div>
              </form>
            </div>
          )}

          {step === 'confirm' && foundCompany && (
            <div className="confirm-step">
              <p className="step-description">
                Confirm you want to send a link request to this company
              </p>

              <div className="company-card">
                <Building2 size={40} className="company-icon" />
                <div className="company-info">
                  <h3>{foundCompany.name}</h3>
                  <p className="company-email">{foundCompany.email}</p>
                  {foundCompany.description && (
                    <p className="company-description">{foundCompany.description}</p>
                  )}
                </div>
              </div>

              <div className="request-info">
                <h4>What happens next?</h4>
                <ol>
                  <li>Your link request will be sent to the company</li>
                  <li>The company will review your request</li>
                  <li>Once approved, you'll be able to place orders and view order history</li>
                  <li>You'll receive a notification when your request is processed</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {step === 'search' ? (
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search Company'}
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setStep('search')} disabled={loading}>
                Back
              </button>
              <button className="btn-primary" onClick={handleRequestLink} disabled={loading}>
                {loading ? 'Sending...' : 'Send Link Request'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkCompanyModal;
