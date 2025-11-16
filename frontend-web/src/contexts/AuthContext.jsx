import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  login as loginService,
  logout as logoutService,
  registerCompany,
  registerCustomer,
  googleSignup as googleSignupService,
  googleLogin as googleLoginService,
  getCurrentUser as getCurrentUserService,
  refreshAccessToken as refreshAccessTokenService,
  isAuthenticated as checkAuthenticated,
  getUserData,
  clearTokens,
} from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [company, setCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if token exists
        if (checkAuthenticated()) {
          // Try to get user data from localStorage first
          const cachedUser = getUserData();
            if (cachedUser) {
            setUser(cachedUser);
            setIsAuthenticated(true);
              // derive company and role if present
              if (cachedUser.company) {
                setCompany(cachedUser.company);
                setUserRole(cachedUser.company.role || null);
              } else {
                setCompany(null);
                setUserRole(null);
              }
            setLoading(false);
            
            // Fetch fresh user data in background
            try {
              let freshUser;
              try {
                freshUser = await getCurrentUserService();
              } catch (err) {
                // Attempt to refresh token and retry once
                try {
                  await refreshAccessTokenService();
                  freshUser = await getCurrentUserService();
                } catch (refreshErr) {
                  throw refreshErr;
                }
              }
              setUser(freshUser);
              if (freshUser.company) {
                setCompany(freshUser.company);
                setUserRole(freshUser.company.role || null);
              } else {
                setCompany(null);
                setUserRole(null);
              }
            } catch (error) {
              // If fetch fails, keep using cached data
              console.error('Failed to refresh user data:', error);
            }
          } else {
            // No cached data, fetch from server
            let userData;
            try {
              userData = await getCurrentUserService();
            } catch (err) {
              // Attempt refresh then retry once
              await refreshAccessTokenService();
              userData = await getCurrentUserService();
            }
            setUser(userData);
            if (userData.company) {
              setCompany(userData.company);
              setUserRole(userData.company.role || null);
            } else {
              setCompany(null);
              setUserRole(null);
            }
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear invalid tokens
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const result = await loginService(email, password);
      setUser(result.user);
      if (result.user.company) {
        setCompany(result.user.company);
        setUserRole(result.user.company.role || null);
      } else {
        setCompany(null);
        setUserRole(null);
      }
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Signup function
  const signup = async (data, accountType) => {
    try {
      let result;
      if (accountType === 'company') {
        result = await registerCompany(data);
      } else {
        result = await registerCustomer(data);
      }
      setUser(result.user);
      if (result.user.company) {
        setCompany(result.user.company);
        setUserRole(result.user.company.role || null);
      } else {
        setCompany(null);
        setUserRole(null);
      }
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Google OAuth function (handles both login and signup)
  const googleAuth = async (token, isSignup = false, accountType = null, additionalData = {}) => {
    try {
      let result;
      
      if (isSignup) {
        // Google Signup
        if (!accountType) {
          throw new Error('Account type is required for signup');
        }
        result = await googleSignupService(token, accountType, additionalData);
      } else {
        // Google Login
        result = await googleLoginService(token);
      }
      
      setUser(result.user);
      if (result.user.company) {
        setCompany(result.user.company);
        setUserRole(result.user.company.role || null);
      } else {
        setCompany(null);
        setUserRole(null);
      }
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setCompany(null);
      setUserRole(null);
    }
  };

  // Get current user (refresh user data)
  const getCurrentUser = async () => {
    try {
      let userData;
      try {
        userData = await getCurrentUserService();
      } catch (err) {
        // Attempt to refresh token and retry once
        await refreshAccessTokenService();
        userData = await getCurrentUserService();
      }
      setUser(userData);
      if (userData.company) {
        setCompany(userData.company);
        setUserRole(userData.company.role || null);
      } else {
        setCompany(null);
        setUserRole(null);
      }
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Failed to get current user:', error);
      // If token is invalid, clear auth state
      setUser(null);
      setIsAuthenticated(false);
      clearTokens();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    company,
    userRole,
    login,
    signup,
    googleAuth,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
