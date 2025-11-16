import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import PermissionGate from '../components/common/PermissionGate.jsx';
import { getCompanyProfile, updateCompanyProfile, getCompanyTeam } from '../services/companyService.js';
import InviteTeamModal from '../components/company/InviteTeamModal.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import Toast from '../components/common/Toast.jsx';
import { useDropzone } from 'react-dropzone';

const industries = ['technology','healthcare','finance','retail','manufacturing','other'];

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
    <div style={{ color: '#64748b' }}>{label}</div>
    <div>{value || '-'}</div>
  </div>
);

const TeamTable = ({ canManage, onInvite }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getCompanyTeam({ role: role || undefined, is_active: status || undefined });
        let rows = res.team_members || [];
        if (q) {
          rows = rows.filter(r => `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(q.toLowerCase()));
        }
        setData(rows);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role, status, q]);

  const ActionButtons = ({ m }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn-outline" onClick={() => alert('View coming soon')}>View</button>
      <button className="btn-outline" disabled={!canManage} onClick={() => alert('Edit role coming soon')}>Edit Role</button>
      <button className="btn-outline" disabled={!canManage} onClick={() => alert('Deactivate coming soon')}>{m.is_active ? 'Deactivate' : 'Activate'}</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="ceo">CEO</option>
            <option value="manager">Manager</option>
            <option value="sales_manager">Sales Manager</option>
            <option value="support_staff">Support Staff</option>
          </select>
          <select value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <input placeholder="Search name/email" value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={onInvite}>Invite Team Member</button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Name</th>
                <th style={{ padding: 12 }}>Email</th>
                <th style={{ padding: 12 }}>Role</th>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Joined</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(m => (
                <tr key={m.id}>
                  <td>{m.full_name || `${m.first_name||''} ${m.last_name||''}`}</td>
                  <td>{m.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.role?.replace('_',' ')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.department || '-'}</td>
                  <td>{new Date(m.joined_at).toLocaleDateString()}</td>
                  <td>{m.is_active ? 'Active' : 'Inactive'}</td>
                  <td><ActionButtons m={m} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CompanyInformation = ({ profile, canEdit, onSaved, onError }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => { setForm(profile); }, [profile]);

  const onDrop = (accepted, rejected) => {
    if (rejected?.length) {
      onError?.('Invalid file. Please upload an image up to 2MB.');
      return;
    }
    if (accepted?.[0]) {
      setLogoFile(accepted[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 2 * 1024 * 1024,
    multiple: false,
  });

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f)=>({ ...f, [name]: value }));
  };

  const save = async () => {
    try {
      let payload;
      if (logoFile) {
        payload = new FormData();
        Object.entries(form).forEach(([k,v]) => {
          if (v !== undefined && v !== null) payload.append(k, v);
        });
        payload.append('logo', logoFile);
      } else {
        payload = {
          company_name: form.company_name,
          website: form.website,
          industry: form.industry,
          description: form.description,
          address: form.address,
          city: form.city,
          country: form.country,
          timezone: form.timezone,
          phone: form.phone,
          employee_count: form.employee_count,
        };
      }
      const updated = await updateCompanyProfile(payload);
      onSaved?.('Company profile saved');
      setEditing(false);
      setLogoFile(null);
      setForm(updated);
    } catch (e) {
      const msg = e?.detail || Object.values(e || {}).flat().join(', ') || 'Failed to save profile';
      onError?.(msg);
    }
  };

  if (!form) return <Skeleton height={48} />;

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Company Information</h2>
          {canEdit && <button className="btn-primary" onClick={() => setEditing(true)}>Edit</button>}
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <InfoRow label="Company Name" value={form.company_name} />
          <InfoRow label="Website" value={form.website} />
          <InfoRow label="Industry" value={form.industry} />
          <InfoRow label="Description" value={form.description} />
          <InfoRow label="Address" value={form.address} />
          <InfoRow label="City" value={form.city} />
          <InfoRow label="Country" value={form.country} />
          <InfoRow label="Timezone" value={form.timezone} />
          <InfoRow label="Phone" value={form.phone} />
          <InfoRow label="Employee Count" value={form.employee_count} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Edit Company</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Company Name</div>
          <input name="company_name" value={form.company_name||''} onChange={change} />
        </label>
        <div {...getRootProps()} style={{ border: '1px dashed #cbd5e1', borderRadius: 8, padding: 12, background: isDragActive ? '#eef2ff' : 'transparent' }}>
          <input {...getInputProps()} />
          <div>Drop or click to upload logo (max 2MB)</div>
          {logoFile && (
            <div style={{ marginTop: 8, fontSize: 12 }}>Selected: {logoFile.name}</div>
          )}
        </div>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Website</div>
          <input name="website" value={form.website||''} onChange={change} />
        </label>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Industry</div>
          <select name="industry" value={form.industry||''} onChange={change}>
            <option value="">Select industry</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Description</div>
          <textarea name="description" value={form.description||''} onChange={change} rows={3} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Address</div>
            <input name="address" value={form.address||''} onChange={change} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>City</div>
            <input name="city" value={form.city||''} onChange={change} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Country</div>
            <input name="country" value={form.country||''} onChange={change} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Timezone</div>
            <input name="timezone" value={form.timezone||''} onChange={change} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Phone</div>
            <input name="phone" value={form.phone||''} onChange={change} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: '#64748b' }}>Employee Count</div>
            <input type="number" name="employee_count" value={form.employee_count||''} onChange={change} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={()=>{ setEditing(false); setLogoFile(null); }}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
};

const CompanyProfile = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('info');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'info', timeout = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((t) => [...t, { id, message, type, timeout }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter(x => x.id !== id));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCompanyProfile();
        setProfile(data);
      } catch (e) {
        pushToast('Failed to load company profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 24 }}><Skeleton height={48} /><Skeleton height={48} /><Skeleton height={48} /></div>;

  const canEditInfo = ['ceo','manager'].includes(userRole);
  const isCEO = userRole === 'ceo';

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Company Profile</h1>

      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
        <button className={tab==='info'?'btn-primary':'btn-outline'} onClick={()=>setTab('info')}>Company Information</button>
        <button className={tab==='team'?'btn-primary':'btn-outline'} onClick={()=>setTab('team')}>Team Management</button>
        <PermissionGate roles={['ceo']}>
          <button className={tab==='settings'?'btn-primary':'btn-outline'} onClick={()=>setTab('settings')}>Settings</button>
        </PermissionGate>
      </div>

      {tab === 'info' && (
        <CompanyInformation profile={profile} canEdit={canEditInfo} onSaved={(m)=>pushToast(m,'success')} onError={(m)=>pushToast(m,'error')} />
      )}

      {tab === 'team' && (
        <TeamTable canManage={isCEO} onInvite={()=>setInviteOpen(true)} />
      )}

      {tab === 'settings' && (
        <PermissionGate roles={['ceo']}>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 12, borderRadius: 8 }}>Settings content is managed in the dashboard Settings page.</div>
        </PermissionGate>
      )}

      <InviteTeamModal open={inviteOpen} onClose={()=>setInviteOpen(false)} onSuccess={(m)=>{ pushToast(m,'success'); setInviteOpen(false); }} onError={(m)=>pushToast(m,'error')} />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default CompanyProfile;
