import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import orderService from '../services/orderService';

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = () => {
    navigation.navigate('UpdateOrderStatus', { orderId, currentStatus: order.status });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.updateOrderStatus(orderId, {
                status: 'cancelled',
                notes: 'Cancelled via mobile',
              });
              fetchOrderDetails();
              Alert.alert('Success', 'Order cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
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
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c6fff" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditOrder', { orderId })}>
          <Ionicons name="create-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Number & Status */}
        <View style={styles.section}>
          <View style={styles.orderHeaderSection}>
            <Text style={styles.orderNumber}>#{order.order_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>

        {/* Customer Info */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => navigation.navigate('CustomerDetail', { customerId: order.customer })}
        >
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>
                {order.customer_name?.charAt(0)}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customer_name}</Text>
              <Text style={styles.customerEmail}>{order.customer_email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemDetails}>
                  Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total_price)}</Text>
            </View>
          ))}
        </View>

        {/* Total Breakdown */}
        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: '#10b981' }]}>
                -{formatCurrency(order.discount_amount)}
              </Text>
            </View>
          )}
          {order.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.tax_amount)}</Text>
            </View>
          )}
          {order.shipping_cost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.shipping_cost)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.total_amount)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {order.delivery_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>{order.delivery_address.street}</Text>
            <Text style={styles.addressText}>
              {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.postal_code}
            </Text>
            <Text style={styles.addressText}>{order.delivery_address.country}</Text>
          </View>
        )}

        {/* Status Timeline */}
        {order.status !== 'cancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.timeline}>
              {statusSteps.map((step, index) => (
                <View key={step} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      index <= currentStepIndex && styles.timelineDotActive
                    ]}>
                      {index < currentStepIndex && (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      )}
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        index < currentStepIndex && styles.timelineLineActive
                      ]} />
                    )}
                  </View>
                  <Text style={[
                    styles.timelineText,
                    index <= currentStepIndex && styles.timelineTextActive
                  ]}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Status History */}
        {order.status_history && order.status_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Log</Text>
            {order.status_history.map((history, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>{history.status}</Text>
                  <Text style={styles.historyDate}>{formatDate(history.changed_at)}</Text>
                  {history.notes && (
                    <Text style={styles.historyNotes}>{history.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpdateStatus}>
            <Ionicons name="sync-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
  },
  orderHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4c6fff',
  },
  addressText: {
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 4,
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
    marginRight: 12,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotActive: {
    backgroundColor: '#4c6fff',
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: '#e5e7eb',
  },
  timelineLineActive: {
    backgroundColor: '#4c6fff',
  },
  timelineText: {
    fontSize: 15,
    color: '#9ca3af',
    paddingVertical: 4,
  },
  timelineTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4c6fff',
    marginTop: 6,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: '#4b5563',
  },
  notesText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4c6fff',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
});

export default OrderDetailScreen;
