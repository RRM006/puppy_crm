// Authentication Service
// Handles all authentication-related API calls and token management

const API_BASE_URL = 'http://localhost:8000/api';

// Token management
export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

// User data management
export const setUserData = (userData) => {
  localStorage.setItem('user_data', JSON.stringify(userData));
};

export const getUserData = () => {
  const data = localStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
};

export const isAuthenticated = () => {
  return !!getAccessToken();
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
    setTokens(result.tokens.access, result.tokens.refresh);
    setUserData(result.user);

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
    setTokens(result.tokens.access, result.tokens.refresh);
    setUserData(result.user);

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
    setTokens(result.tokens.access, result.tokens.refresh);
    setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Logout User
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearTokens();
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
    setTokens(result.tokens.access, result.tokens.refresh);
    setUserData(result.user);

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
    setTokens(result.tokens.access, result.tokens.refresh);
    setUserData(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

// Get Current User Info
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw result;
    }

    setUserData(result);
    return result;
  } catch (error) {
    throw error;
  }
};

// Refresh Access Token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    
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
    localStorage.setItem('access_token', result.access);

    return result.access;
  } catch (error) {
    clearTokens();
    throw error;
  }
};
