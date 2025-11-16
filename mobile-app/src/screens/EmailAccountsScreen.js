import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchAccounts, syncAccount, setDefaultAccount } from '../services/emailService';

const EmailAccountsScreen = () => {
  const nav = useNavigation();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const data = await fetchAccounts(); setAccounts(data); } catch (e) { }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onSync = async (id) => { await syncAccount(id); load(); };
  const onSetDefault = async (id) => { await setDefaultAccount(id); load(); };

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={styles.headerBtn}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Email Accounts</Text>
        <TouchableOpacity onPress={() => {/* add account placeholder */}}><Text style={styles.headerBtn}>＋</Text></TouchableOpacity>
      </View>
      <FlatList
        data={accounts}
        keyExtractor={a => String(a.id)}
        renderItem={({ item }) => (
          <View style={styles.accountRow}> 
            <View style={{ flex:1 }}>
              <Text style={styles.accountEmail}>{item.email_address}</Text>
              <Text style={styles.meta}>{item.provider || 'SMTP'}</Text>
              {item.is_default && <Text style={styles.default}>Default</Text>}
            </View>
            <TouchableOpacity style={styles.smallBtn} onPress={() => onSync(item.id)}><Text style={styles.smallBtnText}>Sync</Text></TouchableOpacity>
            {!item.is_default && <TouchableOpacity style={styles.smallBtnOutline} onPress={() => onSetDefault(item.id)}><Text style={styles.smallBtnOutlineText}>Make Default</Text></TouchableOpacity>}
          </View>
        )}
        contentContainerStyle={accounts.length===0 && { flexGrow:1, justifyContent:'center' }}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No accounts connected.</Text>}
      />
    </View>
  );
};

export default EmailAccountsScreen;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, borderBottomWidth:1, borderColor:'#eee' },
  title:{ flex:1, textAlign:'center', fontSize:16, fontWeight:'600' },
  headerBtn:{ fontSize:20 },
  accountRow:{ flexDirection:'row', alignItems:'center', padding:14, borderBottomWidth:1, borderColor:'#f1f1f1' },
  accountEmail:{ fontWeight:'600', fontSize:14 },
  meta:{ fontSize:11, color:'#555', marginTop:2 },
  default:{ fontSize:10, color:'#fff', backgroundColor:'#16a34a', paddingHorizontal:6, paddingVertical:2, alignSelf:'flex-start', borderRadius:10, marginTop:4 },
  smallBtn:{ backgroundColor:'#4F46E5', paddingHorizontal:12, paddingVertical:6, borderRadius:6, marginHorizontal:6 },
  smallBtnText:{ color:'#fff', fontSize:12, fontWeight:'600' },
  smallBtnOutline:{ borderWidth:1, borderColor:'#4F46E5', paddingHorizontal:12, paddingVertical:6, borderRadius:6 },
  smallBtnOutlineText:{ color:'#4F46E5', fontSize:12, fontWeight:'600' },
  empty:{ textAlign:'center', color:'#666' },
});