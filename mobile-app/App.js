import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { healthCheck } from './src/services/api';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

/**
 * IMPORTANT: Configure .env for your platform
 * 
 * iOS Simulator / Expo Go on same machine:
 *   API_URL=http://localhost:8000/api
 * 
 * Android Emulator:
 *   API_URL=http://10.0.2.2:8000/api
 *   (10.0.2.2 is the special alias to your host machine's localhost)
 * 
 * Physical Device:
 *   API_URL=http://YOUR_COMPUTER_IP:8000/api
 *   (Find your IP: ipconfig on Windows, ifconfig on Mac/Linux)
 */

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const result = await healthCheck();
        if (!mounted) return;
        setConnectionStatus('connected');
        setMessage(result?.message || 'Backend is running');
      } catch (error) {
        if (!mounted) return;
        setConnectionStatus('error');
        setMessage(error?.message || 'Failed to connect to backend');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        <View style={styles.statusBar}>
          {connectionStatus === 'checking' && (
            <>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.statusText}>Checking backend...</Text>
            </>
          )}
          {connectionStatus === 'connected' && (
            <Text style={[styles.statusText, styles.success]}>
              ✓ Connected to Backend: {message}
            </Text>
          )}
          {connectionStatus === 'error' && (
            <Text style={[styles.statusText, styles.error]}>
              ✗ Backend connection failed: {message}
            </Text>
          )}
        </View>
        
        <AppNavigator />
        <StatusBar style="auto" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#f44336',
  },
});
