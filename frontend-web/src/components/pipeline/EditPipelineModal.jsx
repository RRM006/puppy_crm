import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { updatePipeline } from '../../services/pipelineService';

const EditPipelineModal = ({ open, onClose, pipeline, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && pipeline) {
      setFormData({
        name: pipeline.name || '',
        description: pipeline.description || '',
        is_default: pipeline.is_default || false
      });
      setErrors({});
    }
  }, [open, pipeline]);

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

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Pipeline name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate() || !pipeline) return;

    setLoading(true);
    try {
      await updatePipeline(pipeline.id, formData);
      onSuccess?.('Pipeline updated successfully');
      onClose?.();
    } catch (err) {
      const msg = err?.detail || err?.message || 'Failed to update pipeline';
      onError?.(msg);
      if (typeof err === 'object') {
        setErrors(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!pipeline) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Pipeline">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 12 }}>
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
              rows={3}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditPipelineModal;
