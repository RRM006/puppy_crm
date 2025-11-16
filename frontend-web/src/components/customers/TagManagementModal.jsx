import React, { useState } from 'react';
import { X, Tag, Plus, Edit2, Trash2, Check } from 'lucide-react';
import companyCustomerService from '../../services/companyCustomerService';
import './TagManagementModal.css';

const TagManagementModal = ({ tags, onClose, onUpdate }) => {
  const [localTags, setLocalTags] = useState(tags);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#4c6fff'
  });

  const colorPresets = [
    '#4c6fff', '#ff6b6b', '#51cf66', '#ffd43b', '#ff8c42',
    '#a855f7', '#06b6d4', '#f97316', '#ec4899', '#84cc16'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTag) {
        await companyCustomerService.updateTag(editingTag.id, formData);
      } else {
        await companyCustomerService.createTag(formData);
      }
      
      // Refresh tags
      const updatedTags = await companyCustomerService.getTags();
      setLocalTags(updatedTags);
      
      // Reset form
      setFormData({ name: '', color: '#4c6fff' });
      setShowAddForm(false);
      setEditingTag(null);
      
      onUpdate();
    } catch (err) {
      alert('Failed to save tag');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setShowAddForm(true);
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    setLoading(true);
    try {
      await companyCustomerService.deleteTag(tagId);
      const updatedTags = await companyCustomerService.getTags();
      setLocalTags(updatedTags);
      onUpdate();
    } catch (err) {
      alert('Failed to delete tag');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#4c6fff' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tag-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Tag size={24} />
            Manage Tags
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {!showAddForm && (
            <div className="tags-header">
              <p className="tags-description">
                Tags help you categorize and organize your customers
              </p>
              <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Tag
              </button>
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleSubmit} className="tag-form">
              <div className="form-group">
                <label htmlFor="name">Tag Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VIP, High Value, At Risk"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Tag Color</label>
                <div className="color-picker">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    >
                      {formData.color === color && <Check size={16} color="white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="color-input"
                  />
                </div>
              </div>

              <div className="tag-preview">
                <span>Preview:</span>
                <span
                  className="tag-badge-preview"
                  style={{ backgroundColor: formData.color + '20', color: formData.color }}
                >
                  {formData.name || 'Tag Name'}
                </span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
                </button>
              </div>
            </form>
          )}

          {!showAddForm && (
            <div className="tags-list">
              {localTags.length === 0 ? (
                <div className="empty-state">
                  <Tag size={48} />
                  <p>No tags yet</p>
                  <button className="btn-link" onClick={() => setShowAddForm(true)}>
                    Create your first tag
                  </button>
                </div>
              ) : (
                localTags.map(tag => (
                  <div key={tag.id} className="tag-item">
                    <span
                      className="tag-badge-large"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                    <div className="tag-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(tag)}
                        title="Edit tag"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(tag.id)}
                        title="Delete tag"
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

export default TagManagementModal;
