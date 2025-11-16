import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { createStage } from '../../services/pipelineService';

const CreateStageModal = ({ open, onClose, pipelineId, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    probability: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reset = () => {
    setFormData({ name: '', probability: 0 });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'probability' ? parseInt(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Stage name is required';
    }
    if (formData.probability < 0 || formData.probability > 100) {
      newErrors.probability = 'Probability must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate() || !pipelineId) return;

    setLoading(true);
    try {
      await createStage(pipelineId, formData);
      onSuccess?.('Stage created successfully');
      reset();
      onClose?.();
    } catch (err) {
      const msg = err?.detail || err?.message || 'Failed to create stage';
      onError?.(msg);
      if (typeof err === 'object') {
        setErrors(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Stage">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Stage Name *</div>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Proposal, Negotiation"
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
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Probability % *</div>
            <input
              type="number"
              name="probability"
              required
              min="0"
              max="100"
              value={formData.probability}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 10,
                border: `1px solid ${errors.probability ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 8
              }}
            />
            {errors.probability && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.probability}</div>}
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Set the probability (0-100) that deals in this stage will close
            </div>
          </label>

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
              {loading ? 'Creating...' : 'Create Stage'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateStageModal;
