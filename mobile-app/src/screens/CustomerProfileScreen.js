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
import { getCustomerProfile, updateCustomerProfile, clearCustomerCache } from '../services/customerService';

const CustomerProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [pictureUri, setPictureUri] = useState(null);
  const [pictureFile, setPictureFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProfile();
    
    // Request permissions for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need camera roll permissions to upload a profile picture.');
        }
      }
    })();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getCustomerProfile();
      setProfile(data);
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        date_of_birth: data.date_of_birth || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
      });
      if (data.profile_picture_url) {
        setPictureUri(data.profile_picture_url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
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
        setPictureUri(result.assets[0].uri);
        // Create a file object for upload
        const filename = result.assets[0].uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        setPictureFile({
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

  const validate = () => {
    const newErrors = {};
    if (!form.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!form.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      if (dob > new Date()) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      let payload;
      
      if (pictureFile) {
        // Create FormData for file upload
        const formData = new FormData();
        // Add user fields
        formData.append('first_name', form.first_name);
        formData.append('last_name', form.last_name);
        if (form.phone) formData.append('phone', form.phone);
        // Add customer profile fields
        if (form.date_of_birth) formData.append('date_of_birth', form.date_of_birth);
        if (form.address) formData.append('address', form.address);
        if (form.city) formData.append('city', form.city);
        if (form.country) formData.append('country', form.country);
        formData.append('profile_picture', pictureFile);
        payload = formData;
      } else {
        payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || '',
          date_of_birth: form.date_of_birth || null,
          address: form.address || '',
          city: form.city || '',
          country: form.country || '',
        };
      }

      const updated = await updateCustomerProfile(payload);
      setProfile(updated);
      if (updated.profile_picture_url) {
        setPictureUri(updated.profile_picture_url);
      }
      setPictureFile(null);
      setEditing(false);
      await clearCustomerCache();
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
    setPictureFile(null);
    setErrors({});
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
      });
      setPictureUri(profile.profile_picture_url || null);
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
        <Text style={styles.headerTitle}>Profile</Text>
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
          {pictureUri && (
            <Image source={{ uri: pictureUri }} style={styles.profilePicture} />
          )}
          <InfoRow label="First Name" value={profile?.first_name} />
          <InfoRow label="Last Name" value={profile?.last_name} />
          <InfoRow label="Email" value={profile?.email} />
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="Date of Birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null} />
          <InfoRow label="Address" value={profile?.address} />
          <InfoRow label="City" value={profile?.city} />
          <InfoRow label="Country" value={profile?.country} />
        </View>
      ) : (
        // Edit Mode
        <View style={styles.content}>
          <TouchableOpacity style={styles.pictureUpload} onPress={pickImage}>
            {pictureUri ? (
              <Image source={{ uri: pictureUri }} style={styles.picturePreview} />
            ) : (
              <View style={styles.picturePlaceholder}>
                <Ionicons name="camera" size={32} color="#667eea" />
                <Text style={styles.picturePlaceholderText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <FormField
            label="First Name *"
            value={form.first_name}
            onChangeText={(text) => {
              setForm({ ...form, first_name: text });
              if (errors.first_name) setErrors({ ...errors, first_name: null });
            }}
            placeholder="Enter first name"
            error={errors.first_name}
          />
          <FormField
            label="Last Name *"
            value={form.last_name}
            onChangeText={(text) => {
              setForm({ ...form, last_name: text });
              if (errors.last_name) setErrors({ ...errors, last_name: null });
            }}
            placeholder="Enter last name"
            error={errors.last_name}
          />
          <FormField
            label="Email"
            value={profile?.email || ''}
            placeholder="Email"
            editable={false}
            style={{ backgroundColor: '#f1f5f9' }}
          />
          <FormField
            label="Phone"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            placeholder="+1234567890"
            keyboardType="phone-pad"
          />
          <FormField
            label="Date of Birth"
            value={form.date_of_birth}
            onChangeText={(text) => {
              setForm({ ...form, date_of_birth: text });
              if (errors.date_of_birth) setErrors({ ...errors, date_of_birth: null });
            }}
            placeholder="YYYY-MM-DD"
            error={errors.date_of_birth}
          />
          <FormField
            label="Address"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            placeholder="Street address"
            multiline
            numberOfLines={2}
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

const FormField = ({ label, value, onChangeText, placeholder, error, ...props }) => (
  <View style={styles.formField}>
    <Text style={styles.formLabel}>{label}</Text>
    <TextInput
      style={[styles.formInput, error && styles.formInputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
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
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 24,
  },
  pictureUpload: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  picturePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  picturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picturePlaceholderText: {
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
  formInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
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

export default CustomerProfileScreen;

