import React, { useState } from 'react';
import { X, Search, User, Mail, Phone, MapPin, Building, Tag as TagIcon } from 'lucide-react';
import companyCustomerService from '../../services/companyCustomerService';
import './AddCustomerModal.css';

const AddCustomerModal = ({ onClose, onSuccess, tags }) => {
  const [step, setStep] = useState('search'); // 'search', 'create', 'confirm'
  const [email, setEmail] = useState('');
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    company_name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    notes: '',
    account_manager_id: null,
    tag_ids: []
  });

  const handleEmailSearch = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Try to find existing customer
      // Note: This would require a search endpoint, for now we'll proceed to create
      setFormData(prev => ({ ...prev, email }));
      setStep('create');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await companyCustomerService.addCustomer(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.email?.[0] || 'Failed to add customer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-customer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <User size={24} />
            Add Customer
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 'search' && (
          <form onSubmit={handleEmailSearch} className="modal-body">
            <div className="search-customer-section">
              <p className="section-description">
                Search for an existing customer by email address, or create a new customer profile.
              </p>
              
              <div className="form-group">
                <label htmlFor="email">Customer Email</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 'create' && (
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="form-scroll">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <div className="input-with-icon">
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone_number">Phone Number</label>
                    <div className="input-with-icon">
                      <Phone className="input-icon" />
                      <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="company_name">Company Name</label>
                    <div className="input-with-icon">
                      <Building className="input-icon" />
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <div className="input-with-icon">
                    <MapPin className="input-icon" />
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State/Province</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="postal_code">Postal Code</label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {tags && tags.length > 0 && (
                <div className="form-section">
                  <h3>
                    <TagIcon size={18} />
                    Tags
                  </h3>
                  <div className="tags-grid">
                    {tags.map(tag => (
                      <label key={tag.id} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.tag_ids.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                        />
                        <span
                          className="tag-label"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-section">
                <h3>Internal Notes</h3>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Add any internal notes about this customer..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddCustomerModal;
