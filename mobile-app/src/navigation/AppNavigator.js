import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CompanyDashboardScreen from '../screens/CompanyDashboardScreen';
import CustomerDashboardScreen from '../screens/CustomerDashboardScreen';
import CompanyProfileScreen from '../screens/CompanyProfileScreen';
import CustomerProfileScreen from '../screens/CustomerProfileScreen';
import InviteTeamScreen from '../screens/InviteTeamScreen';
import LinkCompanyScreen from '../screens/LinkCompanyScreen';

const Stack = createNativeStackNavigator();

// Auth Stack - Screens for non-authenticated users
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Landing" 
      component={LandingScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ title: 'Login' }}
    />
    <Stack.Screen 
      name="Signup" 
      component={SignupScreen}
      options={{ title: 'Sign Up' }}
    />
  </Stack.Navigator>
);

// Main Stack - Screens for authenticated users
// Email-related screens (lazy import to avoid circulars)
import EmailInboxScreen from '../screens/EmailInboxScreen';
import EmailThreadScreen from '../screens/EmailThreadScreen';
import ComposeEmailScreen from '../screens/ComposeEmailScreen';
import EmailAccountsScreen from '../screens/EmailAccountsScreen';

const Drawer = createDrawerNavigator();

const EmailDrawer = () => (
  <Drawer.Navigator screenOptions={{ headerShown: false }}>
    <Drawer.Screen name="Inbox" component={EmailInboxScreen} />
    <Drawer.Screen name="Sent" component={EmailInboxScreen} initialParams={{ folder: 'sent' }} />
    <Drawer.Screen name="Starred" component={EmailInboxScreen} initialParams={{ folder: 'starred' }} />
    <Drawer.Screen name="Drafts" component={EmailInboxScreen} initialParams={{ folder: 'drafts' }} />
    <Drawer.Screen name="Categories" component={EmailInboxScreen} initialParams={{ showCategories: true }} />
    <Drawer.Screen name="Templates" component={EmailInboxScreen} initialParams={{ showTemplates: true }} />
    <Drawer.Screen name="Accounts" component={EmailAccountsScreen} />
    <Drawer.Screen name="Settings" component={CompanyProfileScreen} />
  </Drawer.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={CompanyDashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EmailDrawer" component={EmailDrawer} options={{ headerShown: false }} />
    <Stack.Screen name="EmailThread" component={EmailThreadScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ComposeEmail" component={ComposeEmailScreen} options={{ presentation: 'modal', title: 'Compose' }} />
    <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CustomerDashboard" component={CustomerDashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="InviteTeam" component={InviteTeamScreen} options={{ headerShown: false }} />
    <Stack.Screen name="LinkCompany" component={LinkCompanyScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#667eea" />
  </View>
);

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <NavigationContainer>
      {loading ? (
        <LoadingScreen />
      ) : isAuthenticated ? (
        <MainStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
