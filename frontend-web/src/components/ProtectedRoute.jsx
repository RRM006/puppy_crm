import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredAccountType = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{
            color: '#4a5568',
            fontSize: '16px',
            fontWeight: '600',
          }}>Loading...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific account type is required, check it
  if (requiredAccountType && user?.account_type !== requiredAccountType) {
    // Redirect to appropriate dashboard based on actual account type
    if (user?.account_type === 'company') {
      return <Navigate to="/company-dashboard" replace />;
    } else if (user?.account_type === 'customer') {
      return <Navigate to="/customer-dashboard" replace />;
    }
    // Fallback to login if account type is unknown
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and has correct account type, render children
  return children;
};

export default ProtectedRoute;
