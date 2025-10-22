// client/src/services/offline/syncEngine.ts

import { offlineStorage } from './storage';
import { networkMonitor } from './networkMonitor';
import { SyncResult, OfflineAction, SyncStatus } from './types';
import { trpc } from '../../lib/trpc';

export class SyncEngine {
  private isSyncing = false;
  private syncListeners: Set<(result: SyncResult) => void> = new Set();
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-sync when network comes back online
    networkMonitor.subscribe((quality) => {
      if (quality !== 'offline' && !this.isSyncing) {
        // Delay sync slightly to ensure network is stable
        setTimeout(() => {
          this.sync();
        }, 2000);
      }
    });

    // Periodic auto-sync every 2 minutes if online
    this.autoSyncInterval = setInterval(() => {
      if (networkMonitor.isOnline() && !this.isSyncing) {
        this.sync();
      }
    }, 120000); // 2 minutes
  }

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncEngine] Sync already in progress, skipping');
      return { success: false, synced: 0, failed: 0, conflicts: [] };
    }

    if (!networkMonitor.isOnline()) {
      console.log('[SyncEngine] Network offline, skipping sync');
      return { success: false, synced: 0, failed: 0, conflicts: [] };
    }

    this.isSyncing = true;
    console.log('[SyncEngine] Starting sync...');

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: [],
    };

    try {
      // 1. Sync pending actions (uploads)
      const pendingActions = await offlineStorage.getPendingActions();
      console.log(`[SyncEngine] Found ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        // Skip if too many retries (max 5)
        if (action.retryCount >= 5) {
          await offlineStorage.updateActionStatus(action.id, 'failed', 'Max retries exceeded');
          result.failed++;
          continue;
        }

        try {
          await offlineStorage.updateActionStatus(action.id, 'syncing');
          
          switch (action.type) {
            case 'contribution':
              await this.syncContribution(action);
              break;
            case 'group_join':
              await this.syncGroupJoin(action);
              break;
            case 'payout_request':
              await this.syncPayoutRequest(action);
              break;
            case 'profile_update':
              await this.syncProfileUpdate(action);
              break;
          }

          await offlineStorage.updateActionStatus(action.id, 'synced');
          result.synced++;
          console.log(`[SyncEngine] Successfully synced action ${action.id}`);
        } catch (error: any) {
          console.error(`[SyncEngine] Failed to sync action ${action.id}:`, error);
          
          if (error.message?.includes('conflict') || error.message?.includes('duplicate')) {
            await offlineStorage.updateActionStatus(action.id, 'conflict', error.message);
            result.conflicts.push(action);
          } else {
            await offlineStorage.updateActionStatus(action.id, 'failed', error.message);
            result.failed++;
          }
        }
      }

      // 2. Fetch latest data (downloads)
      await this.fetchLatestData();

      // 3. Cleanup old synced actions
      await offlineStorage.cleanupOldActions();

      console.log('[SyncEngine] Sync complete:', result);
    } catch (error) {
      console.error('[SyncEngine] Sync error:', error);
      result.success = false;
    } finally {
      this.isSyncing = false;
      this.notifySyncListeners(result);
    }

    return result;
  }

  private async syncContribution(action: OfflineAction) {
    const { groupId, amount, memo } = action.data;
    
    try {
      // Call your tRPC endpoint
      const result = await trpc.tontine.contribute.mutate({
        groupId,
        amount,
        memo,
        timestamp: action.timestamp, // Include original timestamp for idempotency
      });

      if (!result.success) {
        throw new Error(result.error || 'Contribution failed');
      }
    } catch (error: any) {
      // Check if it's a duplicate/conflict
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        throw new Error('conflict: Contribution already exists');
      }
      throw error;
    }
  }

  private async syncGroupJoin(action: OfflineAction) {
    const { groupId } = action.data;
    
    try {
      const result = await trpc.tontine.join.mutate({
        groupId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Group join failed');
      }
    } catch (error: any) {
      if (error.message?.includes('already a member') || error.message?.includes('duplicate')) {
        throw new Error('conflict: Already a member');
      }
      throw error;
    }
  }

  private async syncPayoutRequest(action: OfflineAction) {
    const { groupId, cycle } = action.data;
    
    try {
      const result = await trpc.payout.process.mutate({
        groupId,
        cycle,
        winnerId: action.data.winnerId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Payout request failed');
      }
    } catch (error: any) {
      if (error.message?.includes('already processed') || error.message?.includes('duplicate')) {
        throw new Error('conflict: Payout already processed');
      }
      throw error;
    }
  }

  private async syncProfileUpdate(action: OfflineAction) {
    const { name, phoneNumber } = action.data;
    
    try {
      const result = await trpc.auth.me.mutate({
        name,
        phoneNumber,
      });

      if (!result.success) {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  private async fetchLatestData() {
    try {
      const metadata = await offlineStorage.getSyncMetadata();
      const lastSync = metadata?.lastSync || 0;

      // Fetch groups
      const groups = await trpc.tontine.list.query();
      await offlineStorage.cacheData('groups', groups);

      // Fetch user's groups
      const myGroups = await trpc.tontine.myGroups.query();
      await offlineStorage.cacheData('myGroups', myGroups);

      // Fetch contributions
      const contributions = await trpc.tontine.getContributions.query({
        groupId: '', // This would need to be implemented properly
      });
      await offlineStorage.cacheData('contributions', contributions);

      // Update sync metadata
      await offlineStorage.updateSyncMetadata(Date.now(), (metadata?.version || 0) + 1);
      
      console.log('[SyncEngine] Successfully fetched latest data');
    } catch (error) {
      console.error('[SyncEngine] Error fetching latest data:', error);
      // Don't throw here, as this is not critical for sync success
    }
  }

  subscribe(callback: (result: SyncResult) => void) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifySyncListeners(result: SyncResult) {
    this.syncListeners.forEach(listener => listener(result));
  }

  // Get sync status
  getSyncStatus(): { isSyncing: boolean; lastSync?: number } {
    return {
      isSyncing: this.isSyncing,
    };
  }

  // Force sync now
  async forceSync(): Promise<SyncResult> {
    console.log('[SyncEngine] Force sync requested');
    return this.sync();
  }

  destroy() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
  }
}

export const syncEngine = new SyncEngine();
