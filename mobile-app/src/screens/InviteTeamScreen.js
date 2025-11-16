import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inviteTeamMember } from '../services/companyService';

const ROLES = [
  { value: 'ceo', label: 'CEO' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'support_staff', label: 'Support Staff' },
];

const DEPARTMENTS = [
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'management', label: 'Management' },
];

const rolePermissions = {
  ceo: ['Invite Users', 'Manage Deals', 'View Reports', 'Manage Customers'],
  manager: ['Invite Users', 'Manage Deals', 'View Reports', 'Manage Customers'],
  sales_manager: ['Manage Deals', 'View Reports', 'Manage Customers'],
  support_staff: ['Manage Customers'],
};

const InviteTeamScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'manager',
    department: 'sales',
  });
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!form.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await inviteTeamMember(form);
      Alert.alert('Success', `Invitation sent to ${form.email}`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message = error?.detail || Object.values(error || {}).flat().join(', ') || 'Failed to send invitation';
      Alert.alert('Error', message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPermissions = rolePermissions[form.role] || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Team Member</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <FormField
          label="Email *"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
          placeholder="colleague@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <FormField
              label="First Name"
              value={form.first_name}
              onChangeText={(text) => setForm({ ...form, first_name: text })}
              placeholder="John"
            />
          </View>
          <View style={styles.halfWidth}>
            <FormField
              label="Last Name"
              value={form.last_name}
              onChangeText={(text) => setForm({ ...form, last_name: text })}
              placeholder="Doe"
            />
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Role *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleContainer}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleChip,
                  form.role === role.value && styles.roleChipSelected,
                ]}
                onPress={() => setForm({ ...form, role: role.value })}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    form.role === role.value && styles.roleChipTextSelected,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Department</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.departmentContainer}>
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity
                key={dept.value}
                style={[
                  styles.departmentChip,
                  form.department === dept.value && styles.departmentChipSelected,
                ]}
                onPress={() => setForm({ ...form, department: dept.value })}
              >
                <Text
                  style={[
                    styles.departmentChipText,
                    form.department === dept.value && styles.departmentChipTextSelected,
                  ]}
                >
                  {dept.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedPermissions.length > 0 && (
          <View style={styles.permissionsBox}>
            <Text style={styles.permissionsTitle}>Permissions for {ROLES.find(r => r.value === form.role)?.label}:</Text>
            {selectedPermissions.map((perm, index) => (
              <View key={index} style={styles.permissionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.permissionText}>{perm}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Send Invitation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const FormField = ({ label, value, onChangeText, placeholder, ...props }) => (
  <View style={styles.formField}>
    <Text style={styles.formLabel}>{label}</Text>
    <TextInput
      style={styles.formInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  content: {
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  roleContainer: {
    marginTop: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleChipSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#667eea',
  },
  roleChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  roleChipTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  departmentContainer: {
    marginTop: 8,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  departmentChipSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#667eea',
  },
  departmentChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  departmentChipTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  permissionsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InviteTeamScreen;

