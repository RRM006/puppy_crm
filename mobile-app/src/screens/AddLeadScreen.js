import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { createLead, updateLead } from '../services/leadService';
import { getCompanyTeam } from '../services/companyService';

const LEAD_SOURCES = [
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Event', value: 'event' },
  { label: 'Other', value: 'other' },
];

const STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Unqualified', value: 'unqualified' },
];

export default function AddLeadScreen({ route, navigation }) {
  const { company } = useAuth();
  const existingLead = route.params?.lead;
  const isEdit = !!existingLead;

  const [formData, setFormData] = useState({
    first_name: existingLead?.first_name || '',
    last_name: existingLead?.last_name || '',
    email: existingLead?.email || '',
    phone: existingLead?.phone || '',
    company_name: existingLead?.company_name || '',
    job_title: existingLead?.job_title || '',
    lead_source: existingLead?.lead_source || 'website',
    status: existingLead?.status || 'new',
    estimated_value: existingLead?.estimated_value?.toString() || '',
    assigned_to_id: existingLead?.assigned_to?.id?.toString() || '',
    notes: existingLead?.notes || '',
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const data = await getCompanyTeam();
      const members = data?.team_members || [];
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.lead_source) newErrors.lead_source = 'Lead source is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (company?.id) payload.company_id = company.id;
      if (!payload.assigned_to_id) delete payload.assigned_to_id;
      if (!payload.estimated_value) delete payload.estimated_value;

      if (isEdit) {
        await updateLead(existingLead.id, payload);
        Alert.alert('Success', 'Lead updated successfully');
      } else {
        await createLead(payload);
        Alert.alert('Success', 'Lead created successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error?.detail || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit' : 'Add'} Lead</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              value={formData.first_name}
              onChangeText={val => handleChange('first_name', val)}
              placeholder="Enter first name"
              placeholderTextColor="#94a3b8"
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              value={formData.last_name}
              onChangeText={val => handleChange('last_name', val)}
              placeholder="Enter last name"
              placeholderTextColor="#94a3b8"
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={val => handleChange('email', val)}
              placeholder="email@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={val => handleChange('phone', val)}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={formData.company_name}
              onChangeText={val => handleChange('company_name', val)}
              placeholder="Company name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              value={formData.job_title}
              onChangeText={val => handleChange('job_title', val)}
              placeholder="Job title"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Lead Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lead Source *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.lead_source}
                onValueChange={val => handleChange('lead_source', val)}
                style={styles.picker}
              >
                {LEAD_SOURCES.map(source => (
                  <Picker.Item
                    key={source.value}
                    label={source.label}
                    value={source.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.status}
                onValueChange={val => handleChange('status', val)}
                style={styles.picker}
              >
                {STATUS_OPTIONS.map(status => (
                  <Picker.Item
                    key={status.value}
                    label={status.label}
                    value={status.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Value ($)</Text>
            <TextInput
              style={styles.input}
              value={formData.estimated_value}
              onChangeText={val => handleChange('estimated_value', val)}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign To</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.assigned_to_id}
                onValueChange={val => handleChange('assigned_to_id', val)}
                style={styles.picker}
              >
                <Picker.Item label="Unassigned" value="" />
                {teamMembers.map(member => (
                  <Picker.Item
                    key={member.user_id}
                    label={`${member.first_name} ${member.last_name} (${member.role})`}
                    value={member.user_id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={val => handleChange('notes', val)}
              placeholder="Add notes..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c6fff',
  },
  saveButtonDisabled: {
    color: '#cbd5e1',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
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
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
