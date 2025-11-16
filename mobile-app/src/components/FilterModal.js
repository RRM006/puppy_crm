import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { getCompanyTeam } from '../services/companyService';
import { getPipelines } from '../services/pipelineService';

const LEAD_SOURCES = [
  { label: 'All Sources', value: '' },
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Event', value: 'event' },
  { label: 'Other', value: 'other' },
];

const LEAD_STATUS = [
  { label: 'All Statuses', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Unqualified', value: 'unqualified' },
];

const DEAL_STATUS = [
  { label: 'All Statuses', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

export default function FilterModal({ visible, onClose, onApply, type = 'leads' }) {
  const { company } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    lead_source: '',
    assigned_to: '',
    pipeline_id: '',
    stage_id: '',
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [pipelines, setPipelines] = useState([]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const teamData = await getCompanyTeam();
      setTeamMembers(teamData?.team_members || []);
      
      if (type === 'deals') {
        const pipelineData = await getPipelines(company?.id);
        setPipelines(Array.isArray(pipelineData) ? pipelineData : []);
      }
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  };

  const handleApply = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    );
    onApply(activeFilters);
  };

  const handleClear = () => {
    setFilters({
      status: '',
      lead_source: '',
      assigned_to: '',
      pipeline_id: '',
      stage_id: '',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.status}
                  onValueChange={val => setFilters(prev => ({ ...prev, status: val }))}
                  style={styles.picker}
                >
                  {(type === 'leads' ? LEAD_STATUS : DEAL_STATUS).map(item => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Lead Source (Leads only) */}
            {type === 'leads' && (
              <View style={styles.filterGroup}>
                <Text style={styles.label}>Lead Source</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filters.lead_source}
                    onValueChange={val => setFilters(prev => ({ ...prev, lead_source: val }))}
                    style={styles.picker}
                  >
                    {LEAD_SOURCES.map(item => (
                      <Picker.Item key={item.value} label={item.label} value={item.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Pipeline (Deals only) */}
            {type === 'deals' && (
              <View style={styles.filterGroup}>
                <Text style={styles.label}>Pipeline</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filters.pipeline_id}
                    onValueChange={val => setFilters(prev => ({ ...prev, pipeline_id: val }))}
                    style={styles.picker}
                  >
                    <Picker.Item label="All Pipelines" value="" />
                    {pipelines.map(pipeline => (
                      <Picker.Item
                        key={pipeline.id}
                        label={pipeline.name}
                        value={pipeline.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Assigned To */}
            <View style={styles.filterGroup}>
              <Text style={styles.label}>Assigned To</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.assigned_to}
                  onValueChange={val => setFilters(prev => ({ ...prev, assigned_to: val }))}
                  style={styles.picker}
                >
                  <Picker.Item label="All Team Members" value="" />
                  {teamMembers.map(member => (
                    <Picker.Item
                      key={member.user_id}
                      label={`${member.first_name} ${member.last_name}`}
                      value={member.user_id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4c6fff',
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
