// client/src/services/offline/offlineApi.ts

import { offlineStorage } from './storage';
import { networkMonitor } from './networkMonitor';
import { syncEngine } from './syncEngine';
import { trpcClient } from '../../lib/trpc';

/**
 * Wrapper for API calls that handles offline queueing
 */
export class OfflineApi {
  
  /**
   * Make a contribution (works offline)
   */
  async contribute(groupId: string, amount: number, memo?: string) {
    // If online and good connection, make direct API call
    if (networkMonitor.getQuality() === 'good' || networkMonitor.getQuality() === 'excellent') {
      try {
        return await trpcClientClient.tontine.contribute.mutate({ 
          groupId, 
          amount, 
          memo 
        });
      } catch (error) {
        // If API fails, fall back to offline queueing
        console.warn('[OfflineApi] Direct API call failed, queueing offline');
      }
    }

    // Queue for offline sync
    const actionId = await offlineStorage.queueAction({
      type: 'contribution',
      status: 'pending',
      data: { groupId, amount, memo },
    });

    // Return optimistic response
    return {
      success: true,
      pending: true,
      actionId,
      message: 'Contribution queued. Will sync when online.',
    };
  }

  /**
   * Join a group (works offline)
   */
  async joinGroup(groupId: string) {
    if (networkMonitor.isOnline()) {
      try {
        return await trpcClient.tontine.join.mutate({ groupId });
      } catch (error) {
        console.warn('[OfflineApi] Join group failed, queueing offline');
      }
    }

    const actionId = await offlineStorage.queueAction({
      type: 'group_join',
      status: 'pending',
      data: { groupId },
    });

    return {
      success: true,
      pending: true,
      actionId,
      message: 'Group join queued. Will sync when online.',
    };
  }

  /**
   * Request payout (works offline)
   */
  async requestPayout(groupId: string, cycle: number, winnerId: string) {
    if (networkMonitor.isOnline()) {
      try {
        return await trpcClient.payout.process.mutate({
          groupId,
          cycle,
          winnerId,
        });
      } catch (error) {
        console.warn('[OfflineApi] Payout request failed, queueing offline');
      }
    }

    const actionId = await offlineStorage.queueAction({
      type: 'payout_request',
      status: 'pending',
      data: { groupId, cycle, winnerId },
    });

    return {
      success: true,
      pending: true,
      actionId,
      message: 'Payout request queued. Will sync when online.',
    };
  }

  /**
   * Update profile (works offline)
   */
  async updateProfile(name: string, phoneNumber?: string) {
    if (networkMonitor.isOnline()) {
      try {
        return await trpcClient.auth.me.mutate({
          name,
          phoneNumber,
        });
      } catch (error) {
        console.warn('[OfflineApi] Profile update failed, queueing offline');
      }
    }

    const actionId = await offlineStorage.queueAction({
      type: 'profile_update',
      status: 'pending',
      data: { name, phoneNumber },
    });

    return {
      success: true,
      pending: true,
      actionId,
      message: 'Profile update queued. Will sync when online.',
    };
  }

  /**
   * Get groups (offline-first)
   */
  async getGroups() {
    // Try cache first
    const cached = await offlineStorage.getCachedData('groups');
    
    if (cached) {
      // Return cached immediately
      if (!networkMonitor.isOnline()) {
        return { data: cached, fromCache: true };
      }
      
      // Fetch fresh data in background
      syncEngine.sync();
      return { data: cached, fromCache: true };
    }

    // No cache, must fetch online
    if (!networkMonitor.isOnline()) {
      throw new Error('No cached data and network offline');
    }

    const groups = await trpcClient.tontine.list.query();
    await offlineStorage.cacheData('groups', groups);
    return { data: groups, fromCache: false };
  }

  /**
   * Get my groups (offline-first)
   */
  async getMyGroups() {
    const cached = await offlineStorage.getCachedData('myGroups');
    
    if (cached) {
      if (!networkMonitor.isOnline()) {
        return { data: cached, fromCache: true };
      }
      
      syncEngine.sync();
      return { data: cached, fromCache: true };
    }

    if (!networkMonitor.isOnline()) {
      throw new Error('No cached data and network offline');
    }

    const myGroups = await trpcClient.tontine.myGroups.query();
    await offlineStorage.cacheData('myGroups', myGroups);
    return { data: myGroups, fromCache: false };
  }

  /**
   * Get group details (offline-first)
   */
  async getGroup(groupId: string) {
    const cached = await offlineStorage.getCachedData(`group_${groupId}`);
    
    if (cached) {
      if (!networkMonitor.isOnline()) {
        return { data: cached, fromCache: true };
      }
      
      syncEngine.sync();
      return { data: cached, fromCache: true };
    }

    if (!networkMonitor.isOnline()) {
      throw new Error('No cached data and network offline');
    }

    const group = await trpcClient.tontine.getGroup.query({ id: groupId });
    await offlineStorage.cacheData(`group_${groupId}`, group);
    return { data: group, fromCache: false };
  }

  /**
   * Get contributions (offline-first)
   */
  async getContributions(groupId: string) {
    const cached = await offlineStorage.getCachedData(`contributions_${groupId}`);
    
    if (cached) {
      if (!networkMonitor.isOnline()) {
        return { data: cached, fromCache: true };
      }
      
      syncEngine.sync();
      return { data: cached, fromCache: true };
    }

    if (!networkMonitor.isOnline()) {
      throw new Error('No cached data and network offline');
    }

    const contributions = await trpcClient.tontine.getContributions.query({ groupId });
    await offlineStorage.cacheData(`contributions_${groupId}`, contributions);
    return { data: contributions, fromCache: false };
  }

  /**
   * Force sync now
   */
  async forceSync() {
    return syncEngine.forceSync();
  }

  /**
   * Get pending actions count
   */
  async getPendingActionsCount(): Promise<number> {
    const pendingActions = await offlineStorage.getPendingActions();
    return pendingActions.length;
  }

  /**
   * Get all actions for debugging
   */
  async getAllActions() {
    return offlineStorage.getAllActions();
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    // This would need to be implemented in the storage layer
    console.log('[OfflineApi] Clear cache requested');
  }
}

export const offlineApi = new OfflineApi();
