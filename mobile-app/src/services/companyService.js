// Company Service for Mobile
// Handles all company-related API calls with AsyncStorage caching

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { getAccessToken } from './authService';

const API_BASE_URL = API_URL || 'http://localhost:8000/api';

const CACHE_KEYS = {
  PROFILE: 'company_profile_cache',
  TEAM: 'company_team_cache',
  STATS: 'company_stats_cache',
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

// Get company profile
export const getCompanyProfile = async (useCache = true) => {
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
    const res = await fetch(`${API_BASE_URL}/auth/company/profile/`, {
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

// Update company profile
export const updateCompanyProfile = async (payload) => {
  try {
    const isFormData = payload instanceof FormData;
    const headers = await authHeaders(isFormData);

    const res = await fetch(`${API_BASE_URL}/auth/company/profile/`, {
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

// Get company team
export const getCompanyTeam = async (params = {}, useCache = true) => {
  try {
    const query = new URLSearchParams(params).toString();
    const cacheKey = `${CACHE_KEYS.TEAM}_${query || 'all'}`;

    // Try cache first
    if (useCache && !query) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const headers = await authHeaders();
    const url = `${API_BASE_URL}/auth/company/team/${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Cache the result (only if no filters)
    if (!query) {
      await setCachedData(cacheKey, data);
    }
    return data;
  } catch (error) {
    // If API fails, try to return cached data
    if (useCache && !query) {
      const cached = await getCachedData(`${CACHE_KEYS.TEAM}_all`);
      if (cached) return cached;
    }
    throw error;
  }
};

// Get company stats
export const getCompanyStats = async (useCache = true) => {
  try {
    // Try cache first
    if (useCache) {
      const cached = await getCachedData(CACHE_KEYS.STATS);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/company/stats/`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Cache the result
    await setCachedData(CACHE_KEYS.STATS, data);
    return data;
  } catch (error) {
    // If API fails, try to return cached data
    if (useCache) {
      const cached = await getCachedData(CACHE_KEYS.STATS);
      if (cached) return cached;
    }
    throw error;
  }
};

// Invite team member
export const inviteTeamMember = async (inviteData) => {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/company/invite/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(inviteData),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Clear team cache to force refresh
    await clearCache(CACHE_KEYS.TEAM);
    return data;
  } catch (error) {
    throw error;
  }
};

// Clear all caches
export const clearCompanyCache = async () => {
  await Promise.all([
    clearCache(CACHE_KEYS.PROFILE),
    clearCache(CACHE_KEYS.TEAM),
    clearCache(CACHE_KEYS.STATS),
  ]);
};

export default {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyTeam,
  getCompanyStats,
  inviteTeamMember,
  clearCompanyCache,
};

