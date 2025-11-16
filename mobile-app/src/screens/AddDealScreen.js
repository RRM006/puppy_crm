import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { createDeal, updateDeal, getDeal } from '../services/dealService';
import { getPipelines } from '../services/pipelineService';
import { getCompanyTeam } from '../services/companyService';
import { useAuth } from '../contexts/AuthContext';

export default function AddDealScreen({ route, navigation }) {
  const { dealId } = route.params || {};
  const { company, user } = useAuth();
  const isEdit = !!dealId;

  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    pipeline_id: '',
    stage_id: '',
    customer: '',
    expected_close_date: '',
    assigned_to_id: user?.id || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTeamMembers();
    loadPipelines();
    if (isEdit) {
      loadDeal();
    }
  }, []);

  const loadDeal = async () => {
    try {
      setLoading(true);
      const data = await getDeal(dealId);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        value: data.value?.toString() || '',
        pipeline_id: data.pipeline?.id || '',
        stage_id: data.stage?.id || '',
        customer: data.customer || '',
        expected_close_date: data.expected_close_date || '',
        assigned_to_id: data.assigned_to?.user_id || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await getCompanyTeam(company?.id);
      const members = Array.isArray(data?.team_members) ? data.team_members : [];
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team:', error);
    }
  };

  const loadPipelines = async () => {
    try {
      const data = await getPipelines(company?.id);
      const list = Array.isArray(data) ? data : [];
      setPipelines(list);
      if (list.length > 0 && !formData.pipeline_id) {
        const defaultPipeline = list.find(p => p.is_default) || list[0];
        setFormData(prev => ({
          ...prev,
          pipeline_id: defaultPipeline.id,
          stage_id: defaultPipeline.stages?.[0]?.id || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  };

  const handlePipelineChange = (pipelineId) => {
    const pipeline = pipelines.find(p => p.id === parseInt(pipelineId));
    setFormData({
      ...formData,
      pipeline_id: pipelineId,
      stage_id: pipeline?.stages?.[0]?.id || '',
    });
  };

  const getStages = () => {
    const pipeline = pipelines.find(p => p.id === parseInt(formData.pipeline_id));
    return pipeline?.stages || [];
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.value?.trim()) newErrors.value = 'Value is required';
    else if (isNaN(Number(formData.value))) newErrors.value = 'Value must be a number';
    if (!formData.pipeline_id) newErrors.pipeline_id = 'Pipeline is required';
    if (!formData.stage_id) newErrors.stage_id = 'Stage is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const dealData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        value: Number(formData.value),
        pipeline_id: parseInt(formData.pipeline_id),
        stage_id: parseInt(formData.stage_id),
        customer: formData.customer?.trim() || null,
        expected_close_date: formData.expected_close_date || null,
        assigned_to_id: formData.assigned_to_id ? parseInt(formData.assigned_to_id) : null,
        company_id: company.id,
      };

      if (isEdit) {
        await updateDeal(dealId, dealData);
        Alert.alert('Success', 'Deal updated successfully');
      } else {
        await createDeal(dealData);
        Alert.alert('Success', 'Deal created successfully');
      }
      navigation.goBack();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to save deal';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c6fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit Deal' : 'New Deal'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
            placeholder="Enter deal title"
            placeholderTextColor="#94a3b8"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Value */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Value <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.value && styles.inputError]}
            value={formData.value}
            onChangeText={text => setFormData({ ...formData, value: text })}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
          />
          {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
        </View>

        {/* Customer */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Customer</Text>
          <TextInput
            style={styles.input}
            value={formData.customer}
            onChangeText={text => setFormData({ ...formData, customer: text })}
            placeholder="Customer name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Pipeline */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Pipeline <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerWrapper, errors.pipeline_id && styles.inputError]}>
            <Picker
              selectedValue={formData.pipeline_id}
              onValueChange={handlePipelineChange}
              style={styles.picker}
            >
              <Picker.Item label="Select Pipeline" value="" />
              {pipelines.map(pipeline => (
                <Picker.Item key={pipeline.id} label={pipeline.name} value={pipeline.id} />
              ))}
            </Picker>
          </View>
          {errors.pipeline_id && <Text style={styles.errorText}>{errors.pipeline_id}</Text>}
        </View>

        {/* Stage */}
        {formData.pipeline_id && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Stage <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerWrapper, errors.stage_id && styles.inputError]}>
              <Picker
                selectedValue={formData.stage_id}
                onValueChange={value => setFormData({ ...formData, stage_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select Stage" value="" />
                {getStages().map(stage => (
                  <Picker.Item key={stage.id} label={stage.name} value={stage.id} />
                ))}
              </Picker>
            </View>
            {errors.stage_id && <Text style={styles.errorText}>{errors.stage_id}</Text>}
          </View>
        )}

        {/* Expected Close Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Expected Close Date</Text>
          <TextInput
            style={styles.input}
            value={formData.expected_close_date}
            onChangeText={text => setFormData({ ...formData, expected_close_date: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Assigned To */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Assigned To</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.assigned_to_id}
              onValueChange={value => setFormData({ ...formData, assigned_to_id: value })}
              style={styles.picker}
            >
              <Picker.Item label="Unassigned" value="" />
              {teamMembers.map(member => (
                <Picker.Item
                  key={member.user_id}
                  label={`${member.first_name} ${member.last_name}`}
                  value={member.user_id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Add description..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Update Deal' : 'Create Deal'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  form: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  required: { color: '#ef4444' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  inputError: { borderColor: '#ef4444' },
  textArea: { minHeight: 100, paddingTop: 12 },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#4c6fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
