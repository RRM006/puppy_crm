import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (formData.email.length > 100) {
      newErrors.email = 'Email must be less than 100 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password must be less than 128 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      // Success - redirect based on account type
      if (result.user.account_type === 'company') {
        navigate('/company-dashboard');
      } else if (result.user.account_type === 'customer') {
        navigate('/customer-dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle API errors
      if (error.detail) {
        setApiError(error.detail);
      } else if (error.email) {
        setErrors(prev => ({ ...prev, email: error.email[0] }));
      } else if (error.password) {
        setErrors(prev => ({ ...prev, password: error.password[0] }));
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login success
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setApiError('');

    try {
      const result = await googleLogin(credentialResponse.credential);

      // Success - redirect based on account type
      if (result.user.account_type === 'company') {
        navigate('/company-dashboard');
      } else if (result.user.account_type === 'customer') {
        navigate('/customer-dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Google login error:', error);
      
      if (error.detail) {
        if (error.detail.includes('not found')) {
          setApiError('No account found with this Google email. Please sign up first.');
        } else {
          setApiError(error.detail);
        }
      } else {
        setApiError('An error occurred during Google login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Form */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          {/* Logo */}
          <Link to="/" className="login-logo-link">
            <div className="login-logo">🐶</div>
            <div className="login-logo-text">Puppy CRM</div>
          </Link>
          
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Login to your account</p>

          {/* API Error Message */}
          {apiError && (
            <div className="error-message-box">
              {apiError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={errors.email ? 'error' : ''}
                disabled={loading}
                maxLength="100"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                  disabled={loading}
                  maxLength="128"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Remember me & Forgot password */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* Google Login Button - Temporarily disabled until Google Cloud Console is updated */}
            {/* Uncomment after adding http://localhost:5174 to Google OAuth allowed origins */}
            {/*
            <div className="divider">
              <span>OR</span>
            </div>
            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setApiError('Google login failed. Please try again.')}
                text="signin_with"
                size="large"
              />
            </div>
            */}

            {/* Signup Link */}
            <p className="login-footer">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Illustration/Benefits */}
      <div className="login-benefits-section">
        <div className="benefits-content">
          <h2>Manage Your Business Better</h2>
          
          <div className="benefit-item">
            <div className="benefit-icon">🚀</div>
            <div>
              <h3>Boost Productivity</h3>
              <p>Streamline your sales process and close deals faster</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">📈</div>
            <div>
              <h3>Track Performance</h3>
              <p>Monitor your team's performance with real-time analytics</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">💼</div>
            <div>
              <h3>Manage Customers</h3>
              <p>Keep all your customer information in one place</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🔔</div>
            <div>
              <h3>Stay Updated</h3>
              <p>Get instant notifications on important activities</p>
            </div>
          </div>

          <div className="testimonial">
            <p className="quote">"Since we started using Puppy CRM, our sales have increased by 40%. It's a game changer!"</p>
            <p className="author">- Dr. Nabeel Mohammed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
