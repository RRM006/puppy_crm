# How to Enable Google OAuth Login/Signup

## 🔒 Current Status
Google OAuth is **temporarily disabled** to avoid 403 console errors. Only email/password authentication is active.

---

## ✅ Steps to Enable Google OAuth

### Step 1: Update Google Cloud Console Settings

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Find your OAuth 2.0 Client ID**
   - Look for: `324860582148-cbt87g1gg0qmf913n8uv46vjlq1hqqiq.apps.googleusercontent.com`
   - Click the **pencil icon (Edit)** next to it

3. **Add Authorized JavaScript origins**
   
   Under "Authorized JavaScript origins", click **+ ADD URI** and add these URLs:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:3000
   ```
   
   **Note:** Add all three to support different port configurations.

4. **Add Authorized redirect URIs**
   
   Under "Authorized redirect URIs", click **+ ADD URI** and add these URLs:
   ```
   http://localhost:5173/auth/google/callback
   http://localhost:5174/auth/google/callback
   http://localhost:3000/auth/google/callback
   ```

5. **Save Changes**
   - Click the **"SAVE"** button at the bottom
   - ⏱️ **Wait 5-10 minutes** for changes to propagate through Google's servers

---

### Step 2: Uncomment Google OAuth Buttons in Code

#### File 1: `frontend-web/src/pages/Login.jsx`

**Find this commented section (around line 232):**
```jsx
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
```

**Replace with:**
```jsx
{/* Google Login Button */}
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
```

---

#### File 2: `frontend-web/src/pages/Signup.jsx`

**Find this commented section (around line 488):**
```jsx
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
```

**Replace with:**
```jsx
{/* Google Signup Button */}
<div className="google-signup-wrapper">
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => setApiError('Google signup failed. Please try again.')}
    text="signup_with"
    size="large"
  />
</div>
```

---

### Step 3: Verify It Works

1. **Save both files** (Login.jsx and Signup.jsx)

2. **The frontend will auto-reload** (Vite hot reload)

3. **Test Google OAuth:**
   - Go to: `http://localhost:5174/login`
   - You should see the "Sign in with Google" button
   - Click it and sign in with your Google account
   - Should work without 403 errors ✅

4. **Check Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Should be clean, no 403 errors ✅

---

## 🔍 Troubleshooting

### Still seeing 403 errors?
**Wait longer** - Google changes can take up to 10-15 minutes to propagate.

### Button appears but nothing happens when clicked?
1. Check browser console for errors
2. Verify you added the correct URLs in Google Console
3. Make sure URLs are **exact** (including `http://` not `https://`)
4. Try clearing browser cache and cookies

### "redirect_uri_mismatch" error?
Double-check that redirect URIs in Google Console match exactly:
```
http://localhost:5174/auth/google/callback
```

### Backend error "User not found" when using Google login?
This is expected if you haven't created an account yet. You need to:
1. First use **Google Signup** (signup page)
2. Then you can use **Google Login** (login page)

---

## 📝 Quick Copy-Paste Guide

### URLs to add in Google Cloud Console:

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:5174
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:5173/auth/google/callback
http://localhost:5174/auth/google/callback
http://localhost:3000/auth/google/callback
```

---

## 🎯 Summary

**Before:**
- ❌ Google OAuth disabled
- ❌ 403 errors in console
- ✅ Email/password login works

**After (following this guide):**
- ✅ Google OAuth enabled
- ✅ No console errors
- ✅ Both Google and email/password login work

---

## 🔐 Security Note

Google OAuth requires explicit whitelisting of origins for security. This prevents unauthorized websites from using your OAuth credentials. Always keep this list updated with only the domains you control.

---

**Last Updated:** November 14, 2025  
**Status:** Instructions ready to follow
