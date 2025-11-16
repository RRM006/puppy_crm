import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { convertLead } from '../../services/leadService';
import { getPipelines } from '../../services/pipelineService';

const ConvertLeadModal = ({ open, onClose, lead, onSuccess, onError }) => {
  const [pipelines, setPipelines] = useState([]);
  const [formData, setFormData] = useState({
    pipeline_id: '',
    stage_id: '',
    title: '',
    value: '',
    currency: 'USD',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    expected_close_date: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  useEffect(() => {
    if (open && lead) {
      loadPipelines();
      setFormData({
        pipeline_id: '',
        stage_id: '',
        title: `${lead.first_name} ${lead.last_name} - ${lead.company_name || 'Deal'}`,
        value: lead.estimated_value || '',
        currency: 'USD',
        contact_name: `${lead.first_name} ${lead.last_name}`,
        contact_email: lead.email,
        contact_phone: lead.phone || '',
        company_name: lead.company_name || '',
        expected_close_date: '',
        priority: 'medium'
      });
    }
  }, [open, lead]);

  const loadPipelines = async () => {
    setLoadingPipelines(true);
    try {
      const data = await getPipelines();
      setPipelines(data);
      if (data.length > 0) {
        const defaultPipeline = data.find(p => p.is_default) || data[0];
        setFormData(prev => ({
          ...prev,
          pipeline_id: defaultPipeline.id,
          stage_id: defaultPipeline.stages?.[0]?.id || ''
        }));
      }
    } catch (err) {
      onError?.('Failed to load pipelines');
    } finally {
      setLoadingPipelines(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // If pipeline changes, reset stage to first stage
      if (name === 'pipeline_id') {
        const pipeline = pipelines.find(p => p.id === parseInt(value));
        updated.stage_id = pipeline?.stages?.[0]?.id || '';
      }
      return updated;
    });
  };

  const selectedPipeline = pipelines.find(p => p.id === parseInt(formData.pipeline_id));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await convertLead(lead.id, formData);
      onSuccess?.('Lead converted to deal successfully');
      onClose?.();
    } catch (err) {
      const msg = err?.detail || err?.message || 'Failed to convert lead';
      onError?.(msg);
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

  return (
    <Modal open={open} onClose={onClose} title="Convert Lead to Deal">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 16, maxHeight: '75vh', overflowY: 'auto', padding: '4px 2px' }}>
          <div style={{ background: '#eff6ff', padding: 14, borderRadius: 8, fontSize: 14, color: '#1e40af', border: '1px solid #bfdbfe' }}>
            Converting lead: <strong style={{ fontWeight: 600 }}>{lead?.first_name} {lead?.last_name}</strong> ({lead?.email})
          </div>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Pipeline *</div>
            <select
              name="pipeline_id"
              value={formData.pipeline_id}
              onChange={handleChange}
              required
              disabled={loadingPipelines}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              {loadingPipelines ? (
                <option>Loading...</option>
              ) : pipelines.length === 0 ? (
                <option>No pipelines available</option>
              ) : (
                pipelines.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_default ? '(Default)' : ''}
                  </option>
                ))
              )}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Initial Stage *</div>
            <select
              name="stage_id"
              value={formData.stage_id}
              onChange={handleChange}
              required
              disabled={!selectedPipeline}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              {selectedPipeline?.stages?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.probability}% probability)
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Deal Title *</div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Deal Value *</div>
              <input
                type="number"
                name="value"
                step="0.01"
                value={formData.value}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
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
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Contact Name *</div>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Contact Email *</div>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Company Name</div>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Contact Phone</div>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#4c6fff'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
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
                background: loading || loadingPipelines ? '#94a3b8' : '#10b981',
                color: '#ffffff',
                cursor: loading || loadingPipelines ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s ease',
                boxShadow: loading || loadingPipelines ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading && !loadingPipelines) {
                  e.currentTarget.style.background = '#059669';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !loadingPipelines) {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {loading ? 'Converting...' : 'Convert to Deal'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ConvertLeadModal;
