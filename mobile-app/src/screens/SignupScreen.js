import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { registerCompany, registerCustomer, googleSignup } from '../services/authService';

const SignupScreen = ({ navigation }) => {
  // Account type state
  const [accountType, setAccountType] = useState('company'); // 'company' or 'customer'

  // Form state
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

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '#ccc' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const strengthConfig = {
      1: { label: 'Weak', color: '#ff4444' },
      2: { label: 'Fair', color: '#ff8800' },
      3: { label: 'Good', color: '#ffbb00' },
      4: { label: 'Strong', color: '#00cc44' },
      5: { label: 'Very Strong', color: '#00aa00' },
    };

    const config = strengthConfig[Math.min(strength, 5)] || strengthConfig[1];
    return { strength: Math.min(strength, 5), ...config };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Handle input changes
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
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
  const handleSubmit = async () => {
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

      // Success - navigate to appropriate dashboard
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (accountType === 'company') {
              navigation.replace('CompanyDashboard');
            } else {
              navigation.replace('CustomerDashboard');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Signup error:', error);

      // Handle API errors
      if (error.email) {
        setErrors((prev) => ({ ...prev, email: error.email[0] }));
      } else if (error.detail) {
        Alert.alert('Error', error.detail);
      } else if (error.message) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'An error occurred during signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup (placeholder - requires Google Sign-In configuration)
  const handleGoogleSignup = async () => {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In requires additional configuration. Please use email/password signup for now.',
      [{ text: 'OK' }]
    );
    
    // TODO: Implement Google Sign-In
    // 1. Configure @react-native-google-signin/google-signin
    // 2. Get Google credential
    // 3. Call googleSignup with token and account type
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="paw" size={60} color="#667eea" />
          <Text style={styles.logoText}>Puppy CRM</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us and start managing your business</Text>

        {/* Account Type Selector */}
        <View style={styles.accountTypeContainer}>
          <TouchableOpacity
            style={[
              styles.accountTypeButton,
              accountType === 'company' && styles.accountTypeButtonActive,
            ]}
            onPress={() => setAccountType('company')}
          >
            <Text
              style={[
                styles.accountTypeText,
                accountType === 'company' && styles.accountTypeTextActive,
              ]}
            >
              Company
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.accountTypeButton,
              accountType === 'customer' && styles.accountTypeButtonActive,
            ]}
            onPress={() => setAccountType('customer')}
          >
            <Text
              style={[
                styles.accountTypeText,
                accountType === 'customer' && styles.accountTypeTextActive,
              ]}
            >
              Customer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              placeholder="Enter your first name"
              value={formData.first_name}
              onChangeText={(value) => handleChange('first_name', value)}
              autoCapitalize="words"
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              placeholder="Enter your last name"
              value={formData.last_name}
              onChangeText={(value) => handleChange('last_name', value)}
              autoCapitalize="words"
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            {formData.password && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : '#e0e0e0',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password2 && styles.inputError]}
                placeholder="Confirm your password"
                value={formData.password2}
                onChangeText={(value) => handleChange('password2', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password2 && <Text style={styles.errorText}>{errors.password2}</Text>}
          </View>

          {/* Company-specific fields */}
          {accountType === 'company' && (
            <>
              {/* Company Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  style={[styles.input, errors.company_name && styles.inputError]}
                  placeholder="Enter your company name"
                  value={formData.company_name}
                  onChangeText={(value) => handleChange('company_name', value)}
                  autoCapitalize="words"
                />
                {errors.company_name && (
                  <Text style={styles.errorText}>{errors.company_name}</Text>
                )}
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Employee Count */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee Count (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Number of employees"
                  value={formData.employee_count}
                  onChangeText={(value) => handleChange('employee_count', value)}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          {/* Customer-specific fields */}
          {accountType === 'customer' && (
            <>
              {/* Phone (Optional for customer) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your address"
                  value={formData.address}
                  onChangeText={(value) => handleChange('address', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

          {/* Terms Checkbox */}
          <View style={styles.checkboxContainer}>
            <Checkbox
              value={acceptedTerms}
              onValueChange={setAcceptedTerms}
              color={acceptedTerms ? '#667eea' : undefined}
            />
            <Text style={styles.checkboxLabel}>
              I agree to the{' '}
              <Text style={styles.link}>Terms & Conditions</Text>
            </Text>
          </View>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Google Sign Up Button - Temporarily disabled until Google Sign-In is configured */}
          {/* Uncomment after configuring @react-native-google-signin/google-signin and Google Cloud Console */}
          {/*
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignup}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>
          */}

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  accountTypeButtonActive: {
    backgroundColor: '#667eea',
  },
  accountTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#fc8181',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    color: '#fc8181',
    fontSize: 12,
    marginTop: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4a5568',
  },
  link: {
    color: '#667eea',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#a0aec0',
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#718096',
    fontSize: 14,
  },
  footerLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignupScreen;
