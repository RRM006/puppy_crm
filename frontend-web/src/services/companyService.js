const API_BASE_URL = 'http://localhost:8000/api';
import { getAccessToken } from './authService';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`,
});

export const getCompanyProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/company/profile/`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateCompanyProfile = async (payload) => {
  // If payload includes files, caller should pass FormData and set proper headers
  const isFormData = payload instanceof FormData;
  const headers = isFormData ? { 'Authorization': `Bearer ${getAccessToken()}` } : authHeaders();

  const res = await fetch(`${API_BASE_URL}/auth/company/profile/`, {
    method: 'PUT',
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const getCompanyTeam = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/auth/company/team/${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const getCompanyStats = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/company/stats/`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export default {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyTeam,
  getCompanyStats,
};
