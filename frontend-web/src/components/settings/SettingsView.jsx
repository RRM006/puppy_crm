import React, { useEffect, useState } from 'react';
import { getCompanyProfile, updateCompanyProfile } from '../../services/companyService.js';
import Skeleton from '../common/Skeleton.jsx';

const SettingsView = ({ onSaved, onError }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company_name: '', phone: '', employee_count: '', website: '', industry: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCompanyProfile();
        setForm({
          company_name: data.company_name || '',
          phone: data.phone || '',
          employee_count: data.employee_count || '',
          website: data.website || '',
          industry: data.industry || '',
        });
      } catch (e) {
        onError?.('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanyProfile({
        company_name: form.company_name,
        phone: form.phone,
        employee_count: form.employee_count ? Number(form.employee_count) : null,
        website: form.website,
        industry: form.industry,
      });
      onSaved?.('Company profile updated');
    } catch (e) {
      const msg = e?.detail || Object.values(e || {}).flat().join(', ') || 'Failed to save';
      onError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <Skeleton height={28} />
        <Skeleton height={28} />
        <Skeleton height={28} />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Settings</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Company Name</div>
          <input name="company_name" value={form.company_name} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        </label>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Phone</div>
          <input name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        </label>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Employee Count</div>
          <input type="number" name="employee_count" value={form.employee_count} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        </label>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Website</div>
          <input name="website" value={form.website} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        </label>
        <label>
          <div style={{ fontSize: 12, color: '#64748b' }}>Industry</div>
          <input name="industry" value={form.industry} onChange={handleChange} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4c6fff', color: 'white', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
