import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { linkToCompany, getLinkedCompanies, clearCustomerCache } from '../services/customerService';

const LinkCompanyScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const data = await getLinkedCompanies();
      const pending = (data.companies || []).filter(c => !c.verified);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCompany = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    setSearching(true);
    try {
      await linkToCompany(null, searchQuery);
      Alert.alert('Success', 'Link request sent successfully! The company will verify your request.', [
        {
          text: 'OK',
          onPress: () => {
            setSearchQuery('');
            setMatches([]);
            loadPendingRequests();
            clearCustomerCache();
          },
        },
      ]);
    } catch (error) {
      if (error.matches && Array.isArray(error.matches)) {
        setMatches(error.matches);
      } else if (error.detail && error.detail.includes('already linked')) {
        Alert.alert('Already Linked', 'You are already linked to this company.');
        setSearchQuery('');
      } else {
        const msg = error?.detail || error?.company_name?.[0] || 'Failed to link to company';
        Alert.alert('Error', msg);
      }
    } finally {
      setSearching(false);
    }
  };

  const linkById = async (companyId, companyName) => {
    setSearching(true);
    try {
      await linkToCompany(companyId);
      Alert.alert('Success', 'Link request sent successfully! The company will verify your request.', [
        {
          text: 'OK',
          onPress: () => {
            setSearchQuery('');
            setMatches([]);
            loadPendingRequests();
            clearCustomerCache();
          },
        },
      ]);
    } catch (error) {
      if (error.detail && error.detail.includes('already linked')) {
        Alert.alert('Already Linked', 'You are already linked to this company.');
      } else {
        const msg = error?.detail || 'Failed to link to company';
        Alert.alert('Error', msg);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Link Company</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0c4a6e" />
          <Text style={styles.infoText}>
            Search for a company by name. This will create a link request that the company admin needs to verify.
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter company name to search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
              onSubmitEditing={searchCompany}
              editable={!searching}
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, (!searchQuery.trim() || searching) && styles.searchButtonDisabled]}
            onPress={searchCompany}
            disabled={!searchQuery.trim() || searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="link" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Link Company</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Multiple Matches */}
        {matches.length > 0 && (
          <View style={styles.matchesBox}>
            <Text style={styles.matchesTitle}>Multiple companies found. Please select one:</Text>
            {matches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => linkById(match.id, match.name)}
                disabled={searching}
              >
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{match.name}</Text>
                  {match.city && (
                    <Text style={styles.matchCity}>📍 {match.city}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#667eea" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pending Requests */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#667eea" />
          </View>
        ) : pendingRequests.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>
              Pending Verification Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.map((req) => (
              <View key={req.id} style={styles.pendingCard}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{req.company_name}</Text>
                  <Text style={styles.pendingDate}>
                    Requested on {new Date(req.created_at).toLocaleDateString()} • Waiting for company approval
                  </Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>⏳ Pending</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  centerContainer: {
    padding: 20,
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
  content: {
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0c4a6e',
    marginLeft: 8,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1e293b',
  },
  searchButton: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchesBox: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  matchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  matchCity: {
    fontSize: 14,
    color: '#64748b',
  },
  pendingSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#92400e',
    marginBottom: 4,
  },
  pendingDate: {
    fontSize: 12,
    color: '#a16207',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fef3c7',
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
});

export default LinkCompanyScreen;

