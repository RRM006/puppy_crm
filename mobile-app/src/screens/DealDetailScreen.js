import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getDeal, updateDeal, moveDealStage, closeDeal, getDealActivities } from '../services/dealService';
import { getPipelines } from '../services/pipelineService';
import { useAuth } from '../contexts/AuthContext';

export default function DealDetailScreen({ route, navigation }) {
  const { dealId } = route.params;
  const { company } = useAuth();
  const [deal, setDeal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [pipelines, setPipelines] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [closeStatus, setCloseStatus] = useState('won');
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    loadDeal();
    loadActivities();
    loadPipelines();
  }, [dealId]);

  const loadDeal = async () => {
    try {
      const data = await getDeal(dealId);
      setDeal(data);
      setSelectedStage(data.stage?.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await getDealActivities(dealId);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const loadPipelines = async () => {
    try {
      const data = await getPipelines(company?.id);
      setPipelines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  };

  const handleMoveStage = async () => {
    if (!selectedStage || selectedStage === deal.stage?.id) {
      setShowMoveModal(false);
      return;
    }
    try {
      await moveDealStage(dealId, selectedStage);
      Alert.alert('Success', 'Deal moved successfully');
      setShowMoveModal(false);
      loadDeal();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to move deal');
    }
  };

  const handleCloseDeal = async () => {
    try {
      await closeDeal(dealId, closeStatus, closeReason);
      Alert.alert('Success', `Deal ${closeStatus} successfully`);
      setShowCloseModal(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to close deal');
    }
  };

  const getStages = () => {
    const pipeline = pipelines.find(p => p.id === deal?.pipeline?.id);
    return pipeline?.stages || [];
  };

  const formatDate = (dateString) => {
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

  if (!deal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Deal not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddDeal', { dealId })}>
          <Ionicons name="create-outline" size={24} color="#4c6fff" />
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
            Activities
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'info' ? (
          <>
            {/* Deal Info */}
            <View style={styles.card}>
              <Text style={styles.dealTitle}>{deal.title}</Text>
              <Text style={styles.dealValue}>${Number(deal.value).toLocaleString()}</Text>
              {deal.customer_name && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#64748b" />
                  <Text style={styles.infoText}>{deal.customer_name}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="flag-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>{deal.stage?.name || 'No stage'}</Text>
                <Text style={styles.probability}>({deal.stage?.probability || 0}%)</Text>
              </View>
              {deal.expected_close_date && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  <Text style={styles.infoText}>Expected: {formatDate(deal.expected_close_date)}</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsCard}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowMoveModal(true)}>
                <Ionicons name="swap-horizontal" size={20} color="#4c6fff" />
                <Text style={styles.actionButtonText}>Move Stage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.closeButton]}
                onPress={() => setShowCloseModal(true)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={[styles.actionButtonText, styles.closeButtonText]}>Close Deal</Text>
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Details</Text>
              {deal.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{deal.description}</Text>
                </View>
              )}
              {deal.assigned_to && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned To</Text>
                  <Text style={styles.detailValue}>
                    {deal.assigned_to.first_name} {deal.assigned_to.last_name}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{formatDate(deal.created_at)}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="newspaper-outline" size={16} color="#4c6fff" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.description}</Text>
                    <Text style={styles.activityDate}>{formatDate(activity.created_at)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noActivities}>No activities yet</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Move Stage Modal */}
      <Modal visible={showMoveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move Deal</Text>
            <Picker
              selectedValue={selectedStage}
              onValueChange={setSelectedStage}
              style={styles.picker}
            >
              {getStages().map(stage => (
                <Picker.Item key={stage.id} label={stage.name} value={stage.id} />
              ))}
            </Picker>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowMoveModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleMoveStage}>
                <Text style={styles.modalConfirmText}>Move</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Close Deal Modal */}
      <Modal visible={showCloseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Close Deal</Text>
            <Text style={styles.label}>Status</Text>
            <Picker
              selectedValue={closeStatus}
              onValueChange={setCloseStatus}
              style={styles.picker}
            >
              <Picker.Item label="Won" value="won" />
              <Picker.Item label="Lost" value="lost" />
            </Picker>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCloseModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleCloseDeal}>
                <Text style={styles.modalConfirmText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#64748b' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4c6fff' },
  tabText: { fontSize: 15, color: '#64748b' },
  activeTabText: { color: '#4c6fff', fontWeight: '600' },
  content: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  dealTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  dealValue: { fontSize: 32, fontWeight: '700', color: '#10b981', marginVertical: 8 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  infoText: { fontSize: 15, color: '#0f172a', flex: 1 },
  probability: { fontSize: 14, color: '#8b5cf6', fontWeight: '600' },
  actionsCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4c6fff',
  },
  closeButton: { borderColor: '#10b981' },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#4c6fff' },
  closeButtonText: { color: '#10b981' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 16 },
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#0f172a' },
  activityItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: '#0f172a', marginBottom: 4 },
  activityDate: { fontSize: 12, color: '#64748b' },
  noActivities: { fontSize: 15, color: '#64748b', textAlign: 'center', paddingVertical: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  picker: { marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4c6fff',
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
