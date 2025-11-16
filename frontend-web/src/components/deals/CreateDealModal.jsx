import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { createDeal } from '../../services/dealService';
import { getPipelines } from '../../services/pipelineService';
import { useAuth } from '../../contexts/AuthContext';
import { getCompanyTeam } from '../../services/companyService';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' }
];

const CreateDealModal = ({ open, onClose, onSuccess, onError, teamMembers: propTeamMembers = [] }) => {
  const { company } = useAuth();
  const [teamMembers, setTeamMembers] = useState(propTeamMembers);
  const [pipelines, setPipelines] = useState([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [formData, setFormData] = useState({
    pipeline_id: '',
    stage_id: '',
    title: '',
    description: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    value: '',
    currency: 'USD',
    expected_close_date: '',
    priority: 'medium',
    assigned_to_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      loadPipelines();
      if (propTeamMembers.length === 0) {
        loadTeam();
      }
      reset();
    }
  }, [open]);

  const loadTeam = async () => {
    try {
      const data = await getCompanyTeam();
      const list = Array.isArray(data?.team_members)
        ? data.team_members
        : Array.isArray(data)
        ? data
        : [];
      setTeamMembers(list);
    } catch (err) {
      console.error('Failed to load team:', err);
    }
  };

  const loadPipelines = async () => {
    setLoadingPipelines(true);
    try {
      const data = await getPipelines(company?.id);
      setPipelines(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        const defaultPipeline = data.find(p => p.is_default) || data[0];
        setFormData(prev => ({
          ...prev,
          pipeline_id: defaultPipeline.id,
          stage_id: defaultPipeline.stages?.[0]?.id || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load pipelines:', err);
    } finally {
      setLoadingPipelines(false);
    }
  };

  const reset = () => {
    setFormData({
      pipeline_id: '',
      stage_id: '',
      title: '',
      description: '',
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      value: '',
      currency: 'USD',
      expected_close_date: '',
      priority: 'medium',
      assigned_to_id: ''
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Apply max length limits
    const maxLengths = {
      title: 255,
      company_name: 255,
      contact_name: 255,
      contact_phone: 32,
      description: 5000
    };
    if (maxLengths[name] && value.length > maxLengths[name]) {
      processedValue = value.slice(0, maxLengths[name]);
    }

    setFormData(prev => {
      const updated = { ...prev, [name]: processedValue };
      // If pipeline changes, reset stage to first stage
      if (name === 'pipeline_id') {
        const pipeline = pipelines.find(p => p.id === parseInt(processedValue));
        updated.stage_id = pipeline?.stages?.[0]?.id || '';
      }
      return updated;
    });
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }
    if (!formData.pipeline_id) {
      newErrors.pipeline_id = 'Pipeline is required';
    }
    if (!formData.stage_id) {
      newErrors.stage_id = 'Stage is required';
    }
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Contact name is required';
    }
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Deal value is required and must be greater than 0';
    }
    if (formData.contact_phone && formData.contact_phone.length > 32) {
      newErrors.contact_phone = 'Phone must be 32 characters or less';
    }
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }
    
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
      if (!payload.description) delete payload.description;
      if (!payload.contact_phone) delete payload.contact_phone;
      if (!payload.expected_close_date) delete payload.expected_close_date;
      
      await createDeal(payload);
      onSuccess?.('Deal created successfully');
      reset();
      onClose?.();
    } catch (err) {
      const msg = err?.detail || err?.message || Object.values(err || {}).flat().join(', ') || 'Failed to create deal';
      onError?.(msg);
      if (typeof err === 'object') {
        setErrors(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPipeline = pipelines.find(p => p.id === parseInt(formData.pipeline_id));

  // Common input style
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
    <Modal open={open} onClose={onClose} title="Create New Deal">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 16, maxHeight: '75vh', overflowY: 'auto', padding: '4px 2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Pipeline *</div>
              <select
                name="pipeline_id"
                value={formData.pipeline_id}
                onChange={handleChange}
                required
                disabled={loadingPipelines}
                style={errors.pipeline_id ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.pipeline_id ? '#ef4444' : '#e2e8f0'}
              >
                <option value="">Select Pipeline</option>
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              {errors.pipeline_id && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.pipeline_id}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Initial Stage *</div>
              <select
                name="stage_id"
                value={formData.stage_id}
                onChange={handleChange}
                required
                disabled={!selectedPipeline || loadingPipelines}
                style={errors.stage_id ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.stage_id ? '#ef4444' : '#e2e8f0'}
              >
                <option value="">Select Stage</option>
                {selectedPipeline?.stages?.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.probability}% probability)
                  </option>
                ))}
              </select>
              {errors.stage_id && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.stage_id}</div>}
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Deal Title *</div>
            <input
              type="text"
              name="title"
              maxLength={255}
              value={formData.title}
              onChange={handleChange}
              required
              style={errors.title ? errorInputStyle : inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = errors.title ? '#ef4444' : '#e2e8f0'}
            />
            {errors.title && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.title}</div>}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Deal Value *</div>
              <input
                type="number"
                name="value"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={handleChange}
                required
                style={errors.value ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.value ? '#ef4444' : '#e2e8f0'}
              />
              {errors.value && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.value}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Currency</div>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                {CURRENCY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Company Name *</div>
              <input
                type="text"
                name="company_name"
                maxLength={255}
                value={formData.company_name}
                onChange={handleChange}
                required
                style={errors.company_name ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.company_name ? '#ef4444' : '#e2e8f0'}
              />
              {errors.company_name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.company_name}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Contact Name *</div>
              <input
                type="text"
                name="contact_name"
                maxLength={255}
                value={formData.contact_name}
                onChange={handleChange}
                required
                style={errors.contact_name ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.contact_name ? '#ef4444' : '#e2e8f0'}
              />
              {errors.contact_name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.contact_name}</div>}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Contact Email *</div>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                required
                style={errors.contact_email ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.contact_email ? '#ef4444' : '#e2e8f0'}
              />
              {errors.contact_email && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.contact_email}</div>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Contact Phone</div>
              <input
                type="tel"
                name="contact_phone"
                maxLength={32}
                value={formData.contact_phone}
                onChange={handleChange}
                style={errors.contact_phone ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = errors.contact_phone ? '#ef4444' : '#e2e8f0'}
              />
              {errors.contact_phone && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.contact_phone}</div>}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Expected Close Date</div>
              <input
                type="date"
                name="expected_close_date"
                value={formData.expected_close_date}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Priority</div>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
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
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Description</div>
            <textarea
              name="description"
              maxLength={5000}
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={{
                ...(errors.description ? errorInputStyle : inputStyle),
                resize: 'vertical',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = errors.description ? '#ef4444' : '#e2e8f0'}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {formData.description.length}/5000 characters
            </div>
            {errors.description && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.description}</div>}
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
              disabled={loading || loadingPipelines}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: loading || loadingPipelines ? '#94a3b8' : '#4c6fff',
                color: '#ffffff',
                cursor: loading || loadingPipelines ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s ease',
                boxShadow: loading || loadingPipelines ? 'none' : '0 2px 4px rgba(76, 111, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading && !loadingPipelines) {
                  e.currentTarget.style.background = '#3b5bdb';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 111, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !loadingPipelines) {
                  e.currentTarget.style.background = '#4c6fff';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(76, 111, 255, 0.3)';
                }
              }}
            >
              {loading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDealModal;

