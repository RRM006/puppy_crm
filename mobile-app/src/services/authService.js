// Authentication Service for Mobile
// Handles all authentication-related API calls and token management using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const API_BASE_URL = API_URL || 'http://localhost:8000/api';

// Token management with AsyncStorage
export const setTokens = async (accessToken, refreshToken) => {
  try {
    await AsyncStorage.multiSet([
      ['access_token', accessToken],
      ['refresh_token', refreshToken]
    ]);
  } catch (error) {
    console.error('Error setting tokens:', error);
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// User data management
export const setUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const isAuthenticated = async () => {
  const token = await getAccessToken();
  return !!token;
};

// Register Company User
export const registerCompany = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/company/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    // Store tokens and user data
    await setTokens(result.tokens.access, result.tokens.refresh);
    await setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Register Customer User
export const registerCustomer = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/customer/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    // Store tokens and user data
    await setTokens(result.tokens.access, result.tokens.refresh);
    await setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Login User
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    // Store tokens and user data
    await setTokens(result.tokens.access, result.tokens.refresh);
    await setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Logout User
export const logout = async () => {
  try {
    const refreshToken = await getRefreshToken();
    const accessToken = await getAccessToken();
    
    if (refreshToken && accessToken) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearTokens();
  }
};

// Google OAuth Signup
export const googleSignup = async (googleToken, accountType, additionalData = {}) => {
  try {
    const payload = {
      token: googleToken,
      account_type: accountType,
      ...additionalData,
    };

    const response = await fetch(`${API_BASE_URL}/auth/google/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    // Store tokens and user data
    await setTokens(result.tokens.access, result.tokens.refresh);
    await setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Google OAuth Login
export const googleLogin = async (googleToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: googleToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    // Store tokens and user data
    await setTokens(result.tokens.access, result.tokens.refresh);
    await setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Get Current User Info
export const getCurrentUser = async () => {
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    await setUserData(result);
    return result;
  } catch (error) {
    throw error;
  }
};

// Refresh Access Token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    // Update access token
    await AsyncStorage.setItem('access_token', result.access);

    return result.access;
  } catch (error) {
    await clearTokens();
    throw error;
  }
};
