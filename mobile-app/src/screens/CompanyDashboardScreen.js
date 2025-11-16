import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
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
import { getCompanyProfile, getCompanyStats, getCompanyTeam, clearCompanyCache } from '../services/companyService';
import PermissionGate from '../components/PermissionGate';
import CompanyProfileScreen from './CompanyProfileScreen';
import InviteTeamScreen from './InviteTeamScreen';

const Tab = createBottomTabNavigator();

// Home Tab Component
const HomeTab = ({ navigation }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async (useCache = true) => {
    try {
      const [profileData, statsData] = await Promise.all([
        getCompanyProfile(useCache),
        getCompanyStats(useCache),
      ]);
      setProfile(profileData);
      setStats(statsData);
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
    await clearCompanyCache();
    await loadData(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        {profile?.logo_url ? (
          <Image source={{ uri: profile.logo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="business" size={32} color="#667eea" />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.companyName}>{profile?.company_name || 'Company'}</Text>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.first_name || 'User'}!
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
          icon="people" 
          label="Team Members" 
          value={stats?.team_count || 0}
          color="#667eea"
        />
        <StatCard 
          icon="briefcase" 
          label="Active Deals" 
          value={stats?.active_deals || 0}
          color="#10b981"
        />
        <StatCard 
          icon="trending-up" 
          label="Total Leads" 
          value={stats?.total_leads || 0}
          color="#f59e0b"
        />
        <StatCard 
          icon="person" 
          label="Customers" 
          value={stats?.total_customers || 0}
          color="#ef4444"
        />
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="person-add"
            label="Invite Team"
            onPress={() => navigation.navigate('InviteTeam')}
          />
          <PermissionGate roles={['ceo', 'manager']}>
            <QuickActionButton
              icon="settings"
              label="Profile"
              onPress={() => navigation.navigate('CompanyProfile')}
            />
          </PermissionGate>
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

// Team Tab Component
const TeamTab = () => {
  const navigation = useNavigation();
  const [team, setTeam] = useState([]);
  const [filteredTeam, setFilteredTeam] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeam = async (useCache = true) => {
    try {
      const params = roleFilter ? { role: roleFilter } : {};
      const data = await getCompanyTeam(params, useCache);
      setTeam(data.team_members || []);
      setFilteredTeam(data.team_members || []);
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [roleFilter]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = team.filter(member => 
        `${member.first_name} ${member.last_name} ${member.email}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredTeam(filtered);
    } else {
      setFilteredTeam(team);
    }
  }, [searchQuery, team]);

  const onRefresh = async () => {
    setRefreshing(true);
    await clearCompanyCache();
    await loadTeam(false);
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
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search team members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <FilterChip 
            label="All" 
            selected={!roleFilter} 
            onPress={() => setRoleFilter('')} 
          />
          <FilterChip 
            label="CEO" 
            selected={roleFilter === 'ceo'} 
            onPress={() => setRoleFilter('ceo')} 
          />
          <FilterChip 
            label="Manager" 
            selected={roleFilter === 'manager'} 
            onPress={() => setRoleFilter('manager')} 
          />
          <FilterChip 
            label="Sales" 
            selected={roleFilter === 'sales_manager'} 
            onPress={() => setRoleFilter('sales_manager')} 
          />
          <FilterChip 
            label="Support" 
            selected={roleFilter === 'support_staff'} 
            onPress={() => setRoleFilter('support_staff')} 
          />
        </ScrollView>
      </View>

      {/* Team List */}
      <ScrollView
        style={styles.teamList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredTeam.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
        {filteredTeam.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <PermissionGate roles={['ceo', 'manager']}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('InviteTeam')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </PermissionGate>
    </View>
  );
};

// Filter Chip Component
const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipSelected]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Team Member Card
const TeamMemberCard = ({ member }) => (
  <View style={styles.memberCard}>
    <View style={styles.memberAvatar}>
      <Text style={styles.memberAvatarText}>
        {member.first_name?.[0] || member.email[0].toUpperCase()}
      </Text>
    </View>
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>
        {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
      </Text>
      <Text style={styles.memberEmail}>{member.email}</Text>
      <View style={styles.memberMeta}>
        <Text style={styles.memberRole}>
          {member.role?.replace('_', ' ').toUpperCase()}
        </Text>
        {member.department && (
          <Text style={styles.memberDepartment}> • {member.department}</Text>
        )}
      </View>
    </View>
    <View style={[styles.memberStatus, member.is_active && styles.memberStatusActive]}>
      <Text style={styles.memberStatusText}>
        {member.is_active ? 'Active' : 'Inactive'}
      </Text>
    </View>
  </View>
);

// Deals Tab Component (Placeholder for Phase 4)
const DealsTab = () => (
  <View style={styles.centerContainer}>
    <Ionicons name="briefcase-outline" size={64} color="#cbd5e1" />
    <Text style={styles.placeholderTitle}>Deals</Text>
    <Text style={styles.placeholderText}>
      This feature will be available in Phase 4
    </Text>
  </View>
);

// More Tab Component
const MoreTab = ({ navigation: parentNavigation, route }) => {
  // Get navigation from parent or use route navigation
  const navigation = parentNavigation || route?.navigation || { navigate: () => {} };
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
          onPress={() => navigation.navigate('CompanyProfile')}
        />
        <MoreItem
          icon="settings"
          label="Settings"
          onPress={() => {/* TODO: Navigate to settings */}}
        />
      </View>

      <View style={styles.moreSection}>
        <Text style={styles.moreSectionTitle}>Tools</Text>
        <MoreItem
          icon="calendar"
          label="Calendar"
          onPress={() => {/* TODO: Navigate to calendar */}}
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
const CompanyDashboardScreen = ({ navigation: parentNavigation }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Deals') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Team') {
            iconName = focused ? 'people' : 'people-outline';
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
      <Tab.Screen name="Deals" component={DealsTab} />
      <Tab.Screen 
        name="Team"
        children={(props) => <TeamTab {...props} navigation={parentNavigation} />}
      />
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
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  welcomeText: {
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1e293b',
  },
  filterContainer: {
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  teamList: {
    flex: 1,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  memberMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  memberRole: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  memberDepartment: {
    fontSize: 12,
    color: '#94a3b8',
  },
  memberStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  memberStatusActive: {
    backgroundColor: '#dcfce7',
  },
  memberStatusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
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

export default CompanyDashboardScreen;
