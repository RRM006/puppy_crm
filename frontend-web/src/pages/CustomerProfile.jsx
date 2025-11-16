import React, { useEffect, useState } from 'react';
import { getCustomerProfile, updateCustomerProfile, getLinkedCompanies, linkToCompany } from '../services/customerService.js';
import Skeleton from '../components/common/Skeleton.jsx';
import Toast from '../components/common/Toast.jsx';
import { useDropzone } from 'react-dropzone';

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
    <div style={{ color: '#64748b' }}>{label}</div>
    <div>{value || '-'}</div>
  </div>
);

const ProfileInformation = ({ profile, onSaved, onError }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => { 
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
      });
      setPreview(profile.profile_picture_url || null);
    }
  }, [profile]);

  const onDrop = (accepted, rejected) => {
    if (rejected?.length) {
      onError?.('Invalid file. Please upload an image up to 2MB.');
      return;
    }
    if (accepted?.[0]) {
      setProfileFile(accepted[0]);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(accepted[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 2 * 1024 * 1024,
    multiple: false,
  });

  const validate = () => {
    const newErrors = {};
    if (!form.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!form.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      if (dob > new Date()) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((e) => ({ ...e, [name]: null }));
    }
  };

  const save = async () => {
    if (!validate()) {
      onError?.('Please fix validation errors');
      return;
    }

    try {
      let payload;
      if (profileFile) {
        payload = new FormData();
        // Add user fields
        payload.append('first_name', form.first_name);
        payload.append('last_name', form.last_name);
        if (form.phone) payload.append('phone', form.phone);
        // Add customer profile fields
        if (form.date_of_birth) payload.append('date_of_birth', form.date_of_birth);
        if (form.address) payload.append('address', form.address);
        if (form.city) payload.append('city', form.city);
        if (form.country) payload.append('country', form.country);
        // Add profile picture
        payload.append('profile_picture', profileFile);
      } else {
        payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || '',
          date_of_birth: form.date_of_birth || null,
          address: form.address || '',
          city: form.city || '',
          country: form.country || '',
        };
      }
      const updated = await updateCustomerProfile(payload);
      onSaved?.('Profile saved successfully');
      setEditing(false);
      setProfileFile(null);
      setForm({
        first_name: updated.first_name || '',
        last_name: updated.last_name || '',
        phone: updated.phone || '',
        date_of_birth: updated.date_of_birth || '',
        address: updated.address || '',
        city: updated.city || '',
        country: updated.country || '',
      });
      if (updated.profile_picture_url) {
        setPreview(updated.profile_picture_url);
      }
    } catch (e) {
      const msg = e?.detail || Object.values(e || {}).flat().join(', ') || 'Failed to save profile';
      onError?.(msg);
    }
  };

  const cancel = () => {
    setEditing(false);
    setProfileFile(null);
    setErrors({});
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
      });
      setPreview(profile.profile_picture_url || null);
    }
  };

  if (!form) return <Skeleton height={48} />;

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Profile Information</h2>
          <button className="btn-primary" onClick={() => setEditing(true)}>Edit</button>
        </div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {preview && (
            <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
              <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1, display: 'grid', gap: 12 }}>
            <InfoRow label="First Name" value={form.first_name} />
            <InfoRow label="Last Name" value={form.last_name} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={form.phone} />
            <InfoRow label="Date of Birth" value={form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString() : null} />
            <InfoRow label="Address" value={form.address} />
            <InfoRow label="City" value={form.city} />
            <InfoRow label="Country" value={form.country} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Edit Profile</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Profile Picture</div>
            <div {...getRootProps()} style={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              border: '2px dashed #cbd5e1', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              background: isDragActive ? '#eef2ff' : preview ? 'transparent' : '#f8fafc',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <input {...getInputProps()} />
              {preview ? (
                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: '#64748b' }}>
                  {isDragActive ? 'Drop here' : 'Click or drag'}
                </div>
              )}
            </div>
            {profileFile && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Selected: {profileFile.name}</div>
            )}
          </div>
          <div style={{ flex: 1, display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <div style={{ fontSize: 12, color: '#64748b' }}>First Name *</div>
                <input name="first_name" value={form.first_name || ''} onChange={change} style={{ borderColor: errors.first_name ? '#ef4444' : undefined }} />
                {errors.first_name && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.first_name}</div>}
              </label>
              <label>
                <div style={{ fontSize: 12, color: '#64748b' }}>Last Name *</div>
                <input name="last_name" value={form.last_name || ''} onChange={change} style={{ borderColor: errors.last_name ? '#ef4444' : undefined }} />
                {errors.last_name && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.last_name}</div>}
              </label>
            </div>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Email</div>
              <input value={profile.email} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Phone</div>
              <input name="phone" value={form.phone || ''} onChange={change} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Date of Birth</div>
              <input type="date" name="date_of_birth" value={form.date_of_birth || ''} onChange={change} style={{ borderColor: errors.date_of_birth ? '#ef4444' : undefined }} />
              {errors.date_of_birth && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.date_of_birth}</div>}
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Address</div>
              <input name="address" value={form.address || ''} onChange={change} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <div style={{ fontSize: 12, color: '#64748b' }}>City</div>
                <input name="city" value={form.city || ''} onChange={change} />
              </label>
              <label>
                <div style={{ fontSize: 12, color: '#64748b' }}>Country</div>
                <input name="country" value={form.country || ''} onChange={change} />
              </label>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={cancel}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
};

const LinkedCompanies = ({ onRefresh, onError }) => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await getLinkedCompanies();
      setCompanies(res.companies || []);
    } catch (e) {
      onError?.('Failed to load linked companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      const interval = setInterval(loadCompanies, 5000);
      return () => clearInterval(interval);
    }
  }, [onRefresh]);

  const handleRequestVerification = async (companyId, companyName) => {
    try {
      // Try to link again - API will return status if already linked
      await linkToCompany(companyId);
    } catch (e) {
      if (e.detail && e.detail.includes('already linked')) {
        // Show current verification status
        const isVerified = e.verified === true;
        if (isVerified) {
          onError?.('This company is already verified.');
        } else {
          onError?.('Verification request is pending. The company admin will verify your link soon.');
        }
        // Refresh the list to show current status
        loadCompanies();
      } else {
        onError?.('Failed to check verification status');
      }
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: 12 }}>Linked Companies</h2>
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div>
        <h2 style={{ marginBottom: 12 }}>Linked Companies</h2>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', color: '#64748b' }}>
          No linked companies yet. Link a company below to get started.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Linked Companies</h2>
      {companies.length > 0 && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#0c4a6e' }}>
          <strong>Note:</strong> When you link to a company, it creates a pending verification request. The company admin will verify your link. Once verified, you'll have full access to company services.
        </div>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {companies.map((comp) => (
          <div key={comp.id} style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {comp.company_logo && (
                <img src={comp.company_logo} alt={comp.company_name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#1e293b' }}>{comp.company_name}</div>
                  <span style={{ 
                    fontSize: 12, 
                    padding: '2px 8px', 
                    borderRadius: 4,
                    background: comp.verified ? '#dcfce7' : '#fef3c7',
                    color: comp.verified ? '#166534' : '#92400e',
                    fontWeight: 500 
                  }}>
                    {comp.verified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </div>
                {!comp.verified && (
                  <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 8, fontStyle: 'italic' }}>
                    Waiting for company verification...
                  </div>
                )}
                <div style={{ display: 'grid', gap: 4, fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                  {comp.company_phone && <div>📞 {comp.company_phone}</div>}
                  {comp.company_address && <div>📍 {comp.company_address}</div>}
                  {(comp.company_city || comp.company_country) && (
                    <div>{[comp.company_city, comp.company_country].filter(Boolean).join(', ')}</div>
                  )}
                  {comp.company_website && (
                    <div>
                      <a href={comp.company_website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                        🌐 {comp.company_website}
                      </a>
                    </div>
                  )}
                  {comp.company_industry && (
                    <div style={{ textTransform: 'capitalize' }}>🏢 {comp.company_industry}</div>
                  )}
                </div>
                {comp.created_at && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    Linked: {new Date(comp.created_at).toLocaleDateString()}
                  </div>
                )}
                {!comp.verified && (
                  <div style={{ marginTop: 12 }}>
                    <button 
                      className="btn-outline" 
                      onClick={() => handleRequestVerification(comp.company_id, comp.company_name)}
                      style={{ 
                        fontSize: 13,
                        padding: '6px 12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Request Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LinkNewCompany = ({ onSuccess, onError, onLinkCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const searchCompany = async () => {
    if (!searchQuery.trim()) {
      onError?.('Please enter a company name');
      return;
    }

    setSearching(true);
    try {
      // Try to link by name - API will return matches if multiple found
      await linkToCompany(null, searchQuery);
      onSuccess?.('Link request sent successfully! The company will verify your request.');
      setSearchQuery('');
      setMatches([]);
      loadPendingRequests();
      onLinkCreated?.(); // Refresh linked companies list
    } catch (e) {
      if (e.matches && Array.isArray(e.matches)) {
        setMatches(e.matches);
      } else if (e.detail && e.detail.includes('already linked')) {
        onError?.('You are already linked to this company.');
        setSearchQuery('');
      } else {
        const msg = e?.detail || e?.company_name?.[0] || 'Failed to link to company';
        onError?.(msg);
      }
    } finally {
      setSearching(false);
    }
  };

  const linkById = async (companyId) => {
    setSearching(true);
    try {
      await linkToCompany(companyId);
      onSuccess?.('Link request sent successfully! The company will verify your request.');
      setSearchQuery('');
      setMatches([]);
      loadPendingRequests();
      onLinkCreated?.(); // Refresh linked companies list
    } catch (e) {
      if (e.detail && e.detail.includes('already linked')) {
        onError?.('You are already linked to this company.');
      } else {
        const msg = e?.detail || 'Failed to link to company';
        onError?.(msg);
      }
    } finally {
      setSearching(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await getLinkedCompanies();
      const pending = (res.companies || []).filter(c => !c.verified);
      setPendingRequests(pending);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Link New Company</h2>
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#0c4a6e' }}>
        <strong>How it works:</strong> Search for a company by name. This will create a link request that the company admin needs to verify. Once verified, you'll have access to company services.
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Enter company name to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !searching && searchCompany()}
            style={{ flex: 1 }}
            disabled={searching}
          />
          <button className="btn-primary" onClick={searchCompany} disabled={searching || !searchQuery.trim()}>
            {searching ? 'Linking...' : 'Link Company'}
          </button>
        </div>

        {matches.length > 0 && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
              Multiple companies found. Please select the correct one:
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {matches.map((match) => (
                <button
                  key={match.id}
                  className="btn-outline"
                  onClick={() => linkById(match.id)}
                  disabled={searching}
                  style={{ 
                    textAlign: 'left', 
                    justifyContent: 'space-between',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{match.name}</div>
                    {match.city && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{match.city}</div>}
                  </div>
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
              Pending Verification Requests ({pendingRequests.length})
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#92400e' }}>{req.company_name}</div>
                    <div style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>
                      Requested on {new Date(req.created_at).toLocaleDateString()} • Waiting for company approval
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, padding: '4px 8px', background: '#fef3c7', borderRadius: 4 }}>
                    ⏳ Pending
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [refreshCompanies, setRefreshCompanies] = useState(0);

  const pushToast = (message, type = 'info', timeout = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((t) => [...t, { id, message, type, timeout }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter(x => x.id !== id));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCustomerProfile();
        setProfile(data);
      } catch (e) {
        pushToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleProfileSaved = (message) => {
    pushToast(message, 'success');
    // Reload profile to get updated data
    getCustomerProfile().then(setProfile).catch(() => {});
  };

  const handleLinkCreated = () => {
    // Trigger refresh of linked companies
    setRefreshCompanies((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '20px auto', padding: 16 }}>
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Customer Profile</h1>

      <div style={{ display: 'grid', gap: 24 }}>
        <ProfileInformation 
          profile={profile} 
          onSaved={handleProfileSaved} 
          onError={(m) => pushToast(m, 'error')} 
        />

        <LinkedCompanies 
          key={refreshCompanies}
          onError={(m) => pushToast(m, 'error')} 
        />

        <LinkNewCompany 
          onSuccess={(m) => pushToast(m, 'success')} 
          onError={(m) => pushToast(m, 'error')}
          onLinkCreated={handleLinkCreated}
        />
      </div>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default CustomerProfile;


