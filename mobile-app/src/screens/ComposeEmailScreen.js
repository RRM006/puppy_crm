import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { sendEmail, replyEmail, suggestReply } from '../services/emailService';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import ContactPicker from '../components/ContactPicker';
import TemplatePickerModal from '../components/TemplatePickerModal';

// Phase 6.10 enhanced compose with rich editor, contact picker, template picker, attachments, camera, AI suggestion
const ComposeEmailScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const replyToEmail = route.params?.replyToEmail;
  const threadId = route.params?.threadId;
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const richText = useRef();

  const requestAiSuggestion = async () => {
    if (!replyToEmail) return Alert.alert('AI Suggest', 'AI reply suggestion is only available for replies.');
    try { const res = await suggestReply(replyToEmail); setAiSuggestion(res.suggested_reply); } catch (e) { Alert.alert('Error', 'Could not get AI suggestion'); }
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) setBody(aiSuggestion);
    setAiSuggestion('');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) setAttachments([...attachments, result.assets[0]]);
  };

  const takePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera', 'Camera permission required');
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) setAttachments([...attachments, result.assets[0]]);
  };

  const handleContactSelect = (contacts) => {
    const emails = contacts.map(c => c.email).join(', ');
    setTo(to ? `${to}, ${emails}` : emails);
  };

  const handleTemplateSelect = (template) => {
    setSubject(template.subject);
    setBody(template.body_html || template.body_text || '');
    if (richText.current) richText.current.setContentHTML(template.body_html || template.body_text || '');
  };

  const onSend = async () => {
    setSending(true);
    try {
      const payload = { to, cc, bcc, subject, body_html: body, body_text: body, thread_id: threadId };
      // Attachments handling would require FormData multipart/form-data upload; stub for now
      if (replyToEmail) {
        await replyEmail(replyToEmail, payload);
      } else {
        await sendEmail(payload);
      }
      nav.goBack();
    } catch (e) { Alert.alert('Error', 'Failed to send email'); }
    setSending(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={styles.headerBtn}>✕</Text></TouchableOpacity>
        <Text style={styles.title}>Compose</Text>
        <TouchableOpacity onPress={() => setShowTemplatePicker(true)}><Text style={styles.headerBtnText}>Templates</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal:16, paddingBottom:80 }}>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>To</Text>
          <TextInput style={styles.inputInline} value={to} onChangeText={setTo} placeholder="recipient@example.com" />
          <TouchableOpacity onPress={() => setShowContactPicker(true)}><Text style={styles.pickerBtn}>+</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setShowCc(!showCc)}><Text style={styles.toggle}>{showCc ? 'Hide CC' : 'Add CC'}</Text></TouchableOpacity>
        {showCc && (
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Cc</Text>
            <TextInput style={styles.inputInline} value={cc} onChangeText={setCc} />
          </View>
        )}
        <TouchableOpacity onPress={() => setShowBcc(!showBcc)}><Text style={styles.toggle}>{showBcc ? 'Hide BCC' : 'Add BCC'}</Text></TouchableOpacity>
        {showBcc && (
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Bcc</Text>
            <TextInput style={styles.inputInline} value={bcc} onChangeText={setBcc} />
          </View>
        )}
        <Text style={styles.label}>Subject</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} />
        <Text style={styles.label}>Body</Text>
        <RichEditor
          ref={richText}
          initialContentHTML={body}
          onChange={setBody}
          placeholder="Write your email..."
          style={styles.richEditor}
        />
        <RichToolbar
          editor={richText}
          actions={[actions.setBold, actions.setItalic, actions.setUnderline, actions.insertBulletsList, actions.insertOrderedList, actions.insertLink]}
          style={styles.richToolbar}
        />
        <View style={styles.attachmentRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}><Text style={styles.attachBtnText}>📎 Gallery</Text></TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={takePhoto}><Text style={styles.attachBtnText}>📷 Camera</Text></TouchableOpacity>
        </View>
        {attachments.length > 0 && (
          <View style={styles.attachmentsList}>
            {attachments.map((att, idx) => (
              <Text key={idx} style={styles.attachmentItem}>{att.uri?.split('/').pop() || 'Attachment'}</Text>
            ))}
          </View>
        )}
        {replyToEmail && (
          <TouchableOpacity style={styles.aiBtn} onPress={requestAiSuggestion}><Text style={styles.aiBtnText}>✨ AI Suggest Reply</Text></TouchableOpacity>
        )}
        {aiSuggestion && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionTitle}>AI Suggestion:</Text>
            <Text style={styles.suggestionText}>{aiSuggestion}</Text>
            <TouchableOpacity onPress={applyAiSuggestion}><Text style={styles.applyLink}>Apply Suggestion</Text></TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={[styles.sendBtn, sending && { opacity:0.6 }]} disabled={sending} onPress={onSend}>
          <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <ContactPicker visible={showContactPicker} onClose={() => setShowContactPicker(false)} onSelect={handleContactSelect} />
      <TemplatePickerModal visible={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} onSelect={handleTemplateSelect} />
    </View>
  );
};

export default ComposeEmailScreen;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, borderBottomWidth:1, borderColor:'#eee' },
  title:{ flex:1, textAlign:'center', fontSize:16, fontWeight:'600' },
  headerBtn:{ fontSize:18 },
  headerBtnText:{ fontSize:13, color:'#4F46E5', fontWeight:'600' },
  label:{ marginTop:12, fontSize:13, fontWeight:'600', color:'#374151' },
  input:{ borderWidth:1, borderColor:'#d1d5db', borderRadius:6, paddingHorizontal:10, paddingVertical:8, fontSize:14, backgroundColor:'#fafafa', marginTop:6 },
  fieldRow:{ flexDirection:'row', alignItems:'center', marginTop:12 },
  inputInline:{ flex:1, borderWidth:1, borderColor:'#d1d5db', borderRadius:6, paddingHorizontal:10, paddingVertical:8, fontSize:14, backgroundColor:'#fafafa', marginLeft:8, marginRight:8 },
  pickerBtn:{ fontSize:24, color:'#4F46E5' },
  toggle:{ marginTop:8, color:'#4F46E5', fontSize:12 },
  richEditor:{ minHeight:200, borderWidth:1, borderColor:'#d1d5db', borderRadius:6, marginTop:6, padding:8 },
  richToolbar:{ backgroundColor:'#f3f4f6', borderRadius:6, marginTop:6 },
  attachmentRow:{ flexDirection:'row', marginTop:12 },
  attachBtn:{ flex:1, backgroundColor:'#e0e7ff', paddingVertical:10, borderRadius:6, alignItems:'center', marginHorizontal:4 },
  attachBtnText:{ fontSize:13, color:'#4F46E5', fontWeight:'600' },
  attachmentsList:{ marginTop:8 },
  attachmentItem:{ fontSize:12, backgroundColor:'#eef2ff', paddingHorizontal:8, paddingVertical:4, borderRadius:6, marginBottom:4 },
  aiBtn:{ marginTop:12, backgroundColor:'#fef3c7', paddingVertical:10, borderRadius:6, alignItems:'center' },
  aiBtnText:{ fontSize:14, color:'#92400e', fontWeight:'600' },
  suggestionBox:{ marginTop:12, backgroundColor:'#ecfdf5', borderColor:'#6ee7b7', borderWidth:1, padding:12, borderRadius:8 },
  suggestionTitle:{ fontWeight:'600', marginBottom:4, color:'#065f46' },
  suggestionText:{ color:'#065f46', marginBottom:8 },
  applyLink:{ color:'#059669', fontWeight:'600', textDecorationLine:'underline' },
  sendBtn:{ marginTop:20, backgroundColor:'#4F46E5', paddingVertical:14, borderRadius:8, alignItems:'center' },
  sendBtnText:{ color:'#fff', fontWeight:'700' },
});