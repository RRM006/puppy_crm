import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { createLead } from '../../services/leadService';
import { useAuth } from '../../contexts/AuthContext';

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const CreateLeadModal = ({ open, onClose, onSuccess, onError, teamMembers = [] }) => {
  const { company } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    lead_source: 'website',
    estimated_value: '',
    assigned_to_id: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reset = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_name: '',
      job_title: '',
      lead_source: 'website',
      estimated_value: '',
      assigned_to_id: '',
      notes: ''
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Apply max length limits based on backend constraints
    let processedValue = value;
    const maxLengths = {
      first_name: 120,
      last_name: 120,
      phone: 32,
      company_name: 255,
      job_title: 120,
      notes: 5000
    };
    if (maxLengths[name] && value.length > maxLengths[name]) {
      processedValue = value.slice(0, maxLengths[name]);
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length > 120) {
      newErrors.first_name = 'First name must be 120 characters or less';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length > 120) {
      newErrors.last_name = 'Last name must be 120 characters or less';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && formData.phone.length > 32) {
      newErrors.phone = 'Phone must be 32 characters or less';
    }
    if (formData.company_name && formData.company_name.length > 255) {
      newErrors.company_name = 'Company name must be 255 characters or less';
    }
    if (formData.job_title && formData.job_title.length > 120) {
      newErrors.job_title = 'Job title must be 120 characters or less';
    }
    if (formData.notes && formData.notes.length > 5000) {
      newErrors.notes = 'Notes must be 5000 characters or less';
    }
    if (!formData.lead_source) newErrors.lead_source = 'Lead source is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (company?.id) payload.company_id = company.id;
      if (!payload.assigned_to_id) delete payload.assigned_to_id;
      if (!payload.estimated_value) delete payload.estimated_value;
      
      await createLead(payload);
      onSuccess?.('Lead created successfully');
      reset();
      onClose?.();
    } catch (err) {
      const msg = err?.detail || err?.message || Object.values(err || {}).flat().join(', ') || 'Failed to create lead';
      onError?.(msg);
      if (typeof err === 'object') {
        setErrors(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Common input style for consistency
  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  };

  const errorInputStyle = {
    ...inputStyle,
    border: '1px solid #ef4444'
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Lead">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 16, maxHeight: '75vh', overflowY: 'auto', padding: '4px 2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>First Name *</div>
              <input
                type="text"
                name="first_name"
                required
                maxLength={120}
                value={formData.first_name}
                onChange={handleChange}
                style={errors.first_name ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.first_name ? '#ef4444' : '#e2e8f0'}
              />
              {errors.first_name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.first_name}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Last Name *</div>
              <input
                type="text"
                name="last_name"
                required
                maxLength={120}
                value={formData.last_name}
                onChange={handleChange}
                style={errors.last_name ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.last_name ? '#ef4444' : '#e2e8f0'}
              />
              {errors.last_name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.last_name}</div>}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Email *</div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                style={errors.email ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0'}
              />
              {errors.email && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.email}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Phone</div>
              <input
                type="tel"
                name="phone"
                maxLength={32}
                value={formData.phone}
                onChange={handleChange}
                style={errors.phone ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.phone ? '#ef4444' : '#e2e8f0'}
              />
              {errors.phone && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.phone}</div>}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Company Name</div>
              <input
                type="text"
                name="company_name"
                maxLength={255}
                value={formData.company_name}
                onChange={handleChange}
                style={errors.company_name ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.company_name ? '#ef4444' : '#e2e8f0'}
              />
              {errors.company_name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.company_name}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Job Title</div>
              <input
                type="text"
                name="job_title"
                maxLength={120}
                value={formData.job_title}
                onChange={handleChange}
                style={errors.job_title ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.job_title ? '#ef4444' : '#e2e8f0'}
              />
              {errors.job_title && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.job_title}</div>}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Lead Source *</div>
              <select
                name="lead_source"
                value={formData.lead_source}
                onChange={handleChange}
                style={errors.lead_source ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.lead_source ? '#ef4444' : '#e2e8f0'}
              >
                {LEAD_SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {errors.lead_source && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.lead_source}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Estimated Value ($)</div>
              <input
                type="number"
                name="estimated_value"
                step="0.01"
                value={formData.estimated_value}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Assign To</div>
            <select
              name="assigned_to_id"
              value={formData.assigned_to_id}
              onChange={handleChange}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.first_name} {m.last_name} ({m.role})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Notes</div>
            <textarea
              name="notes"
              maxLength={5000}
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              style={{
                ...(errors.notes ? errorInputStyle : inputStyle),
                resize: 'vertical',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = errors.notes ? '#ef4444' : '#e2e8f0'}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {formData.notes.length}/5000 characters
            </div>
            {errors.notes && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.notes}</div>}
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => { reset(); onClose?.(); }}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#94a3b8' : '#4c6fff',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 2px 4px rgba(76, 111, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#3b5bdb';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 111, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#4c6fff';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(76, 111, 255, 0.3)';
                }
              }}
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateLeadModal;
