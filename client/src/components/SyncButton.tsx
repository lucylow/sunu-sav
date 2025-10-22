// client/src/components/SyncButton.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { syncEngine } from '../services/offline/syncEngine';
import { useNetworkQuality } from '../services/offline/networkMonitor';

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const { isOnline } = useNetworkQuality();

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Cannot Sync', 'Cannot sync while offline');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncEngine.forceSync();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Synced ${result.synced} actions. ${result.failed} failed.`
        );
      } else {
        Alert.alert('Sync Failed', 'Sync failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Sync error. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSync}
      disabled={!isOnline || syncing}
      style={[
        styles.button,
        (!isOnline || syncing) && styles.buttonDisabled
      ]}
    >
      <Text style={styles.buttonText}>
        {syncing ? 'Syncing...' : 'Sync Now'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
