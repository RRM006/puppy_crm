const API_BASE_URL = 'http://localhost:8000/api';
import { getAccessToken } from './authService';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`,
});

export const inviteUser = async ({ email, role, department = null, first_name = '', last_name = '' }) => {
  const res = await fetch(`${API_BASE_URL}/auth/company/invite/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, role, department, first_name, last_name })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const listInvitations = async (status) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE_URL}/auth/company/invitations/${query}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const cancelInvitation = async (id) => {
  const res = await fetch(`${API_BASE_URL}/auth/company/invitations/${id}/cancel/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Failed to cancel' }));
    throw data;
  }
  return { ok: true };
};

export const validateInvitation = async (token) => {
  const res = await fetch(`${API_BASE_URL}/auth/validate-invitation/${encodeURIComponent(token)}/`, {
    method: 'GET',
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const acceptInvitation = async ({ invitation_token, password = '' , department = null}) => {
  const payload = { invitation_token };
  if (password) payload.password = password;
  if (department) payload.department = department;
  const res = await fetch(`${API_BASE_URL}/auth/accept-invitation/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export default { inviteUser, listInvitations, cancelInvitation, validateInvitation, acceptInvitation };
