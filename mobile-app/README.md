# CRM System Mobile App (Phase 1 Setup)

This is the React Native (Expo) mobile app for the CRM system.

## 1. Project Structure
```
mobile-app/
├── src/
│   ├── components/
│   ├── screens/
│   │   ├── LandingScreen.js
│   │   ├── LoginScreen.js
│   │   └── SignupScreen.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   └── assets/
├── App.js
├── babel.config.js
├── package.json
└── .env
```

## 2. Prerequisites
- Node.js and npm installed
- Expo CLI: `npm install -g expo-cli` (optional, but recommended)
- For iOS: Mac with Xcode, or use Expo Go app
- For Android: Android Studio with emulator, or use Expo Go app

## 3. Install Dependencies
From the repository root:
```powershell
cd mobile-app
npm install
```

## 4. Environment Configuration (.env)

**CRITICAL:** The API URL varies by platform due to how emulators/simulators handle localhost.

Create a `.env` file in `mobile-app/` with the appropriate URL for your platform:

### iOS Simulator / Expo Go (Same Machine)
```
API_URL=http://localhost:8000/api
```

### Android Emulator
```
API_URL=http://10.0.2.2:8000/api
```
**Why?** Android emulator uses `10.0.2.2` as a special alias to your host machine's `localhost`.

### Physical Device (iOS or Android)
```
API_URL=http://YOUR_COMPUTER_IP:8000/api
```
Find your computer's IP address:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`

**Note:** Your computer and device must be on the same network, and your firewall must allow connections on port 8000.

## 5. Run the App

### Start Expo Dev Server
```powershell
npm start
```
or
```powershell
npx expo start
```

This will open Expo DevTools in your browser with a QR code.

### Run on iOS Simulator (Mac only)
```powershell
npm run ios
```

### Run on Android Emulator
Make sure Android emulator is running, then:
```powershell
npm run android
```

### Run on Physical Device
1. Install **Expo Go** app from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the terminal/browser
3. Make sure `.env` has your computer's IP address

## 6. Backend Connection Test

The app automatically tests the backend connection on startup:
- **Green checkmark:** Successfully connected to backend
- **Red X:** Connection failed (check your `.env` URL and ensure backend is running)
- **Loading spinner:** Testing connection...

The connection status appears at the top of the app.

## 7. Available Screens (Phase 1)
- **Landing** — Home screen (placeholder)
- **Login** — Login screen (placeholder)
- **Signup** — Signup screen (placeholder)

Navigation is set up with React Navigation Native Stack.

## 8. Troubleshooting

### Backend Connection Fails
1. Verify backend is running: `cd ../backend && python manage.py runserver`
2. Check `.env` has correct URL for your platform (see section 4)
3. For physical devices: Ensure firewall allows port 8000
4. Try `npx expo start --clear` to clear cache

### "Module not found: @env"
1. Stop Expo: `Ctrl+C`
2. Clear cache: `npx expo start --clear`
3. Restart: `npm start`

### Android Emulator Can't Connect
- Ensure you're using `http://10.0.2.2:8000/api` in `.env`
- Backend must allow connections from `10.0.2.2` (check CORS/ALLOWED_HOSTS)

### Changes Not Appearing
- Save files and wait for hot reload
- If needed: shake device (physical) or press `R` in terminal to reload
- Clear cache: `npx expo start --clear`

## 9. Development Notes

- **Hot Reload:** Changes automatically reload in Expo
- **Debug Menu:** Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- **Backend CORS:** Backend already configured to allow `localhost:19006` (Expo default)

## 10. Next Steps (Future Phases)
- Implement authentication UI with forms
- Add JWT token storage and API interceptors
- Create main dashboard and CRM screens
- Add offline capabilities
- Implement push notifications

---
**Phase 1 Complete!** The mobile app structure is ready with backend connection test and navigation setup.
