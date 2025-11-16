import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getCompanyProfile, updateCompanyProfile, clearCompanyCache } from '../services/companyService';

const INDUSTRIES = [
  'technology',
  'healthcare',
  'finance',
  'retail',
  'manufacturing',
  'other',
];

const CompanyProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [logoUri, setLogoUri] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    loadProfile();
    
    // Request permissions for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need camera roll permissions to upload a logo.');
        }
      }
    })();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getCompanyProfile();
      setProfile(data);
      setForm({
        company_name: data.company_name || '',
        website: data.website || '',
        industry: data.industry || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        timezone: data.timezone || '',
        phone: data.phone || '',
        employee_count: data.employee_count?.toString() || '',
      });
      if (data.logo_url) {
        setLogoUri(data.logo_url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load company profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLogoUri(result.assets[0].uri);
        // Create a file object for upload
        const filename = result.assets[0].uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        setLogoFile({
          uri: result.assets[0].uri,
          name: filename,
          type,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload;
      
      if (logoFile) {
        // Create FormData for file upload
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value);
          }
        });
        formData.append('logo', logoFile);
        payload = formData;
      } else {
        payload = {
          ...form,
          employee_count: form.employee_count ? parseInt(form.employee_count) : null,
        };
      }

      const updated = await updateCompanyProfile(payload);
      setProfile(updated);
      if (updated.logo_url) {
        setLogoUri(updated.logo_url);
      }
      setLogoFile(null);
      setEditing(false);
      await clearCompanyCache();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      const message = error?.detail || Object.values(error || {}).flat().join(', ') || 'Failed to update profile';
      Alert.alert('Error', message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setLogoFile(null);
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        website: profile.website || '',
        industry: profile.industry || '',
        description: profile.description || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
        timezone: profile.timezone || '',
        phone: profile.phone || '',
        employee_count: profile.employee_count?.toString() || '',
      });
      setLogoUri(profile.logo_url || null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {!editing ? (
        // Display Mode
        <View style={styles.content}>
          {logoUri && (
            <Image source={{ uri: logoUri }} style={styles.logo} />
          )}
          <InfoRow label="Company Name" value={profile?.company_name} />
          <InfoRow label="Website" value={profile?.website} />
          <InfoRow label="Industry" value={profile?.industry} />
          <InfoRow label="Description" value={profile?.description} />
          <InfoRow label="Address" value={profile?.address} />
          <InfoRow label="City" value={profile?.city} />
          <InfoRow label="Country" value={profile?.country} />
          <InfoRow label="Timezone" value={profile?.timezone} />
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="Employee Count" value={profile?.employee_count?.toString()} />
        </View>
      ) : (
        // Edit Mode
        <View style={styles.content}>
          <TouchableOpacity style={styles.logoUpload} onPress={pickImage}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="camera" size={32} color="#667eea" />
                <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
              </View>
            )}
          </TouchableOpacity>

          <FormField
            label="Company Name"
            value={form.company_name}
            onChangeText={(text) => setForm({ ...form, company_name: text })}
            placeholder="Enter company name"
          />
          <FormField
            label="Website"
            value={form.website}
            onChangeText={(text) => setForm({ ...form, website: text })}
            placeholder="https://example.com"
            keyboardType="url"
          />
          <FormField
            label="Industry"
            value={form.industry}
            onChangeText={(text) => setForm({ ...form, industry: text })}
            placeholder="Select industry"
            editable={false}
            onPress={() => {
              // Show industry picker
              Alert.alert(
                'Select Industry',
                '',
                INDUSTRIES.map(industry => ({
                  text: industry.charAt(0).toUpperCase() + industry.slice(1),
                  onPress: () => setForm({ ...form, industry }),
                }))
              );
            }}
          />
          <FormField
            label="Description"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            placeholder="Company description"
            multiline
            numberOfLines={4}
          />
          <FormField
            label="Address"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            placeholder="Street address"
          />
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <FormField
                label="City"
                value={form.city}
                onChangeText={(text) => setForm({ ...form, city: text })}
                placeholder="City"
              />
            </View>
            <View style={styles.halfWidth}>
              <FormField
                label="Country"
                value={form.country}
                onChangeText={(text) => setForm({ ...form, country: text })}
                placeholder="Country"
              />
            </View>
          </View>
          <FormField
            label="Timezone"
            value={form.timezone}
            onChangeText={(text) => setForm({ ...form, timezone: text })}
            placeholder="America/New_York"
          />
          <FormField
            label="Phone"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            placeholder="+1234567890"
            keyboardType="phone-pad"
          />
          <FormField
            label="Employee Count"
            value={form.employee_count}
            onChangeText={(text) => setForm({ ...form, employee_count: text })}
            placeholder="0"
            keyboardType="numeric"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  editButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 24,
  },
  logoUpload: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 8,
  },
  infoRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompanyProfileScreen;

