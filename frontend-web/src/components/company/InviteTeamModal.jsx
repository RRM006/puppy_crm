import React, { useMemo, useState } from 'react';
import Modal from '../common/Modal.jsx';
import { inviteUser } from '../../services/invitationService.js';

const ROLES = [
  { value: 'ceo', label: 'CEO' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'support_staff', label: 'Support Staff' },
];

const DEPARTMENTS = [
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'management', label: 'Management' },
];

const rolePermissions = {
  ceo: ['Invite Users', 'Manage Deals', 'View Reports', 'Manage Customers'],
  manager: ['Invite Users', 'Manage Deals', 'View Reports', 'Manage Customers'],
  sales_manager: ['Manage Deals', 'View Reports', 'Manage Customers'],
  support_staff: ['Manage Customers'],
};

const InviteTeamModal = ({ open, onClose, onSuccess, onError }) => {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', role: 'manager', department: 'sales' });
  const [loading, setLoading] = useState(false);
  const perms = useMemo(() => rolePermissions[form.role] || [], [form.role]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return onError?.(err);
    setLoading(true);
    try {
      await inviteUser(form);
      onSuccess?.(`Invitation sent to ${form.email}`);
      onClose?.();
    } catch (ex) {
      const msg = ex?.detail || Object.values(ex || {}).flat().join(', ') || 'Failed to send invitation';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Member">
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Email</div>
            <input name="email" type="email" required value={form.email} onChange={change} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>First Name</div>
              <input name="first_name" value={form.first_name} onChange={change} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Last Name</div>
              <input name="last_name" value={form.last_name} onChange={change} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Role</div>
              <select name="role" value={form.role} onChange={change} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {ROLES.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Department</div>
              <select name="department" value={form.department} onChange={change} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {DEPARTMENTS.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}
              </select>
            </label>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Permissions (by role)</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {perms.map(p => (<li key={p}>{p}</li>))}
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4c6fff', color: 'white', cursor: 'pointer' }}>{loading ? 'Sending...' : 'Send Invitation'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default InviteTeamModal;
