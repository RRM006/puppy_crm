# Issues Fixed - CORS & Google OAuth

## ✅ Issues Resolved

### 1. CORS Error - "No 'Access-Control-Allow-Origin' header"

**Problem:**
```
Access to fetch at 'http://localhost:8000/api/auth/register/company/' 
from origin 'http://localhost:5174' has been blocked by CORS policy
```

**Root Cause:**
Django CORS settings only allowed ports 3000 and 19006, but Vite frontend was running on port 5174.

**Fix Applied:**
Updated `backend/config/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',  # Vite default
    'http://localhost:5174',  # Vite alternate port
    'http://localhost:19006',  # Expo
]

CORS_ALLOW_CREDENTIALS = True
```

---

### 2. Google OAuth Button Width Error

**Problem:**
```
[GSI_LOGGER]: Provided button width is invalid: 100%
```

**Root Cause:**
Google OAuth button doesn't accept percentage width values. The `width="100%"` prop is invalid.

**Fix Applied:**
Removed `width="100%"` prop from:
- `frontend-web/src/pages/Signup.jsx`
- `frontend-web/src/pages/Login.jsx`

Now uses CSS styling instead:
```jsx
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={() => setApiError('Error message')}
  text="signup_with"
  size="large"
  // width prop removed - uses CSS instead
/>
```

---

### 3. Google OAuth Origin Error

**Problem:**
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
Failed to load resource: 403
```

**Root Cause:**
Google OAuth client is configured for `http://localhost:3000` but frontend is on `http://localhost:5174`.

**Fix Required in Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Edit "Authorized JavaScript origins"
4. Add:
   - `http://localhost:5173`
   - `http://localhost:5174`
5. Edit "Authorized redirect URIs"
6. Add:
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5174/auth/google/callback`
7. Save changes

**Note:** Google OAuth changes take 5-10 minutes to propagate.

---

## 🧪 Testing After Fixes

### Backend Status:
✅ Django running on `http://127.0.0.1:8000/`
✅ CORS configured for ports 5173 and 5174
✅ Auto-reloaded with new settings

### Frontend Status:
✅ Vite running on `http://localhost:5174/`
✅ Google button width error fixed
✅ CORS error should be resolved

### Test Now:

1. **Test Regular Signup:**
   ```
   http://localhost:5174/signup
   - Fill form
   - Click "Create Account"
   - Should work without CORS error ✅
   ```

2. **Test Google OAuth:**
   ```
   - Click "Continue with Google"
   - May still show 403 until Google Cloud settings updated
   - Update Google Cloud Console (instructions above)
   - Wait 5-10 minutes
   - Try again
   ```

3. **Verify in Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Google button width warning: GONE ✅
   - CORS error: GONE ✅
   - 403 error: Will disappear after Google Cloud update

---

## 📝 What Changed

### Files Modified:
1. `backend/config/settings.py`
   - Added ports 5173, 5174 to CORS_ALLOWED_ORIGINS
   - Added CORS_ALLOW_CREDENTIALS = True

2. `frontend-web/src/pages/Signup.jsx`
   - Removed invalid `width="100%"` from GoogleLogin

3. `frontend-web/src/pages/Login.jsx`
   - Removed invalid `width="100%"` from GoogleLogin

### Backend Status:
✅ Server restarted automatically (detected file changes)
✅ New CORS settings active

---

## 🎯 Next Steps

1. **Try signup now** - Regular signup should work immediately
2. **Update Google Cloud Console** - Follow instructions above for Google OAuth
3. **Wait 5-10 minutes** - For Google changes to propagate
4. **Test Google OAuth** - Should work after propagation

---

## ⚠️ Common Issues

### If CORS still not working:
- Hard refresh browser: `Ctrl + Shift + R`
- Clear browser cache
- Check backend console for CORS logs

### If Google OAuth still shows 403:
- Wait 5-10 minutes after Google Cloud Console changes
- Verify exact URLs in Google Console (including http://)
- Clear browser cookies for accounts.google.com

### If signup works but dashboard doesn't load:
- Check browser console for errors
- Verify AuthContext is working
- Check network tab for failed API calls

---

**Fixed:** 2025-11-14 20:27
**Status:** Ready for testing
