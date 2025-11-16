import React, { useState } from 'react';
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

const InviteModal = ({ open, onClose, onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const [department, setDepartment] = useState('sales');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail('');
    setRole('manager');
    setDepartment('sales');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inviteUser({ email, role, department });
      onSuccess?.(`Invitation sent to ${email}`);
      reset();
      onClose?.();
    } catch (err) {
      const msg = err?.detail || Object.values(err || {}).flat().join(', ') || 'Failed to send invitation';
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
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Role</div>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              {ROLES.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Department</div>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              {DEPARTMENTS.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}
            </select>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4c6fff', color: 'white', cursor: 'pointer' }}>{loading ? 'Sending...' : 'Send Invite'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default InviteModal;
