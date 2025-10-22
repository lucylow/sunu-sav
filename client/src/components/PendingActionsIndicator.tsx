// client/src/components/PendingActionsIndicator.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { offlineStorage } from '../services/offline/storage';

export function PendingActionsIndicator() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const actions = await offlineStorage.getPendingActions();
        setPendingCount(actions.length);
      } catch (error) {
        console.error('[PendingActionsIndicator] Error checking pending actions:', error);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.indicator} />
        <Text style={styles.text}>
          {pendingCount} action{pendingCount > 1 ? 's' : ''} pending sync
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
