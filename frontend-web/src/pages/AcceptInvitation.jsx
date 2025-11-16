import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitation, validateInvitation } from '../services/invitationService.js';
import { setTokens, setUserData } from '../services/authService.js';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await validateInvitation(token);
        setInfo(data);
      } catch (e) {
        setError(e?.detail || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await acceptInvitation({ invitation_token: token, password });
      // Store tokens and user to sign in immediately
      if (result?.tokens) {
        setTokens(result.tokens.access, result.tokens.refresh);
      }
      if (result?.user) setUserData(result.user);
      navigate('/company-dashboard');
    } catch (e) {
      setError(e?.detail || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Validating invitation...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;

  const requiresPassword = !info?.existing_user; // we don't have this flag; if no flag, show password optional

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2>Accept Invitation</h2>
      <div style={{ color: '#64748b', marginBottom: 16 }}>
        You are invited to join <strong>{info?.company?.name}</strong> as <strong>{info?.role}</strong>.
      </div>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 12 }}>
          {requiresPassword && (
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Set Password (new users)</div>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="At least 8 characters" style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </label>
          )}
          <button type="submit" disabled={submitting} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4c6fff', color: 'white', cursor: 'pointer' }}>{submitting ? 'Accepting...' : 'Accept Invitation'}</button>
        </div>
      </form>
    </div>
  );
};

export default AcceptInvitation;
