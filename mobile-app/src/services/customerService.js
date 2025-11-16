// Customer Service for Mobile
// Handles all customer-related API calls with AsyncStorage caching

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { getAccessToken } from './authService';

const API_BASE_URL = API_URL || 'http://localhost:8000/api';

const CACHE_KEYS = {
  PROFILE: 'customer_profile_cache',
  COMPANIES: 'customer_companies_cache',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const authHeaders = async (isFormData = false) => {
  const token = await getAccessToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Cache helper functions
const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
};

const setCachedData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Get customer profile
export const getCustomerProfile = async (useCache = true) => {
  try {
    // Try cache first
    if (useCache) {
      const cached = await getCachedData(CACHE_KEYS.PROFILE);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/customer/profile/`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Cache the result
    await setCachedData(CACHE_KEYS.PROFILE, data);
    return data;
  } catch (error) {
    // If API fails, try to return cached data
    if (useCache) {
      const cached = await getCachedData(CACHE_KEYS.PROFILE);
      if (cached) return cached;
    }
    throw error;
  }
};

// Update customer profile
export const updateCustomerProfile = async (payload) => {
  try {
    const isFormData = payload instanceof FormData;
    const headers = await authHeaders(isFormData);

    const res = await fetch(`${API_BASE_URL}/auth/customer/profile/`, {
      method: 'PUT',
      headers,
      body: isFormData ? payload : JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Update cache
    await setCachedData(CACHE_KEYS.PROFILE, data);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get linked companies
export const getLinkedCompanies = async (useCache = true) => {
  try {
    // Try cache first
    if (useCache) {
      const cached = await getCachedData(CACHE_KEYS.COMPANIES);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/customer/companies/`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Cache the result
    await setCachedData(CACHE_KEYS.COMPANIES, data);
    return data;
  } catch (error) {
    // If API fails, try to return cached data
    if (useCache) {
      const cached = await getCachedData(CACHE_KEYS.COMPANIES);
      if (cached) return cached;
    }
    throw error;
  }
};

// Link to company
export const linkToCompany = async (companyId, companyName) => {
  try {
    const payload = {};
    if (companyId) {
      payload.company_id = companyId;
    } else if (companyName) {
      payload.company_name = companyName;
    } else {
      throw new Error('Either company_id or company_name must be provided');
    }

    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/customer/link-company/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Clear companies cache to force refresh
    await clearCache(CACHE_KEYS.COMPANIES);
    return data;
  } catch (error) {
    throw error;
  }
};

// Clear all caches
export const clearCustomerCache = async () => {
  await Promise.all([
    clearCache(CACHE_KEYS.PROFILE),
    clearCache(CACHE_KEYS.COMPANIES),
  ]);
};

export default {
  getCustomerProfile,
  updateCustomerProfile,
  getLinkedCompanies,
  linkToCompany,
  clearCustomerCache,
};

