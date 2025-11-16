import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import customerPortalService from '../services/customerPortalService';

const OrderTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getOrderTracking(orderId);
      setTracking(data);
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const statusSteps = [
    { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle' },
    { key: 'processing', label: 'Processing', icon: 'construct' },
    { key: 'shipped', label: 'Shipped', icon: 'airplane' },
    { key: 'delivered', label: 'Delivered', icon: 'home' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c6fff" />
      </View>
    );
  }

  if (!tracking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Tracking information not available</Text>
      </View>
    );
  }

  const currentIndex = statusSteps.findIndex(step => step.key === tracking.current_status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Number */}
        <View style={styles.orderSection}>
          <Text style={styles.orderNumber}>#{tracking.order_number}</Text>
          <View style={[styles.currentStatus, { backgroundColor: getStatusColor(tracking.current_status) }]}>
            <Text style={styles.currentStatusText}>{tracking.current_status}</Text>
          </View>
        </View>

        {/* Tracking Number */}
        {tracking.tracking_number && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="barcode-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tracking Number</Text>
                <Text style={styles.infoValue}>{tracking.tracking_number}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Carrier Info */}
        {tracking.carrier && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Carrier</Text>
                <Text style={styles.infoValue}>{tracking.carrier}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Expected Delivery */}
        {tracking.expected_delivery && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Expected Delivery</Text>
                <Text style={styles.infoValue}>{formatDate(tracking.expected_delivery)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Progress Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <View style={styles.timeline}>
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotActive,
                      isCurrent && styles.timelineDotCurrent
                    ]}>
                      <Ionicons 
                        name={step.icon} 
                        size={20} 
                        color={isCompleted ? '#ffffff' : '#9ca3af'} 
                      />
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineActive
                      ]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      isCompleted && styles.timelineLabelActive
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && tracking.current_status_date && (
                      <Text style={styles.timelineDate}>
                        {formatDate(tracking.current_status_date)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Status History */}
        {tracking.status_history && tracking.status_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status History</Text>
            {tracking.status_history.map((history, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={[styles.historyDot, { backgroundColor: getStatusColor(history.status) }]} />
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyStatus}>{history.status}</Text>
                    <Text style={styles.historyDate}>{formatDate(history.changed_at)}</Text>
                  </View>
                  {history.notes && (
                    <Text style={styles.historyNotes}>{history.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Company Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4c6fff" />
            <Text style={styles.contactButtonText}>Contact {tracking.company_name}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
  },
  orderSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  currentStatus: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  timelineDotActive: {
    backgroundColor: '#4c6fff',
  },
  timelineDotCurrent: {
    backgroundColor: '#10b981',
    transform: [{ scale: 1.1 }],
  },
  timelineLine: {
    width: 3,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  timelineLineActive: {
    backgroundColor: '#4c6fff',
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timelineLabelActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyStatus: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  historyNotes: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4c6fff',
  },
});

export default OrderTrackingScreen;
