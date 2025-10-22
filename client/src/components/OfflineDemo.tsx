// client/src/components/OfflineDemo.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert 
} from 'react-native';
import { offlineApi } from '../services/offline/offlineApi';
import { offlineStorage } from '../services/offline/storage';
import { useNetworkQuality } from '../services/offline/networkMonitor';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncButton } from './SyncButton';
import { PendingActionsIndicator } from './PendingActionsIndicator';

export function OfflineDemo() {
  const [pendingCount, setPendingCount] = useState(0);
  const [cachedGroups, setCachedGroups] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { quality, isOnline } = useNetworkQuality();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const pending = await offlineApi.getPendingActionsCount();
      setPendingCount(pending);

      const groups = await offlineStorage.getCachedData('groups');
      if (groups) {
        setCachedGroups(groups);
      }

      const metadata = await offlineStorage.getSyncMetadata();
      if (metadata) {
        setLastSync(new Date(metadata.lastSync));
      }
    } catch (error) {
      console.error('[OfflineDemo] Error loading data:', error);
    }
  };

  const handleTestContribution = async () => {
    try {
      const result = await offlineApi.contribute(
        'demo-group-1',
        10000,
        'Demo contribution from offline mode'
      );

      if (result.pending) {
        Alert.alert(
          '✅ Contribution Queued!',
          'Your contribution has been queued for sync when online.',
          [{ text: 'OK', onPress: loadData }]
        );
      } else {
        Alert.alert('✅ Contribution Successful!', 'Your contribution was processed immediately.');
        loadData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process contribution');
    }
  };

  const handleTestGroupJoin = async () => {
    try {
      const result = await offlineApi.joinGroup('demo-group-2');

      if (result.pending) {
        Alert.alert(
          '✅ Group Join Queued!',
          'Your group join request has been queued for sync when online.',
          [{ text: 'OK', onPress: loadData }]
        );
      } else {
        Alert.alert('✅ Group Join Successful!', 'You have joined the group.');
        loadData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    }
  };

  const handleViewPendingActions = async () => {
    try {
      const actions = await offlineApi.getAllActions();
      const pendingActions = actions.filter(action => action.status === 'pending');
      
      if (pendingActions.length === 0) {
        Alert.alert('No Pending Actions', 'All actions have been synced.');
        return;
      }

      const actionList = pendingActions.map(action => 
        `• ${action.type}: ${action.data.amount ? `${action.data.amount} sats` : action.data.groupId}`
      ).join('\n');

      Alert.alert(
        'Pending Actions',
        `${pendingActions.length} actions waiting to sync:\n\n${actionList}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending actions');
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'poor': return '#F59E0B';
      case 'offline': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getQualityText = () => {
    switch (quality) {
      case 'excellent': return 'Excellent Connection';
      case 'good': return 'Good Connection';
      case 'poor': return 'Poor Connection';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <OfflineIndicator />
      
      <View style={styles.header}>
        <Text style={styles.title}>Offline-First Demo</Text>
        <Text style={styles.subtitle}>SunuSàv Offline Capabilities</Text>
      </View>

      {/* Network Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        <View style={[styles.statusCard, { backgroundColor: getQualityColor() }]}>
          <Text style={styles.statusText}>{getQualityText()}</Text>
          <Text style={styles.statusSubtext}>
            {isOnline ? 'Online' : 'Offline'} • {pendingCount} pending actions
          </Text>
        </View>
      </View>

      {/* Sync Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Last Sync: {lastSync ? lastSync.toLocaleString() : 'Never'}
          </Text>
          <Text style={styles.infoText}>
            Cached Groups: {cachedGroups.length}
          </Text>
          <Text style={styles.infoText}>
            Pending Actions: {pendingCount}
          </Text>
        </View>
        <SyncButton />
      </View>

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Offline Actions</Text>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={handleTestContribution}
        >
          <Text style={styles.testButtonText}>
            📱 Test Contribution (Works Offline)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={handleTestGroupJoin}
        >
          <Text style={styles.testButtonText}>
            👥 Test Group Join (Works Offline)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={handleViewPendingActions}
        >
          <Text style={styles.testButtonText}>
            📋 View Pending Actions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Features</Text>
        <View style={styles.featuresList}>
          <Text style={styles.featureItem}>✅ Queue contributions offline</Text>
          <Text style={styles.featureItem}>✅ Join groups offline</Text>
          <Text style={styles.featureItem}>✅ View cached group data</Text>
          <Text style={styles.featureItem}>✅ Automatic sync when online</Text>
          <Text style={styles.featureItem}>✅ Conflict resolution</Text>
          <Text style={styles.featureItem}>✅ Retry failed actions</Text>
          <Text style={styles.featureItem}>✅ Network quality detection</Text>
          <Text style={styles.featureItem}>✅ Local SQLite storage</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Test</Text>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionText}>
            1. Turn off your internet connection
          </Text>
          <Text style={styles.instructionText}>
            2. Try making a contribution - it will be queued
          </Text>
          <Text style={styles.instructionText}>
            3. Turn internet back on
          </Text>
          <Text style={styles.instructionText}>
            4. Watch the actions sync automatically
          </Text>
        </View>
      </View>

      <PendingActionsIndicator />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresList: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureItem: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
});
