import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerProfile, getLinkedCompanies, clearCustomerCache } from '../services/customerService';

const Tab = createBottomTabNavigator();

// Home Tab Component
const HomeTab = ({ navigation }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async (useCache = true) => {
    try {
      const [profileData, companiesData] = await Promise.all([
        getCustomerProfile(useCache),
        getLinkedCompanies(useCache),
      ]);
      setProfile(profileData);
      setCompanies(companiesData.companies || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await clearCustomerCache();
    await loadData(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const verifiedCount = companies.filter(c => c.verified).length;
  const pendingCount = companies.filter(c => !c.verified).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        {profile?.profile_picture_url ? (
          <Image source={{ uri: profile.profile_picture_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={32} color="#667eea" />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.first_name || 'Customer'}!
          </Text>
          <Text style={styles.subtitleText}>
            {profile?.full_name || user?.email}
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <StatCard 
          icon="business" 
          label="Linked Companies" 
          value={companies.length}
          color="#667eea"
        />
        <StatCard 
          icon="checkmark-circle" 
          label="Verified" 
          value={verifiedCount}
          color="#10b981"
        />
        <StatCard 
          icon="time" 
          label="Pending" 
          value={pendingCount}
          color="#f59e0b"
        />
        <StatCard 
          icon="cube" 
          label="Orders" 
          value={0}
          color="#8b5cf6"
        />
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="business"
            label="Link Company"
            onPress={() => navigation.navigate('LinkCompany')}
          />
          <QuickActionButton
            icon="person-circle"
            label="Profile"
            onPress={() => navigation.navigate('CustomerProfile')}
          />
          <QuickActionButton
            icon="calendar"
            label="Calendar"
            onPress={() => {/* TODO: Navigate to calendar */}}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>
            Recent activity will appear here
          </Text>
          <Text style={styles.activitySubtext}>
            This feature will be available in Phase 4
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Quick Action Button
const QuickActionButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <Ionicons name={icon} size={24} color="#667eea" />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Companies Tab Component
const CompaniesTab = ({ navigation }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCompanies = async (useCache = true) => {
    try {
      const data = await getLinkedCompanies(useCache);
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await clearCustomerCache();
    await loadCompanies(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.companiesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
        {companies.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No linked companies yet</Text>
            <Text style={styles.emptySubtext}>Link a company to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LinkCompany')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Company Card Component
const CompanyCard = ({ company }) => (
  <View style={styles.companyCard}>
    {company.company_logo && (
      <Image source={{ uri: company.company_logo }} style={styles.companyLogo} />
    )}
    <View style={styles.companyInfo}>
      <View style={styles.companyHeader}>
        <Text style={styles.companyName}>{company.company_name}</Text>
        <View style={[
          styles.statusBadge,
          company.verified ? styles.statusBadgeVerified : styles.statusBadgePending
        ]}>
          <Text style={[
            styles.statusText,
            company.verified ? styles.statusTextVerified : styles.statusTextPending
          ]}>
            {company.verified ? '✓ Verified' : '⏳ Pending'}
          </Text>
        </View>
      </View>
      {company.company_phone && (
        <Text style={styles.companyDetail}>📞 {company.company_phone}</Text>
      )}
      {(company.company_city || company.company_country) && (
        <Text style={styles.companyDetail}>
          📍 {[company.company_city, company.company_country].filter(Boolean).join(', ')}
        </Text>
      )}
      {company.company_website && (
        <Text style={styles.companyDetail}>🌐 {company.company_website}</Text>
      )}
    </View>
  </View>
);

// Orders Tab Component (Placeholder for Phase 5)
const OrdersTab = () => (
  <View style={styles.centerContainer}>
    <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
    <Text style={styles.placeholderTitle}>Orders</Text>
    <Text style={styles.placeholderText}>
      This feature will be available in Phase 5
    </Text>
  </View>
);

// More Tab Component
const MoreTab = ({ navigation: parentNavigation }) => {
  const navigation = parentNavigation || { navigate: () => {} };
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.moreSection}>
        <Text style={styles.moreSectionTitle}>Account</Text>
        <MoreItem
          icon="person-circle"
          label="Profile"
          onPress={() => navigation.navigate('CustomerProfile')}
        />
        <MoreItem
          icon="settings"
          label="Settings"
          onPress={() => {/* TODO: Navigate to settings */}}
        />
      </View>

      <View style={styles.moreSection}>
        <Text style={styles.moreSectionTitle}>Support</Text>
        <MoreItem
          icon="help-circle"
          label="Help & Support"
          onPress={() => {/* TODO: Navigate to help */}}
        />
      </View>

      <View style={styles.moreSection}>
        <MoreItem
          icon="log-out"
          label="Logout"
          onPress={handleLogout}
          danger
        />
      </View>
    </ScrollView>
  );
};

// More Item Component
const MoreItem = ({ icon, label, onPress, danger = false }) => (
  <TouchableOpacity
    style={styles.moreItem}
    onPress={onPress}
  >
    <Ionicons 
      name={icon} 
      size={24} 
      color={danger ? '#ef4444' : '#1e293b'} 
    />
    <Text style={[styles.moreItemText, danger && styles.moreItemTextDanger]}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
  </TouchableOpacity>
);

// Main Dashboard Component with Tabs
const CustomerDashboardScreen = ({ navigation: parentNavigation }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Companies') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
      })}
    >
      <Tab.Screen 
        name="Home"
        children={(props) => <HomeTab {...props} navigation={parentNavigation} />}
      />
      <Tab.Screen 
        name="Companies"
        children={(props) => <CompaniesTab {...props} navigation={parentNavigation} />}
      />
      <Tab.Screen name="Orders" component={OrdersTab} />
      <Tab.Screen 
        name="More"
        children={(props) => <MoreTab {...props} navigation={parentNavigation} />}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    marginVertical: 16,
  },
  statsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: 140,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 16,
    color: '#1e293b',
  },
  activitySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  companiesList: {
    flex: 1,
  },
  companyCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeVerified: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextVerified: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#92400e',
  },
  companyDetail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  moreSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  moreSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  moreItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  moreItemTextDanger: {
    color: '#ef4444',
  },
});

export default CustomerDashboardScreen;
