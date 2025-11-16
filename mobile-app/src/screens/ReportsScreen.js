import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import reportService from '../services/reportService';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLine } from 'victory-native';

const todayISO = () => new Date().toISOString().slice(0,10);
const monthStartISO = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); };

export default function ReportsScreen() {
  const { userRole } = useAuth();
  const scope = reportService.getScopeForRole(userRole);

  const [startDate, setStartDate] = useState(monthStartISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({});
  const [leadsBySource, setLeadsBySource] = useState([]);
  const [leadsByStatus, setLeadsByStatus] = useState([]);
  const [dealsByStage, setDealsByStage] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [dealsWonLost, setDealsWonLost] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => { load(); }, [startDate, endDate, scope]);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryData, src, status, stage, rev, wonLost, performers] = await Promise.all([
        reportService.getSummary(startDate, endDate, scope),
        reportService.getLeadsBySource(startDate, endDate, scope),
        reportService.getLeadsByStatus(startDate, endDate, scope),
        reportService.getDealsByStage(startDate, endDate, scope),
        reportService.getRevenueTrend(startDate, endDate, scope),
        reportService.getDealsWonLost(startDate, endDate, scope),
        reportService.getTopPerformers(startDate, endDate, scope),
      ]);
      setSummary(summaryData || {});
      setLeadsBySource(src || []);
      setLeadsByStatus(status || []);
      setDealsByStage(stage || []);
      setRevenueTrend(rev || []);
      setDealsWonLost(wonLost || []);
      setTopPerformers(performers || []);
    } catch (e) {
      console.warn('Report load failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = [
    { label: 'Total Leads', value: summary.total_leads ?? 0 },
    { label: 'Deals Value', value: `$${(summary.total_deals_value ?? 0).toLocaleString()}` },
    { label: 'Win Rate', value: `${summary.win_rate ?? 0}%` },
    { label: 'Avg Deal Size', value: `$${(summary.average_deal_size ?? 0).toLocaleString()}` },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reports & Analytics</Text>
      <Text style={styles.scope}>Scope: {scope}</Text>
      <View style={styles.cardRow}>
        {overviewCards.map(c => (
          <View key={c.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{c.label}</Text>
            <Text style={styles.metricValue}>{c.value}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.refreshBtn} onPress={load} disabled={loading}>
        <Text style={styles.refreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4c6fff" />
        </View>
      )}

      {/* Charts */}
      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Leads by Source</Text>
        <VictoryPie
          height={260}
          data={leadsBySource}
          x="source"
          y="count"
          colorScale={['#4c6fff','#10b981','#f59e0b','#6366f1','#ef4444']}
          labels={({ datum }) => `${datum.source}\n${datum.count}`}
          style={{ labels: { fontSize: 10 } }}
        />
      </View>
      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Leads by Status</Text>
        <VictoryChart height={260} theme={VictoryTheme.material} domainPadding={20}>
          <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryBar data={leadsByStatus} x="status" y="count" style={{ data: { fill: '#4c6fff', width: 18 } }} />
        </VictoryChart>
      </View>
      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Deals by Stage</Text>
        <VictoryChart height={260} theme={VictoryTheme.material} domainPadding={25}>
          <VictoryAxis style={{ tickLabels: { fontSize: 9, angle: -30 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryBar data={dealsByStage} x="stage" y="count" style={{ data: { fill: '#8b5cf6', width: 16 } }} />
        </VictoryChart>
      </View>
      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Monthly Revenue Trend</Text>
        <VictoryChart height={260} theme={VictoryTheme.material}>
          <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryLine data={revenueTrend} x="month" y="value" style={{ data: { stroke: '#10b981', strokeWidth: 3 } }} />
        </VictoryChart>
      </View>
      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Deals Won vs Lost</Text>
        <VictoryChart height={240} theme={VictoryTheme.material} domainPadding={30}>
          <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryBar data={dealsWonLost} x="status" y="count" style={{ data: { fill: '#6366f1', width: 30 } }} />
        </VictoryChart>
      </View>
      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Top Performers</Text>
        <VictoryChart height={260} theme={VictoryTheme.material} domainPadding={30}>
          <VictoryAxis style={{ tickLabels: { fontSize: 9, angle: -30 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryBar data={topPerformers} x="name" y="deals_closed" style={{ data: { fill: '#f59e0b', width: 24 } }} />
        </VictoryChart>
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  content: { padding: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  scope: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metricCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, flexBasis: '48%', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  refreshBtn: { backgroundColor: '#4c6fff', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  refreshText: { color: '#fff', fontWeight: '600' },
  loading: { paddingVertical: 20 },
  chartBlock: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 18, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
  chartTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
});
