// src/lib/sync-engine.ts
// Offline-first sync engine for SunuSàv
// Handles connectivity detection, queue processing, and data synchronization

import { offlineStorage, PendingContribution, CachedGroupData, SyncStatus } from './offline-storage';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  timestamp: number;
}

export interface SyncOptions {
  forceSync?: boolean;
  syncOnlyPending?: boolean;
  maxRetries?: number;
  timeout?: number;
}

class SyncEngine {
  private isRunning = false;
  private syncInProgress = false;
  private connectivityListeners: Array<(isOnline: boolean) => void> = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncAttempt = 0;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.initializeConnectivityDetection();
  }

  // Initialize connectivity detection
  private initializeConnectivityDetection(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleConnectivityChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleConnectivityChange(false);
    });

    // Initial connectivity check
    this.handleConnectivityChange(navigator.onLine);
  }

  private handleConnectivityChange(isOnline: boolean): void {
    offlineStorage.updateSyncStatus({ isOnline });
    
    // Notify listeners
    this.connectivityListeners.forEach(listener => listener(isOnline));

    if (isOnline && !this.syncInProgress) {
      // Auto-sync when coming online
      this.scheduleSync();
    }
  }

  // Start the sync engine
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const settings = offlineStorage.getSettings();
    
    if (settings.autoSyncEnabled) {
      this.startPeriodicSync();
    }
    
    // Initial sync if online
    if (navigator.onLine) {
      this.scheduleSync();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Schedule sync with debouncing
  private scheduleSync(): void {
    const now = Date.now();
    const minInterval = 5000; // 5 seconds minimum between syncs
    
    if (now - this.lastSyncAttempt < minInterval) {
      return;
    }
    
    this.lastSyncAttempt = now;
    setTimeout(() => this.performSync(), 1000);
  }

  // Start periodic sync
  private startPeriodicSync(): void {
    const settings = offlineStorage.getSettings();
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.scheduleSync();
      }
    }, settings.syncInterval);
  }

  // Main sync method
  async performSync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress && !options.forceSync) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    this.syncInProgress = true;
    offlineStorage.updateSyncStatus({ syncInProgress: true });

    try {
      const result = await this.executeSync(options);
      await offlineStorage.updateSyncStatus({
        lastSyncAt: Date.now(),
        syncInProgress: false,
        pendingCount: result.processed,
        failedCount: result.failed,
      });
      
      return result;
    } catch (error) {
      await offlineStorage.updateSyncStatus({
        syncInProgress: false,
      });
      
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: Date.now(),
      };
    }
  }

  // Execute the actual sync
  private async executeSync(options: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      timestamp: Date.now(),
    };

    // Sync pending contributions
    if (!options.syncOnlyPending) {
      const contributionResult = await this.syncPendingContributions(options);
      result.processed += contributionResult.processed;
      result.failed += contributionResult.failed;
      result.errors.push(...contributionResult.errors);
    }

    // Sync group data
    const groupResult = await this.syncGroupData();
    result.errors.push(...groupResult.errors);

    // Clean up old data
    await offlineStorage.cleanupOldData();

    return result;
  }

  // Sync pending contributions
  private async syncPendingContributions(options: SyncOptions): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    const pending = await offlineStorage.getPendingContributions();
    const settings = offlineStorage.getSettings();
    const maxRetries = options.maxRetries || settings.maxRetryAttempts;
    
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const contribution of pending) {
      // Skip if already at max retries
      if (contribution.retryCount >= maxRetries && contribution.status === 'failed') {
        continue;
      }

      try {
        const success = await this.submitContribution(contribution);
        
        if (success) {
          await offlineStorage.updateContributionStatus(contribution.id, 'submitted');
          processed++;
        } else {
          await offlineStorage.updateContributionStatus(
            contribution.id, 
            'failed',
            'Submission failed'
          );
          failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await offlineStorage.updateContributionStatus(
          contribution.id,
          'retrying',
          errorMessage
        );
        errors.push(`Contribution ${contribution.id}: ${errorMessage}`);
        failed++;
      }
    }

    // Clean up submitted contributions
    await offlineStorage.clearSubmittedContributions();

    return { processed, failed, errors };
  }

  // Submit individual contribution
  private async submitContribution(contribution: PendingContribution): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tontine/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: contribution.groupId,
          amountSats: contribution.amountSats,
          createdAt: contribution.createdAt,
          id: contribution.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.receiptHash) {
        await offlineStorage.storeReceiptHash(contribution.id, data.receiptHash);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to submit contribution:', error);
      throw error;
    }
  }

  // Sync group data
  private async syncGroupData(): Promise<{ errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/tontine/groups`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const groups: CachedGroupData[] = await response.json();
      
      for (const group of groups) {
        await offlineStorage.cacheGroupData(group);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Group sync failed: ${errorMessage}`);
    }

    return { errors };
  }

  // Manual sync trigger
  async forceSync(): Promise<SyncResult> {
    return this.performSync({ forceSync: true });
  }

  // Retry failed contributions
  async retryFailedContributions(): Promise<SyncResult> {
    const pending = await offlineStorage.getPendingContributions();
    const failed = pending.filter(c => c.status === 'failed');
    
    // Reset retry count for failed contributions
    for (const contribution of failed) {
      await offlineStorage.updateContributionStatus(contribution.id, 'pending');
    }
    
    return this.performSync();
  }

  // Connectivity status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Add connectivity listener
  addConnectivityListener(listener: (isOnline: boolean) => void): () => void {
    this.connectivityListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectivityListeners.indexOf(listener);
      if (index > -1) {
        this.connectivityListeners.splice(index, 1);
      }
    };
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    return offlineStorage.getSyncStatus();
  }

  // Verify receipt
  async verifyReceipt(contributionId: string, receiptHash: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/verify/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contribution_id: contributionId,
          receipt_hash: receiptHash,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Receipt verification failed:', error);
      return false;
    }
  }

  // Generate payout invoice
  async generatePayoutInvoice(
    groupId: string,
    amountSats: number,
    recipientUserId?: string
  ): Promise<{ payoutId: string; invoice: string } | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payout/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          amount_sats: amountSats,
          recipient_user_id: recipientUserId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        payoutId: data.payout_id,
        invoice: data.invoice,
      };
    } catch (error) {
      console.error('Payout invoice generation failed:', error);
      return null;
    }
  }

  // USSD fallback integration
  async submitUSSDContribution(
    groupId: string,
    amountSats: number,
    phoneNumber: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ussd/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          amount_sats: amountSats,
          phone_number: phoneNumber,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('USSD contribution failed:', error);
      return false;
    }
  }

  // Get storage statistics
  async getStorageStats() {
    return offlineStorage.getStorageStats();
  }

  // Export/Import data
  async exportData(): Promise<string> {
    return offlineStorage.exportData();
  }

  async importData(jsonData: string): Promise<void> {
    return offlineStorage.importData(jsonData);
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();

// Utility functions
export const startSyncEngine = (): void => {
  syncEngine.start();
};

export const stopSyncEngine = (): void => {
  syncEngine.stop();
};

export const forceSync = (): Promise<SyncResult> => {
  return syncEngine.forceSync();
};

export const retryFailedContributions = (): Promise<SyncResult> => {
  return syncEngine.retryFailedContributions();
};

export const addConnectivityListener = (listener: (isOnline: boolean) => void): (() => void) => {
  return syncEngine.addConnectivityListener(listener);
};

export const isOnline = (): boolean => {
  return syncEngine.isOnline();
};

export const getSyncStatus = (): Promise<SyncStatus> => {
  return syncEngine.getSyncStatus();
};

export const verifyReceipt = (contributionId: string, receiptHash: string): Promise<boolean> => {
  return syncEngine.verifyReceipt(contributionId, receiptHash);
};

export const generatePayoutInvoice = (
  groupId: string,
  amountSats: number,
  recipientUserId?: string
): Promise<{ payoutId: string; invoice: string } | null> => {
  return syncEngine.generatePayoutInvoice(groupId, amountSats, recipientUserId);
};

export default syncEngine;
