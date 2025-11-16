import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getDeals, moveDealStage } from '../services/dealService';
import { getPipelines } from '../services/pipelineService';
import FilterModal from '../components/FilterModal';

const { width } = Dimensions.get('window');
const KANBAN_COLUMN_WIDTH = width * 0.75;

const DealCard = ({ deal, onPress, viewType }) => {
  return (
    <TouchableOpacity
      style={[styles.dealCard, viewType === 'kanban' && styles.kanbanCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle} numberOfLines={1}>
          {deal.title}
        </Text>
        <Text style={styles.dealValue}>${Number(deal.value).toLocaleString()}</Text>
      </View>
      {deal.customer_name && (
        <Text style={styles.dealCustomer}>{deal.customer_name}</Text>
      )}
      <View style={styles.dealFooter}>
        <Text style={styles.dealProb}>{deal.stage?.probability || 0}%</Text>
        {deal.assigned_to && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {deal.assigned_to.first_name?.[0]}{deal.assigned_to.last_name?.[0]}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const KanbanColumn = ({ stage, deals, onDealPress, onDrop }) => {
  return (
    <View style={styles.kanbanColumn}>
      <View style={styles.columnHeader}>
        <Text style={styles.columnTitle}>{stage.name}</Text>
        <View style={styles.columnBadge}>
          <Text style={styles.columnCount}>{deals.length}</Text>
        </View>
      </View>
      <ScrollView style={styles.columnContent} showsVerticalScrollIndicator={false}>
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            onPress={() => onDealPress(deal)}
            viewType="kanban"
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default function DealsScreen({ navigation }) {
  const { company } = useAuth();
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [viewType, setViewType] = useState('kanban'); // 'kanban' or 'list'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      loadDeals();
    }
  }, [selectedPipeline, filters]);

  const loadPipelines = async () => {
    try {
      const data = await getPipelines(company?.id);
      const list = Array.isArray(data) ? data : [];
      setPipelines(list);
      if (list.length > 0) {
        const defaultPipeline = list.find(p => p.is_default) || list[0];
        setSelectedPipeline(defaultPipeline);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load pipelines');
    }
  };

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = {
        company_id: company?.id,
        pipeline_id: selectedPipeline?.id,
        ...filters,
      };
      const data = await getDeals(params);
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load deals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDeals();
  }, [selectedPipeline, filters]);

  const getDealsByStage = () => {
    if (!selectedPipeline?.stages) return [];
    return selectedPipeline.stages.map(stage => ({
      stage,
      deals: deals.filter(deal => deal.stage?.id === stage.id),
    }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Deals</Text>
          {selectedPipeline && (
            <TouchableOpacity
              style={styles.pipelineSelector}
              onPress={() => {
                Alert.alert(
                  'Select Pipeline',
                  null,
                  pipelines.map(p => ({
                    text: p.name,
                    onPress: () => setSelectedPipeline(p),
                  }))
                );
              }}
            >
              <Text style={styles.pipelineText}>{selectedPipeline.name}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setViewType(viewType === 'kanban' ? 'list' : 'kanban')}
            style={styles.iconButton}
          >
            <Ionicons
              name={viewType === 'kanban' ? 'list' : 'grid'}
              size={24}
              color="#0f172a"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={styles.iconButton}
          >
            <Ionicons name="options-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4c6fff" />
        </View>
      ) : viewType === 'kanban' ? (
        <ScrollView
          horizontal
          style={styles.kanbanContainer}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {getDealsByStage().map(({ stage, deals: stageDeals }) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={stageDeals}
              onDealPress={deal => navigation.navigate('DealDetail', { dealId: deal.id })}
            />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <DealCard
              deal={item}
              onPress={() => navigation.navigate('DealDetail', { dealId: item.id })}
              viewType="list"
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No deals found</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddDeal')}
              >
                <Text style={styles.emptyButtonText}>Create First Deal</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDeal')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        type="deals"
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
  pipelineSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pipelineText: {
    fontSize: 14,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kanbanContainer: {
    flex: 1,
  },
  kanbanColumn: {
    width: KANBAN_COLUMN_WIDTH,
    marginHorizontal: 8,
    marginTop: 16,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  columnBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  columnCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  columnContent: {
    flex: 1,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  kanbanCard: {
    marginHorizontal: 12,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  dealValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  dealCustomer: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dealProb: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4c6fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
