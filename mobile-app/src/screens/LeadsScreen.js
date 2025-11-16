import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getLeads, deleteLead, convertLead } from '../services/leadService';
import { getPipelines } from '../services/pipelineService';
import FilterModal from '../components/FilterModal';

const STATUS_COLORS = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#10b981',
  unqualified: '#ef4444',
  converted: '#06b6d4',
};

const LeadCard = ({ lead, onPress, onDelete, onConvert }) => {
  const translateX = new Animated.Value(0);
  const [swiping, setSwiping] = useState(false);

  const handleSwipeRight = () => {
    Animated.spring(translateX, {
      toValue: 100,
      useNativeDriver: true,
    }).start();
    setSwiping(true);
    setTimeout(() => {
      onConvert(lead);
      resetPosition();
    }, 300);
  };

  const handleSwipeLeft = () => {
    Animated.spring(translateX, {
      toValue: -100,
      useNativeDriver: true,
    }).start();
    setSwiping(true);
    setTimeout(() => {
      onDelete(lead);
      resetPosition();
    }, 300);
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => setSwiping(false));
  };

  const statusColor = STATUS_COLORS[lead.status] || '#64748b';

  return (
    <View style={styles.cardContainer}>
      {/* Swipe Background */}
      <View style={styles.swipeBackground}>
        <View style={[styles.swipeAction, { backgroundColor: '#10b981' }]}>
          <Ionicons name="swap-horizontal" size={24} color="#fff" />
          <Text style={styles.swipeText}>Convert</Text>
        </View>
        <View style={[styles.swipeAction, { backgroundColor: '#ef4444' }]}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.swipeText}>Delete</Text>
        </View>
      </View>

      {/* Card Content */}
      <Animated.View style={[styles.card, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          disabled={swiping}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.leadName}>
                {lead.first_name} {lead.last_name}
              </Text>
              {lead.company_name && (
                <Text style={styles.companyName}>{lead.company_name}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {lead.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color="#64748b" />
              <Text style={styles.infoText}>{lead.email}</Text>
            </View>
            {lead.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color="#64748b" />
                <Text style={styles.infoText}>{lead.phone}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              {lead.estimated_value && (
                <Text style={styles.valueText}>
                  ${Number(lead.estimated_value).toLocaleString()}
                </Text>
              )}
            </View>
            {lead.assigned_to && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {lead.assigned_to.first_name?.[0]}
                  {lead.assigned_to.last_name?.[0]}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipe Hint */}
      {!swiping && (
        <View style={styles.swipeHint}>
          <Ionicons name="swap-horizontal" size={16} color="#94a3b8" />
          <Text style={styles.swipeHintText}>Swipe for actions</Text>
        </View>
      )}
    </View>
  );
};

export default function LeadsScreen({ navigation }) {
  const { company } = useAuth();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, filters]);

  const loadLeads = async (pageNum = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = {
        company_id: company?.id,
        page: pageNum,
        ...filters,
      };
      const data = await getLeads(params);
      const newLeads = Array.isArray(data) ? data : [];
      
      if (pageNum === 1) {
        setLeads(newLeads);
      } else {
        setLeads(prev => [...prev, ...newLeads]);
      }
      
      setHasMore(newLeads.length >= 20);
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', 'Failed to load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lead =>
          lead.first_name?.toLowerCase().includes(query) ||
          lead.last_name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredLeads(filtered);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeads(1);
  }, [filters]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadLeads(page + 1);
    }
  };

  const handleDelete = (lead) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete ${lead.first_name} ${lead.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLead(lead.id);
              setLeads(prev => prev.filter(l => l.id !== lead.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lead');
            }
          },
        },
      ]
    );
  };

  const handleConvert = async (lead) => {
    try {
      const pipelines = await getPipelines(company?.id);
      if (!pipelines || pipelines.length === 0) {
        Alert.alert('Error', 'No pipelines found. Please create a pipeline first.');
        return;
      }

      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
      const firstStage = defaultPipeline.stages?.[0];

      if (!firstStage) {
        Alert.alert('Error', 'Pipeline has no stages');
        return;
      }

      Alert.alert(
        'Convert to Deal',
        `Convert ${lead.first_name} ${lead.last_name} to a deal?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Convert',
            onPress: async () => {
              try {
                await convertLead(lead.id, {
                  pipeline_id: defaultPipeline.id,
                  stage_id: firstStage.id,
                });
                Alert.alert('Success', 'Lead converted to deal');
                loadLeads(1);
              } catch (error) {
                Alert.alert('Error', 'Failed to convert lead');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load pipelines');
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    loadLeads(1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={styles.iconButton}
          >
            <Ionicons name="options-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
            onDelete={handleDelete}
            onConvert={handleConvert}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No leads found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddLead')}
            >
              <Text style={styles.emptyButtonText}>Create First Lead</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color="#4c6fff" style={{ marginVertical: 20 }} />
          ) : null
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddLead')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        type="leads"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeAction: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLeft: {
    flex: 1,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.5,
  },
  swipeHintText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4c6fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
