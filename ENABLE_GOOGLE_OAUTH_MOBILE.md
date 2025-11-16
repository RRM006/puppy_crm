# Enable Google OAuth for Mobile App

## Current Status
Google Sign-In buttons are **temporarily disabled** in the mobile app (both Login and Signup screens) until proper configuration is completed.

## Why Disabled?
Google Sign-In for mobile requires additional platform-specific configuration that differs from web:
- Android requires SHA-1 certificate fingerprints
- iOS requires URL schemes and bundle identifiers
- Both require Google Cloud Console OAuth client configuration

## Prerequisites

Before enabling Google Sign-In on mobile, ensure:
1. ✅ Backend Google OAuth is configured (already done in Phase 2.3)
2. ✅ Google Cloud Console project exists
3. ✅ Web OAuth credentials are working (can test on web version)

## Step-by-Step Configuration

### Step 1: Google Cloud Console Setup

#### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

#### 1.2 Select Your Project
Select the project: **Puppy CRM** (or your project name)

#### 1.3 Navigate to OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**
- Verify configuration is complete
- Make sure test users are added (for testing phase)

### Step 2: Configure Android OAuth Client

#### 2.1 Get Android SHA-1 Certificate Fingerprint

**For Development (Debug):**
```powershell
# Navigate to your Android SDK tools (usually in AppData\Local\Android\Sdk)
cd %USERPROFILE%\AppData\Local\Android\Sdk\tools

# Or use keytool from JDK
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-1** fingerprint (looks like: `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD`)

**For Production (Release):**
```powershell
# Use your release keystore
keytool -list -v -keystore path\to\your\release.keystore -alias your-key-alias
```

#### 2.2 Create Android OAuth Client in Google Cloud Console

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Android** as application type
4. Fill in:
   - **Name**: Puppy CRM Android App
   - **Package name**: `com.yourcompany.puppycrm` (check `app.json` in mobile-app)
   - **SHA-1 certificate fingerprint**: (paste the SHA-1 from step 2.1)
5. Click **Create**
6. **Save the Client ID** (you'll need it later)

### Step 3: Configure iOS OAuth Client

#### 3.1 Get iOS Bundle Identifier

Check your `app.json` in mobile-app folder:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.puppycrm"
    }
  }
}
```

#### 3.2 Create iOS OAuth Client in Google Cloud Console

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **iOS** as application type
4. Fill in:
   - **Name**: Puppy CRM iOS App
   - **Bundle ID**: (from step 3.1, e.g., `com.yourcompany.puppycrm`)
5. Click **Create**
6. **Save the Client ID** (you'll need it later)

#### 3.3 Add URL Scheme

1. In the iOS OAuth client details, copy the **iOS URL scheme**
2. It looks like: `com.googleusercontent.apps.YOUR-CLIENT-ID`
3. You'll add this to `app.json` later

### Step 4: Configure React Native Google Sign-In

#### 4.1 Update app.json

Add Google Sign-In configuration to your `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "mobile-app",
    "slug": "mobile-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.puppycrm",
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "googleSignIn": {
          "reservedClientId": "YOUR-IOS-CLIENT-ID.apps.googleusercontent.com"
        }
      }
    },
    "android": {
      "package": "com.yourcompany.puppycrm",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

#### 4.2 Initialize Google Sign-In

Create or update `mobile-app/src/config/googleSignIn.js`:

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // iOS client ID (from Google Cloud Console - iOS OAuth Client)
    iosClientId: 'YOUR-IOS-CLIENT-ID.apps.googleusercontent.com',
    
    // Web client ID (from Google Cloud Console - Web OAuth Client)
    // This is used for backend verification
    webClientId: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com',
    
    // Offline access to get refresh token
    offlineAccess: true,
    
    // Request user's email and profile
    scopes: ['profile', 'email'],
  });
};
```

#### 4.3 Call Configuration on App Start

Update `mobile-app/App.js`:

```javascript
import { configureGoogleSignIn } from './src/config/googleSignIn';

export default function App() {
  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();
  }, []);

  // ... rest of your App code
}
```

### Step 5: Update Login Screen

#### 5.1 Uncomment Google Login Button

In `mobile-app/src/screens/LoginScreen.js`, find and uncomment:

```javascript
// Around line 230-250
// Remove the /* */ comment markers from:

<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>OR</Text>
  <View style={styles.dividerLine} />
</View>

<TouchableOpacity
  style={styles.googleButton}
  onPress={handleGoogleLogin}
  disabled={loading}
>
  <Ionicons name="logo-google" size={20} color="#DB4437" />
  <Text style={styles.googleButtonText}>Login with Google</Text>
</TouchableOpacity>
```

#### 5.2 Implement handleGoogleLogin Function

Replace the placeholder with actual implementation:

```javascript
// In LoginScreen.js, replace handleGoogleLogin function

import { GoogleSignin } from '@react-native-google-signin/google-signin';

const handleGoogleLogin = async () => {
  try {
    setLoading(true);

    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices();

    // Get user info from Google
    const userInfo = await GoogleSignin.signIn();

    // Get the ID token
    const { idToken } = userInfo;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Call your backend API
    const result = await googleLogin(idToken);

    // Success - navigate based on account type
    if (result.user.account_type === 'company') {
      navigation.replace('CompanyDashboard');
    } else if (result.user.account_type === 'customer') {
      navigation.replace('CustomerDashboard');
    } else {
      navigation.replace('Landing');
    }
  } catch (error) {
    console.error('Google login error:', error);

    let errorMessage = 'Google Sign-In failed. Please try again.';

    if (error.code === 'SIGN_IN_CANCELLED') {
      errorMessage = 'Sign in was cancelled';
    } else if (error.code === 'IN_PROGRESS') {
      errorMessage = 'Sign in already in progress';
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      errorMessage = 'Google Play Services not available';
    } else if (error.detail) {
      if (error.detail.includes('not found')) {
        errorMessage = 'No account found. Please sign up first.';
      } else {
        errorMessage = error.detail;
      }
    }

    Alert.alert('Login Failed', errorMessage);
  } finally {
    setLoading(false);
  }
};
```

### Step 6: Update Signup Screen

#### 6.1 Uncomment Google Signup Button

In `mobile-app/src/screens/SignupScreen.js`, find and uncomment:

```javascript
// Around line 520-540
// Remove the /* */ comment markers from:

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
```

#### 6.2 Implement handleGoogleSignup Function

Replace the placeholder with actual implementation:

```javascript
// In SignupScreen.js, replace handleGoogleSignup function

import { GoogleSignin } from '@react-native-google-signin/google-signin';

const handleGoogleSignup = async () => {
  try {
    // For company accounts, ensure company name is provided
    if (accountType === 'company' && !formData.company_name) {
      Alert.alert(
        'Company Name Required',
        'Please enter your company name before signing up with Google.'
      );
      return;
    }

    setLoading(true);

    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices();

    // Get user info from Google
    const userInfo = await GoogleSignin.signIn();

    // Get the ID token
    const { idToken } = userInfo;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Prepare additional data
    const additionalData = {};
    
    if (accountType === 'company') {
      additionalData.company_name = formData.company_name;
      additionalData.phone = formData.phone;
      additionalData.employee_count = parseInt(formData.employee_count) || 0;
    } else {
      additionalData.phone = formData.phone;
      additionalData.address = formData.address;
    }

    // Call your backend API
    const result = await googleSignup(idToken, accountType, additionalData);

    // Success - navigate based on account type
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
    console.error('Google signup error:', error);

    let errorMessage = 'Google Sign-Up failed. Please try again.';

    if (error.code === 'SIGN_IN_CANCELLED') {
      errorMessage = 'Sign up was cancelled';
    } else if (error.code === 'IN_PROGRESS') {
      errorMessage = 'Sign up already in progress';
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      errorMessage = 'Google Play Services not available';
    } else if (error.detail) {
      errorMessage = error.detail;
    }

    Alert.alert('Signup Failed', errorMessage);
  } finally {
    setLoading(false);
  }
};
```

### Step 7: Testing

#### 7.1 Rebuild the App

After making these changes, rebuild the app:

```powershell
cd mobile-app

# Clear cache
npm start --clear

# Or rebuild for specific platform
npx expo run:ios      # For iOS
npx expo run:android  # For Android
```

#### 7.2 Test Google Sign-In Flow

**On Android:**
1. Open app on Android emulator or device
2. Navigate to Login or Signup screen
3. Tap "Login with Google" or "Sign up with Google"
4. Select Google account
5. Grant permissions
6. Should navigate to appropriate dashboard

**On iOS:**
1. Open app on iOS simulator or device
2. Navigate to Login or Signup screen
3. Tap "Login with Google" or "Sign up with Google"
4. Sign in with Google
5. Grant permissions
6. Should navigate to appropriate dashboard

#### 7.3 Verify Backend

Check Django server logs to ensure:
- Google token is being verified
- User is created/logged in
- JWT tokens are returned

## Troubleshooting

### Android Issues

**"DEVELOPER_ERROR" or "Sign-in failed"**
- Check SHA-1 fingerprint is correct in Google Cloud Console
- Verify package name matches exactly
- Wait 5-10 minutes after adding credentials
- Try clearing cache: `npm start --clear`

**"Google Play Services not available"**
- Update Google Play Services on emulator/device
- Use a device/emulator with Google Play (not AOSP)

### iOS Issues

**"Unable to configure Google Sign-In"**
- Check iOS client ID is correct in `googleSignIn.js`
- Verify bundle identifier matches Google Cloud Console
- Check URL scheme is added to `app.json`

**"The operation couldn't be completed"**
- Rebuild the app after config changes
- Check iOS client ID is correct
- Verify GoogleService-Info.plist is included

### General Issues

**"User not found" error on login**
- User needs to sign up first
- Redirect them to Signup screen
- Or implement auto-registration on first login

**"Invalid token" error**
- Check web client ID in `googleSignIn.js` matches backend
- Verify backend Google OAuth is configured correctly
- Check token expiration (tokens expire after 1 hour)

**Backend still shows 403 error**
- This is likely from web version (different configuration)
- Mobile uses native Google Sign-In (different flow)
- Check backend `settings.py` has correct GOOGLE_CLIENT_ID

## Quick Reference

### Required Client IDs

You need **THREE** OAuth client IDs from Google Cloud Console:

1. **Web Client ID** (for backend verification)
   - Used in: `googleSignIn.js` → `webClientId`
   - Used in: `backend/config/.env` → `GOOGLE_CLIENT_ID`

2. **iOS Client ID** (for iOS app)
   - Used in: `googleSignIn.js` → `iosClientId`
   - Used in: `app.json` → `ios.config.googleSignIn.reservedClientId`

3. **Android OAuth Client** (automatically used)
   - Created with SHA-1 fingerprint
   - No need to copy client ID (automatically detected by package name + SHA-1)

### Configuration Checklist

- [ ] Web OAuth client created (already done for web version)
- [ ] Android OAuth client created with SHA-1 fingerprint
- [ ] iOS OAuth client created with bundle identifier
- [ ] `app.json` updated with iOS URL scheme
- [ ] `googleSignIn.js` created with correct client IDs
- [ ] `App.js` calls `configureGoogleSignIn()` on start
- [ ] LoginScreen.js Google button uncommented
- [ ] SignupScreen.js Google button uncommented
- [ ] handleGoogleLogin implemented in LoginScreen
- [ ] handleGoogleSignup implemented in SignupScreen
- [ ] App rebuilt with `npm start --clear`
- [ ] Tested on Android
- [ ] Tested on iOS

## Summary

1. ✅ Get SHA-1 fingerprint for Android
2. ✅ Create Android OAuth client in Google Cloud Console
3. ✅ Create iOS OAuth client in Google Cloud Console
4. ✅ Update `app.json` with client IDs and URL scheme
5. ✅ Create `googleSignIn.js` config file
6. ✅ Call config in `App.js`
7. ✅ Uncomment Google buttons in Login and Signup screens
8. ✅ Implement `handleGoogleLogin` and `handleGoogleSignup` functions
9. ✅ Rebuild and test on both platforms

**Need Help?**
- Google Sign-In Documentation: https://github.com/react-native-google-signin/google-signin
- Google Cloud Console: https://console.cloud.google.com/
- Expo Google Sign-In Guide: https://docs.expo.dev/guides/google-authentication/

---

**Note:** This is a simplified guide. For production apps, you should also implement proper error handling, token refresh, and user experience improvements.
