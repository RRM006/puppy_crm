import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { createPipeline } from '../../services/pipelineService';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_STAGES = [
  { name: 'Lead', probability: 10 },
  { name: 'Qualified', probability: 25 },
  { name: 'Proposal', probability: 50 },
  { name: 'Negotiation', probability: 75 },
  { name: 'Closed Won', probability: 100 }
];

const CreatePipelineModal = ({ open, onClose, onSuccess, onError }) => {
  const { company } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    use_default_stages: true
  });
  const [customStages, setCustomStages] = useState([{ name: '', probability: 0 }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reset = () => {
    setFormData({
      name: '',
      description: '',
      is_default: false,
      use_default_stages: true
    });
    setCustomStages([{ name: '', probability: 0 }]);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleStageChange = (idx, field, value) => {
    const updated = [...customStages];
    updated[idx][field] = field === 'probability' ? parseInt(value) || 0 : value;
    setCustomStages(updated);
  };

  const addStage = () => {
    setCustomStages([...customStages, { name: '', probability: 0 }]);
  };

  const removeStage = (idx) => {
    if (customStages.length === 1) return;
    setCustomStages(customStages.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Pipeline name is required';
    }
    
    if (!formData.use_default_stages) {
      const validStages = customStages.filter(s => s.name.trim());
      if (validStages.length === 0) {
        newErrors.stages = 'At least one stage is required';
      }
      customStages.forEach((s, idx) => {
        if (s.name.trim() && (s.probability < 0 || s.probability > 100)) {
          newErrors[`stage_${idx}`] = 'Probability must be between 0 and 100';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        is_default: formData.is_default,
        company_id: company?.id
      };

      // Add stages
      if (formData.use_default_stages) {
        // Don't send stages - backend will create defaults
      } else {
        payload.stages = customStages
          .filter(s => s.name.trim())
          .map((s, idx) => ({
            name: s.name.trim(),
            probability: s.probability,
            order: idx + 1
          }));
      }

      await createPipeline(payload);
      onSuccess?.('Pipeline created successfully');
      reset();
      onClose?.();
    } catch (err) {
      const msg = err?.detail || err?.message || 'Failed to create pipeline';
      onError?.(msg);
      if (typeof err === 'object') {
        setErrors(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Pipeline">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 12, maxHeight: '70vh', overflowY: 'auto', padding: 2 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Pipeline Name *</div>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 10,
                border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 8
              }}
            />
            {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
          </label>

          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Description</div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontFamily: 'inherit'
              }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14 }}>Set as default pipeline</span>
          </label>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Stages Setup</div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input
                type="radio"
                name="stage_type"
                checked={formData.use_default_stages}
                onChange={() => setFormData(prev => ({ ...prev, use_default_stages: true }))}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14 }}>Use default stages (Recommended)</span>
            </label>

            {formData.use_default_stages && (
              <div style={{ marginLeft: 24, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 6, color: '#64748b' }}>Default stages:</div>
                {DEFAULT_STAGES.map((s, i) => (
                  <div key={i} style={{ padding: '4px 0', color: '#475569' }}>
                    {i + 1}. {s.name} ({s.probability}%)
                  </div>
                ))}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <input
                type="radio"
                name="stage_type"
                checked={!formData.use_default_stages}
                onChange={() => setFormData(prev => ({ ...prev, use_default_stages: false }))}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14 }}>Create custom stages</span>
            </label>

            {!formData.use_default_stages && (
              <div style={{ marginLeft: 24, marginTop: 12, display: 'grid', gap: 8 }}>
                {customStages.map((stage, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Stage name"
                        value={stage.name}
                        onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: 8,
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          fontSize: 13
                        }}
                      />
                    </div>
                    <div style={{ width: 100 }}>
                      <input
                        type="number"
                        placeholder="0-100"
                        min="0"
                        max="100"
                        value={stage.probability}
                        onChange={(e) => handleStageChange(idx, 'probability', e.target.value)}
                        style={{
                          width: '100%',
                          padding: 8,
                          border: `1px solid ${errors[`stage_${idx}`] ? '#ef4444' : '#e2e8f0'}`,
                          borderRadius: 6,
                          fontSize: 13
                        }}
                      />
                    </div>
                    {customStages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(idx)}
                        style={{
                          padding: 8,
                          border: 'none',
                          background: '#fee2e2',
                          color: '#ef4444',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStage}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px dashed #cbd5e1',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#4c6fff'
                  }}
                >
                  + Add Stage
                </button>
                {errors.stages && <div style={{ fontSize: 11, color: '#ef4444' }}>{errors.stages}</div>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                reset();
                onClose?.();
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#94a3b8' : '#4c6fff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Pipeline'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePipelineModal;
