// client/src/components/OfflineIndicator.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkQuality } from '../services/offline/networkMonitor';

export function OfflineIndicator() {
  const { quality, isOnline } = useNetworkQuality();

  if (quality === 'excellent' || quality === 'good') {
    return null; // Don't show indicator when connection is good
  }

  const getStatusColor = () => {
    switch (quality) {
      case 'offline': return '#EF4444'; // red
      case 'poor': return '#F59E0B'; // yellow
      default: return '#6B7280'; // gray
    }
  };

  const getStatusText = () => {
    switch (quality) {
      case 'offline': return 'Offline Mode';
      case 'poor': return 'Slow Connection';
      default: return 'Connecting...';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <View style={styles.content}>
        <View style={styles.indicator} />
        <Text style={styles.text}>{getStatusText()}</Text>
        {quality === 'offline' && (
          <Text style={styles.subtext}>
            Actions will sync when online
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  subtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginLeft: 8,
  },
});
