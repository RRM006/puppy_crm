import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import emailService, { fetchThreads, toggleStar, markThreadRead } from '../services/emailService';

const CATEGORIES = ['All','Primary','Lead','Deal','Customer','Complaint'];

const EmailInboxScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchThreads(activeCat === 'All' ? {} : { category: activeCat });
      setThreads(data);
    } catch (e) { /* noop */ }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, [activeCat]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openThread = (thread) => nav.navigate('EmailThread', { id: thread.id });

  const renderRight = (thread) => (
    <TouchableOpacity style={[styles.swipeButton, styles.delete]} onPress={() => {/* delete stub */}}>
      <Text style={styles.swipeText}>Delete</Text>
    </TouchableOpacity>
  );
  const renderLeft = (thread) => (
    <TouchableOpacity style={[styles.swipeButton, styles.archive]} onPress={() => markThreadRead(thread.id).then(load)}>
      <Text style={styles.swipeText}>Read</Text>
    </TouchableOpacity>
  );

  const ThreadItem = ({ item }) => (
    <Swipeable renderLeftActions={() => renderLeft(item)} renderRightActions={() => renderRight(item)}>
      <TouchableOpacity style={[styles.card, !item.is_read && styles.unread]} onPress={() => openThread(item)}>
        <View style={styles.cardHeader}> 
          <Text style={styles.sender} numberOfLines={1}>{item.other_party || 'Unknown'}</Text>
          <TouchableOpacity onPress={() => toggleStar(item.id).then(load)}>
            <Text style={styles.star}>{item.is_starred ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.preview} numberOfLines={1}>{item.preview || item.last_email_excerpt}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.time}>{item.last_message_at}</Text>
          {item.category && <Text style={styles.badge}>{item.category}</Text>}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => nav.openDrawer()}><Text style={styles.headerBtn}>☰</Text></TouchableOpacity>
        <Text style={styles.title}>Inbox</Text>
        <TouchableOpacity onPress={() => {/* search stub */}}><Text style={styles.headerBtn}>🔍</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setActiveCat(cat)} style={[styles.tab, activeCat===cat && styles.activeTab]}>
            <Text style={[styles.tabText, activeCat===cat && styles.activeTabText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={threads}
        keyExtractor={item => String(item.id)}
        renderItem={ThreadItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={threads.length===0 && { flexGrow:1, justifyContent:'center' }}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No threads</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('ComposeEmail')}> 
        <Text style={styles.fabText}>✉</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailInboxScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderColor:'#eee' },
  title: { flex:1, textAlign:'center', fontSize:18, fontWeight:'600' },
  headerBtn: { fontSize:22 },
  tabs: { maxHeight:48, borderBottomWidth:1, borderColor:'#eee' },
  tab: { paddingHorizontal:14, paddingVertical:10 },
  activeTab: { borderBottomWidth:3, borderColor:'#4F46E5' },
  tabText: { color:'#555', fontSize:14 },
  activeTabText: { color:'#111', fontWeight:'600' },
  card: { padding:12, borderBottomWidth:1, borderColor:'#f1f1f1' },
  unread: { backgroundColor:'#f0f6ff' },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  sender: { fontWeight:'500', flex:1, marginRight:8 },
  star: { fontSize:18, color:'#f5b400' },
  subject: { fontSize:15, fontWeight:'600', marginTop:4 },
  preview: { fontSize:13, color:'#555', marginTop:2 },
  metaRow: { flexDirection:'row', marginTop:6, alignItems:'center' },
  time: { fontSize:11, color:'#888', marginRight:8 },
  badge: { fontSize:11, backgroundColor:'#4F46E5', color:'#fff', paddingHorizontal:6, paddingVertical:2, borderRadius:10 },
  empty: { textAlign:'center', color:'#666' },
  fab: { position:'absolute', right:20, bottom:30, backgroundColor:'#4F46E5', width:56, height:56, borderRadius:28, justifyContent:'center', alignItems:'center', elevation:4 },
  fabText: { color:'#fff', fontSize:24 },
  swipeButton: { justifyContent:'center', alignItems:'center', width:80 },
  archive: { backgroundColor:'#4F46E5' },
  delete: { backgroundColor:'#dc2626' },
  swipeText: { color:'#fff', fontWeight:'600' },
});