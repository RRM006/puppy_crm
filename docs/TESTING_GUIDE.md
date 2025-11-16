# 🧪 Testing Guide - Phase 2 Authentication

## 📋 Overview

This guide covers how to test all Phase 2 authentication features on web and mobile platforms.

**Last Updated**: November 14, 2025  
**Phase**: Phase 2 - Authentication System  
**Status**: ✅ Complete

---

## 🚀 Prerequisites

### Backend Setup
1. PostgreSQL database running
2. Backend server running on `http://localhost:8000`
3. All migrations applied
4. Environment variables configured in `backend/.env`

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### Web Frontend Setup
1. Node.js installed
2. Dependencies installed (`npm install`)
3. Dev server running on `http://localhost:5174`

```bash
cd frontend-web
npm install
npm run dev
```

### Mobile App Setup
1. Expo CLI installed
2. Dependencies installed
3. Expo dev server running
4. iOS Simulator or Android Emulator running (or physical device)

```bash
cd mobile-app
npm install
npx expo start
```

---

## 🔐 Test Credentials Format

### Company User (B2B)
```json
{
  "email": "ceo@acmecorp.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Acme Corp",
  "phone": "+1234567890",
  "employee_count": 50
}
```

### Customer User (B2C)
```json
{
  "email": "customer@example.com",
  "password": "SecurePass456!",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1987654321",
  "address": "123 Main St, New York, NY 10001"
}
```

---

## 🌐 Web Frontend Testing

### Test 1: Company User Registration

**Steps**:
1. Navigate to `http://localhost:5174`
2. Click "Get Started" or "Sign Up"
3. Select "Company Account" tab
4. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `ceo@acmecorp.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Company Name: `Acme Corp`
   - Phone: `+1234567890`
   - Employee Count: `50`
5. Check "I agree to the Terms & Conditions"
6. Click "Create Account"

**Expected Results**:
- ✅ Form validates all fields
- ✅ Password strength indicator shows "Very Strong" (green)
- ✅ Submit button shows loading spinner
- ✅ Redirect to `/company-dashboard`
- ✅ Dashboard displays welcome message: "Welcome, John Doe"
- ✅ Company name displayed: "Acme Corp"
- ✅ JWT tokens stored in localStorage (`access_token`, `refresh_token`)
- ✅ Navbar shows logout button (no login/signup buttons)

**Error Cases to Test**:
- ❌ Email already exists → Error: "User with this email already exists"
- ❌ Weak password (e.g., "12345678") → Error: "This password is too common"
- ❌ Passwords don't match → Error: "Passwords must match"
- ❌ Missing required fields → Field-specific error messages
- ❌ Invalid email format → Error: "Enter a valid email address"

---

### Test 2: Customer User Registration

**Steps**:
1. Navigate to `http://localhost:5174/signup`
2. Select "Customer Account" tab
3. Fill in the form:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Email: `customer@example.com`
   - Password: `SecurePass456!`
   - Confirm Password: `SecurePass456!`
   - Phone: `+1987654321`
   - Address: `123 Main St, New York, NY 10001`
4. Check "I agree to the Terms & Conditions"
5. Click "Create Account"

**Expected Results**:
- ✅ Form validates all fields
- ✅ Redirect to `/customer-dashboard`
- ✅ Dashboard displays welcome message: "Welcome, Jane Smith"
- ✅ Customer address displayed
- ✅ JWT tokens stored in localStorage

---

### Test 3: Login with Company Account

**Steps**:
1. Clear localStorage (Application tab in DevTools)
2. Navigate to `http://localhost:5174/login`
3. Fill in the form:
   - Email: `ceo@acmecorp.com`
   - Password: `SecurePass123!`
4. Check "Remember me" (optional)
5. Click "Login"

**Expected Results**:
- ✅ Form validates email and password
- ✅ Submit button shows loading spinner
- ✅ Redirect to `/company-dashboard`
- ✅ User data loaded from API
- ✅ JWT tokens stored in localStorage

**Error Cases to Test**:
- ❌ Wrong password → Error: "Invalid email or password"
- ❌ Non-existent email → Error: "Invalid email or password"
- ❌ Empty fields → Field-specific validation errors

---

### Test 4: Login with Customer Account

**Steps**:
1. Clear localStorage
2. Navigate to `http://localhost:5174/login`
3. Fill in:
   - Email: `customer@example.com`
   - Password: `SecurePass456!`
4. Click "Login"

**Expected Results**:
- ✅ Redirect to `/customer-dashboard`
- ✅ Customer-specific dashboard displayed

---

### Test 5: Protected Routes

**Steps**:
1. Clear localStorage (not logged in)
2. Try to navigate to `http://localhost:5174/company-dashboard`

**Expected Results**:
- ✅ Automatically redirect to `/login`
- ✅ URL changes to `/login?redirect=/company-dashboard` (optional)

**Then**:
1. Login with company account
2. Should redirect to `/company-dashboard`

---

### Test 6: Token Refresh Flow

**Steps**:
1. Login to any account
2. Open DevTools → Application → localStorage
3. Note the `access_token` value
4. Wait 1 hour for token to expire (or manually set expiry to 1 minute in backend settings)
5. Make an API request (navigate between pages)

**Expected Results**:
- ✅ Initial request fails with 401
- ✅ Axios interceptor automatically calls `/api/auth/token/refresh/`
- ✅ New access token stored in localStorage
- ✅ Original request retried with new token
- ✅ User stays logged in

---

### Test 7: Logout

**Steps**:
1. Login to any account
2. Navigate to dashboard
3. Click "Logout" button

**Expected Results**:
- ✅ API call to `/api/auth/logout/` with refresh token
- ✅ Tokens removed from localStorage
- ✅ Redirect to landing page (`/`)
- ✅ Navbar shows login/signup buttons
- ✅ Cannot access protected routes

---

### Test 8: Google OAuth (Currently Disabled)

**Note**: Google OAuth buttons are currently commented out until Google Cloud Console is configured.

**To Enable**: See [ENABLE_GOOGLE_OAUTH.md](../ENABLE_GOOGLE_OAUTH.md)

**Steps** (after enabling):
1. Navigate to signup or login page
2. Click "Sign up with Google" or "Login with Google"
3. Google popup opens
4. Select Google account
5. Authorize Puppy CRM

**Expected Results**:
- ✅ Google token sent to backend
- ✅ Backend verifies token with Google
- ✅ User created/logged in
- ✅ JWT tokens returned
- ✅ Redirect to appropriate dashboard

---

### Test 9: Password Strength Indicator

**Steps**:
1. Navigate to signup page
2. Type various passwords in the password field

**Test Cases**:
| Password | Expected Strength | Color |
|----------|------------------|-------|
| `12345678` | Very Weak | Red |
| `password123` | Weak | Orange |
| `Password123` | Medium | Yellow |
| `Pass@word123` | Strong | Light Green |
| `P@ssw0rd!2024` | Very Strong | Green |

**Expected Results**:
- ✅ Indicator updates in real-time as you type
- ✅ Color changes based on strength
- ✅ Label shows correct strength level

---

### Test 10: Forgot Password Link

**Steps**:
1. Navigate to login page
2. Click "Forgot password?" link

**Expected Results**:
- ✅ Placeholder alert shown (not implemented yet)
- ✅ Future: Navigate to password reset page

---

### Test 11: Clickable Logo on Login Page

**Steps**:
1. Navigate to `/login` page
2. Click on the Puppy CRM logo at the top (🐶 emoji + "Puppy CRM" text)

**Expected Results**:
- ✅ Logo is clickable
- ✅ Navigates back to landing page (`/`)
- ✅ Logo has hover effect (scales up, gradient visible)

---

## 📱 Mobile App Testing

### Test 12: Company User Registration (Mobile)

**Steps**:
1. Open mobile app in iOS Simulator or Android Emulator
2. Tap "Sign Up" on landing screen
3. Tap "Company Account" tab
4. Fill in the form (same fields as web)
5. Check "I agree to the Terms & Conditions"
6. Tap "Create Account"

**Expected Results**:
- ✅ Form validates all fields
- ✅ Password strength indicator shows color-coded strength
- ✅ Loading spinner appears on button
- ✅ Navigate to Company Dashboard screen
- ✅ Welcome message displayed
- ✅ JWT tokens stored in AsyncStorage
- ✅ Cannot swipe back to auth screens

---

### Test 13: Customer User Registration (Mobile)

**Steps**:
1. Tap "Sign Up"
2. Tap "Customer Account" tab
3. Fill in customer form
4. Tap "Create Account"

**Expected Results**:
- ✅ Navigate to Customer Dashboard screen
- ✅ Customer data displayed

---

### Test 14: Login (Mobile)

**Steps**:
1. Open fresh app (clear app data)
2. Tap "Log In" on landing screen
3. Enter email and password
4. Check "Remember me" (optional)
5. Tap "Login"

**Expected Results**:
- ✅ Navigate to appropriate dashboard
- ✅ Tokens stored in AsyncStorage

---

### Test 15: Protected Navigation (Mobile)

**Steps**:
1. Open app (not logged in)
2. Observe initial screen

**Expected Results**:
- ✅ Landing screen shown (AuthStack)
- ✅ Cannot access dashboard screens

**Then**:
1. Login
2. App automatically switches to MainStack
3. Dashboard screen shown
4. No back button visible (headerLeft: null)

---

### Test 16: Token Persistence (Mobile)

**Steps**:
1. Login to app
2. Close app completely (swipe away)
3. Reopen app

**Expected Results**:
- ✅ Loading screen appears briefly
- ✅ App checks AsyncStorage for tokens
- ✅ Automatically navigates to dashboard (user still logged in)
- ✅ No need to login again

---

### Test 17: Logout (Mobile)

**Steps**:
1. Login to any account
2. Navigate to dashboard
3. Tap "Logout" button

**Expected Results**:
- ✅ API call to logout endpoint
- ✅ Tokens cleared from AsyncStorage
- ✅ AuthContext updated
- ✅ App automatically switches to AuthStack
- ✅ Landing screen shown

---

### Test 18: Show/Hide Password (Mobile)

**Steps**:
1. Navigate to login or signup screen
2. Enter password
3. Tap eye icon

**Expected Results**:
- ✅ Password visibility toggles
- ✅ Icon changes (eye → eye-off)

---

### Test 19: Forgot Password (Mobile)

**Steps**:
1. Navigate to login screen
2. Tap "Forgot password?" link

**Expected Results**:
- ✅ Placeholder alert shown

---

### Test 20: Clickable Logo on Login Screen (Mobile)

**Steps**:
1. Navigate to Login screen
2. Tap on the Puppy CRM logo at the top (paw icon + "Puppy CRM" text)

**Expected Results**:
- ✅ Logo is tappable
- ✅ Navigates back to Landing screen
- ✅ Visual feedback on tap (opacity change)

---

## 🔧 API Testing with Postman/cURL

### Test 21: Register Company via API

```bash
curl -X POST http://localhost:8000/api/auth/register/company/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@company.com",
    "password": "SecurePass789!",
    "password2": "SecurePass789!",
    "first_name": "API",
    "last_name": "Tester",
    "company_name": "API Test Corp",
    "phone": "+1555123456",
    "employee_count": 25
  }'
```

**Expected Response** (201 Created):
```json
{
  "user": {
    "id": 3,
    "email": "apitest@company.com",
    "first_name": "API",
    "last_name": "Tester",
    "account_type": "company",
    "phone": "+1555123456",
    "is_verified": false,
    "created_at": "2025-11-14T10:00:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "company": {
    "id": 2,
    "name": "API Test Corp",
    "role": "ceo",
    "phone": "+1555123456",
    "employee_count": 25
  }
}
```

---

### Test 22: Login via API

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@company.com",
    "password": "SecurePass789!"
  }'
```

**Expected Response** (200 OK):
```json
{
  "user": { ... },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

---

### Test 23: Get Current User

```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "id": 3,
  "email": "apitest@company.com",
  "first_name": "API",
  "last_name": "Tester",
  "account_type": "company",
  "phone": "+1555123456",
  "is_verified": false,
  "created_at": "2025-11-14T10:00:00Z",
  "company": {
    "id": 2,
    "name": "API Test Corp",
    "role": "ceo",
    "phone": "+1555123456",
    "employee_count": 25
  }
}
```

---

### Test 24: Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response** (200 OK):
```json
{
  "access": "NEW_ACCESS_TOKEN"
}
```

---

### Test 25: Logout

```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response** (200 OK):
```json
{
  "detail": "Successfully logged out."
}
```

---

### Test 26: Invalid Token

```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected Response** (401 Unauthorized):
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

---

### Test 27: Missing Authorization Header

```bash
curl -X GET http://localhost:8000/api/auth/me/
```

**Expected Response** (401 Unauthorized):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 📊 Test Coverage Checklist

### Backend API
- [x] Company registration endpoint
- [x] Customer registration endpoint
- [x] Login endpoint
- [x] Logout endpoint
- [x] Token refresh endpoint
- [x] Current user endpoint
- [x] Google OAuth signup endpoint
- [x] Google OAuth login endpoint
- [x] Password validation
- [x] Email validation
- [x] Token blacklist on logout
- [x] JWT token generation
- [x] Token expiry handling

### Web Frontend
- [x] Company signup form
- [x] Customer signup form
- [x] Login form
- [x] Password strength indicator
- [x] Form validation
- [x] Error handling
- [x] Loading states
- [x] Protected routes
- [x] Auth context
- [x] Token storage (localStorage)
- [x] Token refresh interceptor
- [x] Logout functionality
- [x] Automatic navigation
- [x] Clickable logo on login

### Mobile App
- [x] Company signup screen
- [x] Customer signup screen
- [x] Login screen
- [x] Password strength indicator
- [x] Form validation
- [x] Error handling
- [x] Loading states
- [x] Protected navigation
- [x] Auth context
- [x] Token storage (AsyncStorage)
- [x] Token refresh interceptor
- [x] Logout functionality
- [x] Automatic stack switching
- [x] Clickable logo on login

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Google OAuth**: Buttons are commented out (not configured)
2. **Password Reset**: Forgot password is a placeholder
3. **Email Verification**: Not implemented (is_verified always false)
4. **Remember Me**: Checkbox exists but doesn't affect token expiry
5. **Account Type Routing**: Mobile doesn't check account_type in navigation

### Future Enhancements
1. Email verification system
2. Password reset flow
3. Biometric authentication (mobile)
4. Social login (Facebook, Apple)
5. Two-factor authentication (2FA)

---

## 📝 Test Results Template

Use this template to document your test results:

```markdown
## Test Session

**Date**: November 14, 2025
**Tester**: Your Name
**Environment**: Development (localhost)
**Platforms Tested**: Web, iOS Simulator, Android Emulator

### Results

| Test # | Test Name | Platform | Status | Notes |
|--------|-----------|----------|--------|-------|
| 1 | Company Registration | Web | ✅ Pass | |
| 2 | Customer Registration | Web | ✅ Pass | |
| 3 | Login Company | Web | ✅ Pass | |
| 4 | Login Customer | Web | ✅ Pass | |
| 5 | Protected Routes | Web | ✅ Pass | |
| 6 | Token Refresh | Web | ⏭️ Skip | Requires 1 hour wait |
| 7 | Logout | Web | ✅ Pass | |
| 8 | Google OAuth | Web | ⏭️ Skip | Not configured |
| 9 | Password Strength | Web | ✅ Pass | |
| 10 | Forgot Password | Web | ✅ Pass | Placeholder |
| 11 | Clickable Logo | Web | ✅ Pass | |
| 12 | Company Registration | Mobile | ✅ Pass | |
| 13 | Customer Registration | Mobile | ✅ Pass | |
| 14 | Login | Mobile | ✅ Pass | |
| 15 | Protected Navigation | Mobile | ✅ Pass | |
| 16 | Token Persistence | Mobile | ✅ Pass | |
| 17 | Logout | Mobile | ✅ Pass | |
| 18 | Show/Hide Password | Mobile | ✅ Pass | |
| 19 | Forgot Password | Mobile | ✅ Pass | Placeholder |
| 20 | Clickable Logo | Mobile | ✅ Pass | |

### Summary
- **Total Tests**: 20
- **Passed**: 18
- **Failed**: 0
- **Skipped**: 2

### Issues Found
None

### Recommendations
- Configure Google OAuth for full testing
- Implement password reset flow
```

---

## 🎯 Success Criteria

Phase 2 authentication is considered complete when:

- ✅ All 20 manual tests pass on web and mobile
- ✅ API endpoints return correct responses
- ✅ Tokens are stored and managed correctly
- ✅ Protected routes/navigation work as expected
- ✅ Error handling provides clear feedback
- ✅ No console errors during normal operation
- ✅ Documentation is complete and accurate

---

**Testing Status**: ✅ READY FOR TESTING  
**Next Phase**: Phase 3 - User Profiles & Dashboards
