import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import customerService from '../services/customerService';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { customerId } = route.params;
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomer(customerId);
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const handleVerify = async () => {
    Alert.alert(
      'Verify Customer',
      'Are you sure you want to verify this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              await customerService.verifyCustomer(customerId, { verified: true, notes: 'Verified via mobile' });
              fetchCustomerDetails();
              Alert.alert('Success', 'Customer verified successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to verify customer');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c6fff" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Customer not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditCustomer', { customerId })}>
          <Ionicons name="create-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Customer Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
            </Text>
          </View>
          
          <Text style={styles.customerName}>{customer.full_name}</Text>
          <Text style={styles.customerEmail}>{customer.email}</Text>
          
          {customer.phone && (
            <View style={styles.phoneContainer}>
              <Ionicons name="call-outline" size={16} color="#6b7280" />
              <Text style={styles.phoneText}>{customer.phone}</Text>
            </View>
          )}

          <View style={styles.badgesRow}>
            <View style={[styles.statusBadge, { backgroundColor: customer.status === 'active' ? '#10b981' : '#6b7280' }]}>
              <Text style={styles.badgeText}>{customer.status}</Text>
            </View>
            {customer.is_verified && (
              <View style={[styles.statusBadge, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>

          {customer.tags && customer.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {customer.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: tag.color + '20' }]}>
                  <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#4c6fff" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Ionicons name="mail" size={20} color="#4c6fff" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('EditCustomer', { customerId })}
          >
            <Ionicons name="create" size={20} color="#4c6fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          {!customer.is_verified && (
            <TouchableOpacity style={styles.actionButton} onPress={handleVerify}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={[styles.actionText, { color: '#10b981' }]}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{customer.total_orders || 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(customer.lifetime_value)}</Text>
            <Text style={styles.statLabel}>Lifetime Value</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{customer.interaction_count || 0}</Text>
            <Text style={styles.statLabel}>Interactions</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              Orders
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'interactions' && styles.activeTab]}
            onPress={() => setActiveTab('interactions')}
          >
            <Text style={[styles.tabText, activeTab === 'interactions' && styles.activeTabText]}>
              Interactions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'orders' && (
            <View style={styles.tabPanel}>
              {customer.recent_orders && customer.recent_orders.length > 0 ? (
                customer.recent_orders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                  >
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderNumber}>#{order.order_number}</Text>
                      <Text style={styles.orderAmount}>{formatCurrency(order.total_amount)}</Text>
                    </View>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    <View style={[styles.orderStatus, { backgroundColor: order.status === 'completed' ? '#10b981' : '#f59e0b' }]}>
                      <Text style={styles.orderStatusText}>{order.status}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No orders yet</Text>
              )}
            </View>
          )}

          {activeTab === 'interactions' && (
            <View style={styles.tabPanel}>
              <Text style={styles.comingSoonText}>Interactions timeline coming soon</Text>
            </View>
          )}

          {activeTab === 'activity' && (
            <View style={styles.tabPanel}>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Customer Since:</Text>
                <Text style={styles.activityValue}>{formatDate(customer.created_at)}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Last Order:</Text>
                <Text style={styles.activityValue}>{formatDate(customer.last_order_date)}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Account Manager:</Text>
                <Text style={styles.activityValue}>{customer.account_manager_name || 'Unassigned'}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Interaction Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddInteraction', { customerId })}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  phoneText: {
    fontSize: 15,
    color: '#6b7280',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4c6fff',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4c6fff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4c6fff',
  },
  tabContent: {
    backgroundColor: '#ffffff',
    minHeight: 200,
  },
  tabPanel: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4c6fff',
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  orderStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 40,
  },
  comingSoonText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 40,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activityLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  activityValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default CustomerDetailScreen;
