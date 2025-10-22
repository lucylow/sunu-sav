// client/src/services/offline/networkMonitor.ts

import NetInfo from '@react-native-netinfo/netinfo';
import { useEffect, useState } from 'react';
import { NetworkQuality } from './types';

export class NetworkMonitor {
  private listeners: Set<(quality: NetworkQuality) => void> = new Set();
  private currentQuality: NetworkQuality = 'offline';
  private checkInterval: NodeJS.Timeout | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.startMonitoring();
  }

  startMonitoring() {
    // Initial check
    this.assessNetworkQuality();

    // Listen to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.handleNetworkStateChange(state);
    });

    // Periodic quality check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.assessNetworkQuality();
    }, 30000);
  }

  private handleNetworkStateChange(state: any) {
    if (!state.isConnected) {
      this.currentQuality = 'offline';
      this.notifyListeners();
      return;
    }

    // Assess quality based on connection type and speed
    this.assessNetworkQualityFromState(state);
  }

  private assessNetworkQualityFromState(state: any) {
    const { type, isConnected, isInternetReachable } = state;

    if (!isConnected || isInternetReachable === false) {
      this.currentQuality = 'offline';
    } else if (type === 'wifi') {
      // WiFi is generally good quality
      this.currentQuality = 'good';
    } else if (type === 'cellular') {
      // Cellular quality depends on generation
      const details = state.details;
      if (details?.cellularGeneration === '5g') {
        this.currentQuality = 'excellent';
      } else if (details?.cellularGeneration === '4g') {
        this.currentQuality = 'good';
      } else if (details?.cellularGeneration === '3g') {
        this.currentQuality = 'poor';
      } else {
        this.currentQuality = 'poor';
      }
    } else {
      this.currentQuality = 'poor';
    }

    this.notifyListeners();
  }

  async assessNetworkQuality() {
    try {
      const state = await NetInfo.fetch();
      this.assessNetworkQualityFromState(state);
    } catch (error) {
      console.error('[NetworkMonitor] Error assessing network quality:', error);
      this.currentQuality = 'offline';
      this.notifyListeners();
    }
  }

  getQuality(): NetworkQuality {
    return this.currentQuality;
  }

  isOnline(): boolean {
    return this.currentQuality !== 'offline';
  }

  isGoodConnection(): boolean {
    return this.currentQuality === 'good' || this.currentQuality === 'excellent';
  }

  isPoorConnection(): boolean {
    return this.currentQuality === 'poor';
  }

  subscribe(callback: (quality: NetworkQuality) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentQuality));
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export const networkMonitor = new NetworkMonitor();

// React hook for components
export function useNetworkQuality() {
  const [quality, setQuality] = useState<NetworkQuality>(networkMonitor.getQuality());

  useEffect(() => {
    return networkMonitor.subscribe(setQuality);
  }, []);

  return {
    quality,
    isOnline: quality !== 'offline',
    isPoor: quality === 'poor',
    isGood: quality === 'good' || quality === 'excellent',
    isExcellent: quality === 'excellent',
  };
}

// Additional hook for connection details
export function useNetworkDetails() {
  const [networkState, setNetworkState] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState(state);
    });

    // Get initial state
    NetInfo.fetch().then(setNetworkState);

    return unsubscribe;
  }, []);

  return {
    isConnected: networkState?.isConnected ?? false,
    type: networkState?.type,
    isInternetReachable: networkState?.isInternetReachable,
    details: networkState?.details,
  };
}
