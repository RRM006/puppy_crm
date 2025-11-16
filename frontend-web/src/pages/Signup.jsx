import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { registerCompany, registerCustomer, googleSignup } from '../services/authService';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  
  // Form state
  const [accountType, setAccountType] = useState('company'); // 'company' or 'customer'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    employee_count: '',
    address: '',
  });
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { 
      strength: Math.min(strength, 5), 
      label: labels[Math.min(strength - 1, 4)] || 'Weak' 
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least 1 uppercase letter';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least 1 number';
    }

    // Confirm password
    if (!formData.password2) {
      newErrors.password2 = 'Please confirm your password';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    // First and Last name
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    } else if (formData.first_name.length > 50) {
      newErrors.first_name = 'First name must be less than 50 characters';
    }
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    } else if (formData.last_name.length > 50) {
      newErrors.last_name = 'Last name must be less than 50 characters';
    }

    // Company-specific validation
    if (accountType === 'company') {
      if (!formData.company_name) {
        newErrors.company_name = 'Company name is required';
      } else if (formData.company_name.length < 2) {
        newErrors.company_name = 'Company name must be at least 2 characters';
      } else if (formData.company_name.length > 100) {
        newErrors.company_name = 'Company name must be less than 100 characters';
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (formData.phone.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 characters';
      } else if (formData.phone.length > 20) {
        newErrors.phone = 'Phone number must be less than 20 characters';
      }
    }

    // Terms acceptance
    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the Terms & Conditions';
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
      let result;
      
      if (accountType === 'company') {
        result = await registerCompany({
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          company_name: formData.company_name,
          employee_count: parseInt(formData.employee_count) || 0,
        });
      } else {
        result = await registerCustomer({
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
        });
      }

      // Success - redirect to dashboard
      if (accountType === 'company') {
        navigate('/company-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle API errors
      if (error.email) {
        setErrors(prev => ({ ...prev, email: error.email[0] }));
      } else if (error.detail) {
        setApiError(error.detail);
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('An error occurred during signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup success
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setApiError('');

    try {
      const additionalData = {};
      
      if (accountType === 'company') {
        if (!formData.company_name) {
          setApiError('Please enter company name before signing up with Google');
          setLoading(false);
          return;
        }
        additionalData.company_name = formData.company_name;
        additionalData.phone = formData.phone;
        additionalData.employee_count = parseInt(formData.employee_count) || 0;
      } else {
        additionalData.phone = formData.phone;
        additionalData.address = formData.address;
      }

      await googleSignup(credentialResponse.credential, accountType, additionalData);

      // Success - redirect to dashboard
      if (accountType === 'company') {
        navigate('/company-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      
      if (error.detail) {
        setApiError(error.detail);
      } else {
        setApiError('An error occurred during Google signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Left Side - Form */}
      <div className="signup-form-section">
        <div className="signup-form-wrapper">
          <h1 className="signup-title">Get Started with Puppy CRM</h1>
          <p className="signup-subtitle">Create your account and start managing your business</p>

          {/* Account Type Selector */}
          <div className="account-type-selector">
            <button
              type="button"
              className={`account-type-btn ${accountType === 'company' ? 'active' : ''}`}
              onClick={() => setAccountType('company')}
            >
              <span className="account-icon">🏢</span>
              I'm a Company
            </button>
            <button
              type="button"
              className={`account-type-btn ${accountType === 'customer' ? 'active' : ''}`}
              onClick={() => setAccountType('customer')}
            >
              <span className="account-icon">👤</span>
              I'm a Customer
            </button>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="error-message-box">
              {apiError}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Name Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? 'error' : ''}
                  disabled={loading}
                  maxLength="50"
                />
                {errors.first_name && <span className="error-text">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? 'error' : ''}
                  disabled={loading}
                  maxLength="50"
                />
                {errors.last_name && <span className="error-text">{errors.last_name}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={errors.email ? 'error' : ''}
                disabled={loading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className={errors.password ? 'error' : ''}
                disabled={loading}
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className={`strength-fill strength-${passwordStrength.strength}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="strength-label">{passwordStrength.label}</span>
                </div>
              )}
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="password2">Confirm Password *</label>
              <input
                type="password"
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={errors.password2 ? 'error' : ''}
                disabled={loading}
              />
              {errors.password2 && <span className="error-text">{errors.password2}</span>}
            </div>

            {/* Company-specific fields */}
            {accountType === 'company' && (
              <>
                <div className="form-group">
                  <label htmlFor="company_name">Company Name *</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Your Company Inc."
                    className={errors.company_name ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.company_name && <span className="error-text">{errors.company_name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      className={errors.phone ? 'error' : ''}
                      disabled={loading}
                      maxLength="20"
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="employee_count">Company Size</label>
                    <select
                      id="employee_count"
                      name="employee_count"
                      value={formData.employee_count}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select size</option>
                      <option value="5">1-10 employees</option>
                      <option value="25">11-50 employees</option>
                      <option value="100">51-200 employees</option>
                      <option value="350">201-500 employees</option>
                      <option value="1000">500+ employees</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Customer-specific fields */}
            {accountType === 'customer' && (
              <>
                <div className="form-group">
                  <label htmlFor="phone">Phone (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    disabled={loading}
                    maxLength="20"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address (Optional)</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your address"
                    rows="3"
                    disabled={loading}
                  ></textarea>
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={loading}
                />
                <span>I agree to the <Link to="/terms">Terms & Conditions</Link></span>
              </label>
              {errors.terms && <span className="error-text">{errors.terms}</span>}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary btn-signup"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* Google Signup Button - Temporarily disabled until Google Cloud Console is updated */}
            {/* Uncomment after adding http://localhost:5174 to Google OAuth allowed origins */}
            {/*
            <div className="google-signup-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setApiError('Google signup failed. Please try again.')}
                text="signup_with"
                size="large"
              />
            </div>
            */}

            {/* Login Link */}
            <p className="signup-footer">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Benefits/Illustration */}
      <div className="signup-benefits-section">
        <div className="benefits-content">
          <h2>Why Choose Puppy CRM?</h2>
          
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <div>
              <h3>Powerful Analytics</h3>
              <p>Track your sales pipeline and customer interactions in real-time</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🤝</div>
            <div>
              <h3>Easy Collaboration</h3>
              <p>Work seamlessly with your team on leads and deals</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">📱</div>
            <div>
              <h3>Mobile Ready</h3>
              <p>Access your CRM anywhere, anytime on any device</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🔒</div>
            <div>
              <h3>Secure & Reliable</h3>
              <p>Your data is protected with enterprise-grade security</p>
            </div>
          </div>

          <div className="testimonial">
            <p className="quote">"Puppy CRM transformed how we manage our customer relationships. Highly recommended!"</p>
            <p className="author">- Dr. Nabeel Mohammed [NbM], CEO</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
