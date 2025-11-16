const API_BASE_URL = 'http://localhost:8000/api';
import { getAccessToken } from './authService';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAccessToken()}`,
});

export const getCustomerProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/customer/profile/`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateCustomerProfile = async (payload) => {
  // If payload includes files, caller should pass FormData and set proper headers
  const isFormData = payload instanceof FormData;
  const headers = isFormData ? { 'Authorization': `Bearer ${getAccessToken()}` } : authHeaders();

  const res = await fetch(`${API_BASE_URL}/auth/customer/profile/`, {
    method: 'PUT',
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const getLinkedCompanies = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/customer/companies/`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const linkToCompany = async (companyId, companyName) => {
  const payload = {};
  if (companyId) {
    payload.company_id = companyId;
  } else if (companyName) {
    payload.company_name = companyName;
  } else {
    throw new Error('Either company_id or company_name must be provided');
  }

  const res = await fetch(`${API_BASE_URL}/auth/customer/link-company/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export default {
  getCustomerProfile,
  updateCustomerProfile,
  getLinkedCompanies,
  linkToCompany,
};
