import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ContactPicker: search leads, deals, customers; multi-select
const ContactPicker = ({ visible, onClose, onSelect }) => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible) loadContacts(); }, [visible, search]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const baseURL = process.env.EXPO_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api';
      // Fetch leads, deals, customers concurrently
      const [leads, deals, customers] = await Promise.all([
        axios.get(`${baseURL}/leads/`, { headers: { Authorization: `Bearer ${token}` }, params: { search } }),
        axios.get(`${baseURL}/deals/`, { headers: { Authorization: `Bearer ${token}` }, params: { search } }),
        axios.get(`${baseURL}/customers/`, { headers: { Authorization: `Bearer ${token}` }, params: { search } }),
      ]);
      const combined = [
        ...leads.data.map(l => ({ ...l, type: 'Lead', email: l.email })),
        ...deals.data.map(d => ({ ...d, type: 'Deal', email: d.customer?.email })),
        ...customers.data.map(c => ({ ...c, type: 'Customer', email: c.email })),
      ].filter(c => c.email);
      setContacts(combined);
    } catch (e) { /* noop */ }
    setLoading(false);
  };

  const toggleSelect = (contact) => {
    if (selected.find(c => c.email === contact.email)) {
      setSelected(selected.filter(c => c.email !== contact.email));
    } else {
      setSelected([...selected, contact]);
    }
  };

  const handleDone = () => {
    onSelect(selected);
    setSelected([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Contacts</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={contacts}
            keyExtractor={(item, idx) => `${item.type}-${item.id || idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.contactRow} onPress={() => toggleSelect(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{item.name || item.title || item.company_name}</Text>
                  <Text style={styles.contactEmail}>{item.email}</Text>
                  <Text style={styles.contactType}>{item.type}</Text>
                </View>
                {selected.find(c => c.email === item.email) && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
          />
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Done ({selected.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ContactPicker;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: '600' },
  closeBtn: { fontSize: 24, color: '#666' },
  searchInput: { margin: 12, padding: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fafafa' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  contactName: { fontWeight: '600', fontSize: 14 },
  contactEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  contactType: { fontSize: 10, color: '#4F46E5', marginTop: 4 },
  checkmark: { fontSize: 24, color: '#16a34a' },
  empty: { textAlign: 'center', color: '#666', marginTop: 20 },
  doneBtn: { backgroundColor: '#4F46E5', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 8, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
