import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchThread, replyEmail, suggestReply } from '../services/emailService';
import RenderHTML from 'react-native-render-html';

const EmailThreadScreen = () => {
  const { params } = useRoute();
  const nav = useNavigation();
  const [thread, setThread] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');

  useEffect(() => { load(); }, [params?.id]);
  const load = async () => {
    try { const data = await fetchThread(params.id); setThread(data); } catch (e) { /* noop */ }
  };

  const requestSuggestion = async (email) => {
    try { const res = await suggestReply(email.id); setAiSuggestion(res.suggested_reply); } catch (e) { }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={styles.headerBtn}>←</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{thread?.subject || 'Thread'}</Text>
        <TouchableOpacity onPress={() => nav.navigate('ComposeEmail', { replyTo: thread?.id })}><Text style={styles.headerBtn}>↩</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        {thread?.emails?.map(email => (
          <View key={email.id} style={styles.emailBox}>
            <View style={styles.emailHeader}> 
              <Text style={styles.sender}>{email.from_display || email.from_address}</Text>
              <Text style={styles.timestamp}>{email.sent_at}</Text>
            </View>
            {email.body_html ? (
              <RenderHTML contentWidth={350} source={{ html: email.body_html }} />
            ) : (
              <Text style={styles.bodyText}>{email.body_text}</Text>
            )}
            {email.attachments?.length > 0 && (
              <View style={styles.attachments}> 
                {email.attachments.map(a => (
                  <Text key={a.id} style={styles.attachmentItem}>{a.filename}</Text>
                ))}
              </View>
            )}
            <View style={styles.actionsRow}> 
              <TouchableOpacity style={styles.smallBtn} onPress={() => nav.navigate('ComposeEmail', { replyToEmail: email.id })}><Text style={styles.smallBtnText}>Reply</Text></TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={() => requestSuggestion(email)}><Text style={styles.smallBtnText}>AI Suggest</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        {aiSuggestion ? (
          <View style={styles.suggestionBox}> 
            <Text style={styles.suggestionTitle}>AI Suggested Reply:</Text>
            <Text style={styles.suggestionText}>{aiSuggestion}</Text>
          </View>
        ) : null}
      </ScrollView>
      <TouchableOpacity style={styles.quickReply} onPress={() => nav.navigate('ComposeEmail', { threadId: thread?.id })}>
        <Text style={styles.quickReplyText}>Quick Reply</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailThreadScreen;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, borderBottomWidth:1, borderColor:'#eee' },
  title:{ flex:1, fontSize:16, fontWeight:'600', marginHorizontal:8 },
  headerBtn:{ fontSize:22 },
  emailBox:{ marginBottom:18, backgroundColor:'#f9fafb', borderRadius:8, padding:12, borderWidth:1, borderColor:'#e5e7eb' },
  emailHeader:{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  sender:{ fontWeight:'600' },
  timestamp:{ fontSize:11, color:'#666' },
  bodyText:{ fontSize:14, color:'#333' },
  attachments:{ marginTop:8 },
  attachmentItem:{ fontSize:12, backgroundColor:'#eef2ff', paddingHorizontal:8, paddingVertical:4, borderRadius:6, marginRight:6, marginBottom:6 },
  actionsRow:{ flexDirection:'row', marginTop:10 },
  smallBtn:{ backgroundColor:'#4F46E5', paddingHorizontal:12, paddingVertical:6, borderRadius:6, marginRight:10 },
  smallBtnText:{ color:'#fff', fontSize:12, fontWeight:'600' },
  quickReply:{ position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#4F46E5', padding:14, alignItems:'center' },
  quickReplyText:{ color:'#fff', fontWeight:'600' },
  suggestionBox:{ backgroundColor:'#ecfdf5', borderColor:'#6ee7b7', borderWidth:1, padding:12, borderRadius:8 },
  suggestionTitle:{ fontWeight:'600', marginBottom:4, color:'#065f46' },
  suggestionText:{ color:'#065f46' },
});