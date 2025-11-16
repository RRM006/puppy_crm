import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { fetchTemplates } from '../services/emailService';

// TemplatePickerModal: list templates by category, preview, select
const TemplatePickerModal = ({ visible, onClose, onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible) load(); }, [visible]);
  const load = async () => {
    setLoading(true);
    try { const data = await fetchTemplates(); setTemplates(data); } catch (e) { /* noop */ }
    setLoading(false);
  };

  const handleSelect = () => {
    if (selected) onSelect(selected);
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Template</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          {!selected ? (
            <FlatList
              data={templates}
              keyExtractor={t => String(t.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.templateRow} onPress={() => setSelected(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <Text style={styles.templateSubject} numberOfLines={1}>{item.subject}</Text>
                    {item.category && <Text style={styles.categoryBadge}>{item.category}</Text>}
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No templates available</Text>}
            />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.previewTitle}>{selected.name}</Text>
              <Text style={styles.previewSubject}>Subject: {selected.subject}</Text>
              <View style={styles.previewBody}>
                <Text>{selected.body_text || selected.body_html || '(No content)'}</Text>
              </View>
              <TouchableOpacity style={styles.useBtn} onPress={handleSelect}>
                <Text style={styles.useBtnText}>Use This Template</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
                <Text style={styles.backBtnText}>Back to List</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TemplatePickerModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: '600' },
  closeBtn: { fontSize: 24, color: '#666' },
  templateRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  templateName: { fontWeight: '600', fontSize: 15 },
  templateSubject: { fontSize: 12, color: '#555', marginTop: 4 },
  categoryBadge: { fontSize: 10, color: '#fff', backgroundColor: '#4F46E5', paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', borderRadius: 10, marginTop: 6 },
  arrow: { fontSize: 24, color: '#ccc' },
  empty: { textAlign: 'center', color: '#666', marginTop: 20 },
  previewTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  previewSubject: { fontSize: 14, color: '#555', marginBottom: 12 },
  previewBody: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  useBtn: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  useBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backBtn: { padding: 14, alignItems: 'center' },
  backBtnText: { color: '#4F46E5', fontWeight: '600' },
});
