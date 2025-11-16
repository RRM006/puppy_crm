import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import customerPortalService from '../services/customerPortalService';

const MyCompaniesScreen = () => {
  const navigation = useNavigation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await customerPortalService.getLinkedCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchCompanies(true);
  };

  const renderCompanyCard = ({ item }) => (
    <TouchableOpacity
      style={styles.companyCard}
      onPress={() => navigation.navigate('CompanyDetail', { companyId: item.id })}
    >
      {/* Company Logo/Avatar */}
      <View style={styles.companyHeader}>
        <View style={styles.companyAvatar}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.logo} />
          ) : (
            <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
          )}
        </View>
        
        <View style={styles.companyInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.companyName}>{item.name}</Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            )}
          </View>
          
          {item.industry && (
            <Text style={styles.companyIndustry}>{item.industry}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="receipt-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.order_count || 0} orders</Text>
        </View>
        
        {item.account_manager_name && (
          <View style={styles.statItem}>
            <Ionicons name="person-outline" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.account_manager_name}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyOrders', { companyId: item.id })}
        >
          <Ionicons name="list-outline" size={16} color="#4c6fff" />
          <Text style={styles.actionText}>View Orders</Text>
        </TouchableOpacity>
        
        {item.contact_email && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {/* Handle contact */}}
          >
            <Ionicons name="mail-outline" size={16} color="#4c6fff" />
            <Text style={styles.actionText}>Contact</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Companies</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LinkCompany')}>
          <Ionicons name="add-circle-outline" size={24} color="#4c6fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4c6fff" />
        </View>
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCompanyCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4c6fff']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No linked companies</Text>
              <Text style={styles.emptySubtext}>Connect with companies to place orders</Text>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => navigation.navigate('LinkCompany')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                <Text style={styles.linkButtonText}>Link Company</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
  },
  companyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  companyInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  companyIndustry: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4c6fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4c6fff',
    borderRadius: 12,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MyCompaniesScreen;
