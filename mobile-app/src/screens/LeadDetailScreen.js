import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLead, getLeadActivities } from '../services/leadService';

const STATUS_COLORS = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#10b981',
  unqualified: '#ef4444',
  converted: '#06b6d4',
};

export default function LeadDetailScreen({ route, navigation }) {
  const { leadId } = route.params;
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
    loadActivities();
  }, [leadId]);

  const loadLead = async () => {
    try {
      const data = await getLead(leadId);
      setLead(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await getLeadActivities(leadId);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleCall = () => {
    if (lead?.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c6fff" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lead not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[lead.status] || '#64748b';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddLead', { lead })}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color="#4c6fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Lead Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.leadName}>
              {lead.first_name} {lead.last_name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {lead.status}
              </Text>
            </View>
          </View>
          {lead.company_name && (
            <Text style={styles.companyName}>{lead.company_name}</Text>
          )}
          {lead.job_title && (
            <Text style={styles.jobTitle}>{lead.job_title}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
            onPress={handleCall}
            disabled={!lead.phone}
          >
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
            onPress={handleEmail}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => {
              Alert.alert('Convert', 'Convert to deal functionality');
            }}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Convert</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Information
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
            onPress={() => setActiveTab('activities')}
          >
            <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
              Activities ({activities.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color="#64748b" />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{lead.email}</Text>
              </View>
              {lead.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color="#64748b" />
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{lead.phone}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lead Details</Text>
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={18} color="#64748b" />
                <Text style={styles.infoLabel}>Source</Text>
                <Text style={styles.infoValue}>{lead.lead_source || '-'}</Text>
              </View>
              {lead.estimated_value && (
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={18} color="#64748b" />
                  <Text style={styles.infoLabel}>Est. Value</Text>
                  <Text style={styles.infoValue}>
                    ${Number(lead.estimated_value).toLocaleString()}
                  </Text>
                </View>
              )}
              {lead.assigned_to && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#64748b" />
                  <Text style={styles.infoLabel}>Assigned To</Text>
                  <Text style={styles.infoValue}>
                    {lead.assigned_to.first_name} {lead.assigned_to.last_name}
                  </Text>
                </View>
              )}
            </View>

            {lead.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{lead.notes}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'activities' && (
          <View style={styles.tabContent}>
            {activities.length === 0 ? (
              <View style={styles.emptyActivities}>
                <Ionicons name="time-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No activities yet</Text>
              </View>
            ) : (
              activities.map(activity => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={styles.activityIcon}>
                      <Ionicons name="checkmark-circle" size={20} color="#4c6fff" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.subject}</Text>
                      <Text style={styles.activityDescription}>
                        {activity.description}
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Date(activity.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  companyName: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4c6fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  emptyActivities: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  activityDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
