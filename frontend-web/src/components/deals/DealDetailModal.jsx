import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { getDeal, updateDeal, getDealActivities, moveDealStage, closeDeal, assignDeal } from '../../services/dealService';
import { getPipelines } from '../../services/pipelineService';
import { createActivity } from '../../services/activityService';
import { FiEdit2, FiClock, FiUser, FiDollarSign, FiCalendar, FiCheck, FiX } from 'react-icons/fi';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' }
];

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'task', label: 'Task' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' }
];

const DealDetailModal = ({ open, onClose, dealId, onSuccess, onError, teamMembers = [], pipelines = [] }) => {
  const [deal, setDeal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [activityForm, setActivityForm] = useState({
    activity_type: 'note',
    subject: '',
    description: '',
    scheduled_at: ''
  });
  const [closingDeal, setClosingDeal] = useState(false);
  const [closeForm, setCloseForm] = useState({ status: 'won', lost_reason: '' });

  useEffect(() => {
    if (open && dealId) {
      loadDeal();
      loadActivities();
    } else {
      setDeal(null);
      setActivities([]);
      setActiveTab('overview');
      setEditing(false);
    }
  }, [open, dealId]);

  const loadDeal = async () => {
    try {
      const data = await getDeal(dealId);
      setDeal(data);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        company_name: data.company_name || '',
        contact_name: data.contact_name || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        value: data.value || '',
        currency: data.currency || 'USD',
        expected_close_date: data.expected_close_date || '',
        priority: data.priority || 'medium',
        assigned_to_id: data.assigned_to?.id || ''
      });
    } catch (err) {
      onError?.('Failed to load deal');
    }
  };

  const loadActivities = async () => {
    try {
      const data = await getDealActivities(dealId);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
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
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivityForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.assigned_to_id) payload.assigned_to_id = null;
      const updated = await updateDeal(dealId, payload);
      setDeal(updated);
      setEditing(false);
      onSuccess?.('Deal updated successfully');
      loadDeal();
    } catch (err) {
      onError?.('Failed to update deal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityForm.subject.trim()) {
      onError?.('Activity subject is required');
      return;
    }
    setLoading(true);
    try {
      await createActivity({
        deal_id: dealId,
        ...activityForm
      });
      setActivityForm({ activity_type: 'note', subject: '', description: '', scheduled_at: '' });
      onSuccess?.('Activity added successfully');
      loadActivities();
    } catch (err) {
      onError?.('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (stageId) => {
    setLoading(true);
    try {
      await moveDealStage(dealId, stageId);
      onSuccess?.('Deal moved to new stage');
      loadDeal();
    } catch (err) {
      onError?.('Failed to move deal');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDeal = async () => {
    setClosingDeal(true);
    try {
      await closeDeal(dealId, closeForm.status, closeForm.lost_reason || null);
      onSuccess?.(`Deal marked as ${closeForm.status}`);
      loadDeal();
      setCloseForm({ status: 'won', lost_reason: '' });
    } catch (err) {
      onError?.('Failed to close deal');
    } finally {
      setClosingDeal(false);
    }
  };

  const handleAssign = async (userId) => {
    setLoading(true);
    try {
      await assignDeal(dealId, userId);
      onSuccess?.('Deal assigned successfully');
      loadDeal();
    } catch (err) {
      onError?.('Failed to assign deal');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const selectedPipeline = pipelines.find(p => p.id === deal?.pipeline?.id);
  const currentStage = selectedPipeline?.stages?.find(s => s.id === deal?.stage?.id);

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#475569',
            cursor: 'pointer',
            justifySelf: 'flex-start',
            fontWeight: 500,
            fontSize: 14
          }}
        >
          <FiEdit2 /> Edit Deal
        </button>
      )}

      {editing ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Title</div>
            <input type="text" name="title" maxLength={255} value={formData.title} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Company</div>
              <input type="text" name="company_name" maxLength={255} value={formData.company_name} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Contact</div>
              <input type="text" name="contact_name" maxLength={255} value={formData.contact_name} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Email</div>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Phone</div>
              <input type="tel" name="contact_phone" maxLength={32} value={formData.contact_phone} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Value</div>
              <input type="number" name="value" step="0.01" value={formData.value} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Currency</div>
              <select name="currency" value={formData.currency} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}>
                {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Expected Close Date</div>
              <input type="date" name="expected_close_date" value={formData.expected_close_date} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Priority</div>
              <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}>
                {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Description</div>
            <textarea name="description" maxLength={5000} value={formData.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', color: '#0f172a' }} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {formData.description?.length || 0}/5000 characters
            </div>
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569' }}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4c6fff', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Title:</div>
            <div style={{ fontWeight: 500 }}>{deal?.title}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Company:</div>
            <div>{deal?.company_name || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Contact:</div>
            <div>{deal?.contact_name || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Email:</div>
            <div>{deal?.contact_email || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Phone:</div>
            <div>{deal?.contact_phone || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Value:</div>
            <div style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(deal?.value, deal?.currency)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Stage:</div>
            <div>{deal?.stage?.name || '-'} ({deal?.probability || 0}%)</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Status:</div>
            <div>
              <span style={{
                padding: '4px 8px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: deal?.status === 'won' ? '#d1fae5' : deal?.status === 'lost' ? '#fee2e2' : '#dbeafe',
                color: deal?.status === 'won' ? '#065f46' : deal?.status === 'lost' ? '#991b1b' : '#1e40af'
              }}>
                {deal?.status?.toUpperCase() || 'OPEN'}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Priority:</div>
            <div>
              <span style={{
                padding: '4px 8px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: `${PRIORITY_OPTIONS.find(p => p.value === deal?.priority)?.color || '#64748b'}20`,
                color: PRIORITY_OPTIONS.find(p => p.value === deal?.priority)?.color || '#64748b'
              }}>
                {PRIORITY_OPTIONS.find(p => p.value === deal?.priority)?.label || deal?.priority}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Expected Close:</div>
            <div>{formatDate(deal?.expected_close_date) || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Assigned To:</div>
            <div>{deal?.assigned_to ? `${deal.assigned_to.first_name} ${deal.assigned_to.last_name}` : 'Unassigned'}</div>
          </div>
          {deal?.description && (
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
              <div style={{ color: '#64748b' }}>Description:</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{deal.description}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderActivities = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Add Activity</div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Type</div>
              <select name="activity_type" value={activityForm.activity_type} onChange={handleActivityChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}>
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Scheduled At</div>
              <input type="datetime-local" name="scheduled_at" value={activityForm.scheduled_at} onChange={handleActivityChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Subject *</div>
            <input type="text" name="subject" value={activityForm.subject} onChange={handleActivityChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Description</div>
            <textarea name="description" value={activityForm.description} onChange={handleActivityChange} rows={3} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', color: '#0f172a' }} />
          </label>
          <button
            onClick={handleAddActivity}
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#94a3b8' : '#4c6fff',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              justifySelf: 'flex-end'
            }}
          >
            {loading ? 'Adding...' : 'Add Activity'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <FiClock size={32} style={{ margin: '0 auto 8px' }} />
            <div>No activities yet</div>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} style={{ display: 'flex', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4c6fff', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <FiUser size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{activity.subject}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>{activity.activity_type}</div>
                {activity.description && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{activity.description}</div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMoveStage = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
        Current Stage: <strong>{currentStage?.name || '-'}</strong>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {selectedPipeline?.stages?.filter(s => s.id !== deal?.stage?.id).map(stage => (
          <button
            key={stage.id}
            onClick={() => handleMoveStage(stage.id)}
            disabled={loading}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#4c6fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }
            }}
          >
            <span style={{ fontWeight: 500 }}>{stage.name}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{stage.probability}% probability</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCloseDeal = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 14, color: '#64748b' }}>
        Close this deal as won or lost. This action cannot be undone.
      </div>
      <label>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Status *</div>
        <select
          value={closeForm.status}
          onChange={(e) => setCloseForm(prev => ({ ...prev, status: e.target.value }))}
          style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a' }}
        >
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </label>
      {closeForm.status === 'lost' && (
        <label>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Lost Reason</div>
          <textarea
            value={closeForm.lost_reason}
            onChange={(e) => setCloseForm(prev => ({ ...prev, lost_reason: e.target.value }))}
            rows={3}
            style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', color: '#0f172a' }}
            placeholder="Why was this deal lost?"
          />
        </label>
      )}
      <button
        onClick={handleCloseDeal}
        disabled={closingDeal}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: closingDeal ? '#94a3b8' : (closeForm.status === 'won' ? '#10b981' : '#ef4444'),
          color: 'white',
          cursor: closingDeal ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        {closingDeal ? 'Closing...' : `Mark as ${closeForm.status === 'won' ? 'Won' : 'Lost'}`}
      </button>
    </div>
  );

  if (!deal) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Deal: ${deal.title}`}>
      <div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid #4c6fff' : '2px solid transparent',
              color: activeTab === 'overview' ? '#4c6fff' : '#64748b',
              fontWeight: 500
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'activities' ? '2px solid #4c6fff' : '2px solid transparent',
              color: activeTab === 'activities' ? '#4c6fff' : '#64748b',
              fontWeight: 500
            }}
          >
            Activities ({activities.length})
          </button>
          {deal.status === 'open' && (
            <>
              <button
                onClick={() => setActiveTab('move')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'move' ? '2px solid #4c6fff' : '2px solid transparent',
                  color: activeTab === 'move' ? '#4c6fff' : '#64748b',
                  fontWeight: 500
                }}
              >
                Move Stage
              </button>
              <button
                onClick={() => setActiveTab('close')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'close' ? '2px solid #4c6fff' : '2px solid transparent',
                  color: activeTab === 'close' ? '#4c6fff' : '#64748b',
                  fontWeight: 500
                }}
              >
                Close Deal
              </button>
            </>
          )}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'activities' && renderActivities()}
        {activeTab === 'move' && renderMoveStage()}
        {activeTab === 'close' && renderCloseDeal()}
      </div>
    </Modal>
  );
};

export default DealDetailModal;

