import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { getLead, updateLead, getLeadActivities } from '../../services/leadService';
import { FiEdit2, FiClock, FiUser } from 'react-icons/fi';

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'converted', label: 'Converted' },
];

const LeadDetailModal = ({ open, onClose, leadId, onSuccess, onError, teamMembers = [] }) => {
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open && leadId) {
      loadLead();
      loadActivities();
    } else {
      setLead(null);
      setActivities([]);
      setActiveTab('overview');
      setEditing(false);
    }
  }, [open, leadId]);

  const loadLead = async () => {
    try {
      const data = await getLead(leadId);
      setLead(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        company_name: data.company_name || '',
        job_title: data.job_title || '',
        lead_source: data.lead_source || 'website',
        status: data.status || 'new',
        estimated_value: data.estimated_value || '',
        notes: data.notes || '',
        assigned_to_id: data.assigned_to?.id || ''
      });
    } catch (err) {
      onError?.('Failed to load lead');
    }
  };

  const loadActivities = async () => {
    try {
      const data = await getLeadActivities(leadId);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
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
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.assigned_to_id) payload.assigned_to_id = null;
      const updated = await updateLead(leadId, payload);
      setLead(updated);
      setEditing(false);
      onSuccess?.('Lead updated successfully');
    } catch (err) {
      onError?.('Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

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
            background: 'white',
            cursor: 'pointer',
            justifySelf: 'flex-start'
          }}
        >
          <FiEdit2 /> Edit Lead
        </button>
      )}

      {editing ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>First Name</div>
              <input type="text" name="first_name" maxLength={120} value={formData.first_name} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Last Name</div>
              <input type="text" name="last_name" maxLength={120} value={formData.last_name} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Email</div>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Phone</div>
              <input type="tel" name="phone" maxLength={32} value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Company</div>
              <input type="text" name="company_name" maxLength={255} value={formData.company_name} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Job Title</div>
              <input type="text" name="job_title" maxLength={120} value={formData.job_title} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Source</div>
              <select name="lead_source" value={formData.lead_source} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Status</div>
              <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Estimated Value</div>
              <input type="number" name="estimated_value" step="0.01" value={formData.estimated_value} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Assign To</div>
              <select name="assigned_to_id" value={formData.assigned_to_id} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Notes</div>
            <textarea name="notes" maxLength={5000} value={formData.notes} onChange={handleChange} rows={3} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', color: '#0f172a' }} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {formData.notes?.length || 0}/5000 characters
            </div>
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4c6fff', color: 'white', cursor: 'pointer' }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Name:</div>
            <div style={{ fontWeight: 500 }}>{lead?.first_name} {lead?.last_name}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Email:</div>
            <div>{lead?.email}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Phone:</div>
            <div>{lead?.phone || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Company:</div>
            <div>{lead?.company_name || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Job Title:</div>
            <div>{lead?.job_title || '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Source:</div>
            <div>{LEAD_SOURCES.find(s => s.value === lead?.lead_source)?.label || lead?.lead_source}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Status:</div>
            <div><span style={{ padding: '4px 8px', borderRadius: 999, fontSize: 12, background: '#dbeafe', color: '#1e40af' }}>{lead?.status}</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Estimated Value:</div>
            <div>{lead?.estimated_value ? `$${parseFloat(lead.estimated_value).toLocaleString()}` : '-'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Assigned To:</div>
            <div>{lead?.assigned_to ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name}` : 'Unassigned'}</div>
          </div>
          {lead?.notes && (
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
              <div style={{ color: '#64748b' }}>Notes:</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderActivities = () => (
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
              <div style={{ fontSize: 13, fontWeight: 500 }}>{activity.subject}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{activity.description}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {new Date(activity.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (!lead) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Lead: ${lead.first_name} ${lead.last_name}`}>
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
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'activities' && renderActivities()}
      </div>
    </Modal>
  );
};

export default LeadDetailModal;
