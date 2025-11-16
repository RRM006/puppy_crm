import React, { useState } from 'react';
import { X, Grid3x3, Plus, Edit2, Trash2, Users } from 'lucide-react';
import companyCustomerService from '../../services/companyCustomerService';
import './SegmentManagementModal.css';

const SegmentManagementModal = ({ segments, onClose, onUpdate }) => {
  const [localSegments, setLocalSegments] = useState(segments);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {}
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSegment) {
        await companyCustomerService.updateSegment(editingSegment.id, formData);
      } else {
        await companyCustomerService.createSegment(formData);
      }
      
      const updatedSegments = await companyCustomerService.getSegments();
      setLocalSegments(updatedSegments);
      
      setFormData({ name: '', description: '', criteria: {} });
      setShowAddForm(false);
      setEditingSegment(null);
      
      onUpdate();
    } catch (err) {
      alert('Failed to save segment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      criteria: segment.criteria || {}
    });
    setShowAddForm(true);
  };

  const handleDelete = async (segmentId) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;

    setLoading(true);
    try {
      await companyCustomerService.deleteSegment(segmentId);
      const updatedSegments = await companyCustomerService.getSegments();
      setLocalSegments(updatedSegments);
      onUpdate();
    } catch (err) {
      alert('Failed to delete segment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSegment(null);
    setFormData({ name: '', description: '', criteria: {} });
  };

  const viewSegmentCustomers = async (segmentId) => {
    try {
      const customers = await companyCustomerService.getSegmentCustomers(segmentId);
      // TODO: Show customers in a list or navigate to filtered view
      console.log('Segment customers:', customers);
    } catch (err) {
      alert('Failed to load segment customers');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content segment-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Grid3x3 size={24} />
            Manage Segments
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {!showAddForm && (
            <div className="segments-header">
              <p className="segments-description">
                Segments allow you to group customers based on specific criteria
              </p>
              <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Segment
              </button>
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleSubmit} className="segment-form">
              <div className="form-group">
                <label htmlFor="name">Segment Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Value Customers, Inactive 90 Days"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this segment..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Criteria (JSON)</label>
                <p className="field-hint">
                  Define filter criteria for this segment (e.g., minimum lifetime value, tags, status)
                </p>
                <textarea
                  value={JSON.stringify(formData.criteria, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, criteria: parsed }));
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{\n  "min_lifetime_value": 1000,\n  "status": "active"\n}'
                  rows={6}
                  className="code-input"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingSegment ? 'Update Segment' : 'Create Segment'}
                </button>
              </div>
            </form>
          )}

          {!showAddForm && (
            <div className="segments-list">
              {localSegments.length === 0 ? (
                <div className="empty-state">
                  <Grid3x3 size={48} />
                  <p>No segments yet</p>
                  <button className="btn-link" onClick={() => setShowAddForm(true)}>
                    Create your first segment
                  </button>
                </div>
              ) : (
                localSegments.map(segment => (
                  <div key={segment.id} className="segment-item">
                    <div className="segment-info">
                      <h4>{segment.name}</h4>
                      {segment.description && (
                        <p className="segment-description">{segment.description}</p>
                      )}
                      <div className="segment-meta">
                        <span className="segment-count">
                          <Users size={14} />
                          {segment.customer_count || 0} customers
                        </span>
                      </div>
                    </div>
                    <div className="segment-actions">
                      <button
                        className="btn-link"
                        onClick={() => viewSegmentCustomers(segment.id)}
                      >
                        View Customers
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(segment)}
                        title="Edit segment"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(segment.id)}
                        title="Delete segment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {!showAddForm && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentManagementModal;
