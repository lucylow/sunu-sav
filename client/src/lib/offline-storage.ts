// src/lib/offline-storage.ts
// Offline-first data layer for SunuSàv
// Handles local storage, caching, and sync queue management

export interface PendingContribution {
  id: string;
  groupId: string;
  amountSats: number;
  createdAt: number;
  status: 'pending' | 'submitted' | 'failed' | 'retrying';
  retryCount: number;
  lastRetryAt?: number;
  receiptHash?: string;
  errorMessage?: string;
}

export interface CachedGroupData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalAmount: number;
  contributionAmount: number;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  nextContributionDate: string;
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    lastContribution?: number;
  }>;
  lastUpdated: number;
  version: number;
}

export interface SyncStatus {
  lastSyncAt: number;
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  syncInProgress: boolean;
}

export interface OfflineSettings {
  syncOnlyOnWifi: boolean;
  autoSyncEnabled: boolean;
  maxRetryAttempts: number;
  syncInterval: number; // milliseconds
}

class OfflineStorage {
  private storage: Storage;
  private settings: OfflineSettings;

  constructor() {
    this.storage = localStorage;
    this.settings = {
      syncOnlyOnWifi: false,
      autoSyncEnabled: true,
      maxRetryAttempts: 3,
      syncInterval: 30000, // 30 seconds
    };
    this.loadSettings();
  }

  // Settings management
  private loadSettings(): void {
    const saved = this.storage.getItem('sunu:settings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  saveSettings(settings: Partial<OfflineSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.storage.setItem('sunu:settings', JSON.stringify(this.settings));
  }

  getSettings(): OfflineSettings {
    return { ...this.settings };
  }

  // Contribution queue management
  async addPendingContribution(
    groupId: string, 
    amountSats: number,
    metadata?: Record<string, any>
  ): Promise<PendingContribution> {
    const contribution: PendingContribution = {
      id: this.generateId(),
      groupId,
      amountSats,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      ...metadata,
    };

    const queue = await this.getPendingContributions();
    queue.push(contribution);
    await this.savePendingContributions(queue);
    
    return contribution;
  }

  async getPendingContributions(): Promise<PendingContribution[]> {
    const data = this.storage.getItem('sunu:pending_contributions');
    return data ? JSON.parse(data) : [];
  }

  private async savePendingContributions(contributions: PendingContribution[]): Promise<void> {
    this.storage.setItem('sunu:pending_contributions', JSON.stringify(contributions));
  }

  async updateContributionStatus(
    id: string, 
    status: PendingContribution['status'],
    errorMessage?: string
  ): Promise<void> {
    const queue = await this.getPendingContributions();
    const index = queue.findIndex(c => c.id === id);
    
    if (index !== -1) {
      queue[index] = {
        ...queue[index],
        status,
        errorMessage,
        lastRetryAt: status === 'retrying' ? Date.now() : queue[index].lastRetryAt,
        retryCount: status === 'retrying' ? queue[index].retryCount + 1 : queue[index].retryCount,
      };
      await this.savePendingContributions(queue);
    }
  }

  async removeContribution(id: string): Promise<void> {
    const queue = await this.getPendingContributions();
    const filtered = queue.filter(c => c.id !== id);
    await this.savePendingContributions(filtered);
  }

  async clearSubmittedContributions(): Promise<void> {
    const queue = await this.getPendingContributions();
    const pending = queue.filter(c => c.status !== 'submitted');
    await this.savePendingContributions(pending);
  }

  // Group data caching
  async cacheGroupData(groupData: CachedGroupData): Promise<void> {
    const cacheKey = `sunu:group:${groupData.id}`;
    const cached = {
      ...groupData,
      lastUpdated: Date.now(),
      version: (groupData.version || 0) + 1,
    };
    this.storage.setItem(cacheKey, JSON.stringify(cached));
  }

  async getCachedGroupData(groupId: string): Promise<CachedGroupData | null> {
    const cacheKey = `sunu:group:${groupId}`;
    const data = this.storage.getItem(cacheKey);
    return data ? JSON.parse(data) : null;
  }

  async getAllCachedGroups(): Promise<CachedGroupData[]> {
    const groups: CachedGroupData[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith('sunu:group:')) {
        const data = this.storage.getItem(key);
        if (data) {
          groups.push(JSON.parse(data));
        }
      }
    }
    return groups;
  }

  // Sync status management
  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    const current = await this.getSyncStatus();
    const updated = { ...current, ...status };
    this.storage.setItem('sunu:sync_status', JSON.stringify(updated));
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const data = this.storage.getItem('sunu:sync_status');
    return data ? JSON.parse(data) : {
      lastSyncAt: 0,
      isOnline: false,
      pendingCount: 0,
      failedCount: 0,
      syncInProgress: false,
    };
  }

  // Receipt verification
  async storeReceiptHash(contributionId: string, receiptHash: string): Promise<void> {
    const receipts = await this.getReceiptHashes();
    receipts[contributionId] = {
      hash: receiptHash,
      storedAt: Date.now(),
    };
    this.storage.setItem('sunu:receipts', JSON.stringify(receipts));
  }

  async getReceiptHashes(): Promise<Record<string, { hash: string; storedAt: number }>> {
    const data = this.storage.getItem('sunu:receipts');
    return data ? JSON.parse(data) : {};
  }

  async getReceiptHash(contributionId: string): Promise<string | null> {
    const receipts = await this.getReceiptHashes();
    return receipts[contributionId]?.hash || null;
  }

  // Data integrity and cleanup
  async cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    
    // Clean up old cached groups
    const groups = await this.getAllCachedGroups();
    for (const group of groups) {
      if (now - group.lastUpdated > maxAge) {
        this.storage.removeItem(`sunu:group:${group.id}`);
      }
    }

    // Clean up old receipts
    const receipts = await this.getReceiptHashes();
    for (const [id, receipt] of Object.entries(receipts)) {
      if (now - receipt.storedAt > maxAge) {
        delete receipts[id];
      }
    }
    this.storage.setItem('sunu:receipts', JSON.stringify(receipts));
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getStorageStats(): Promise<{
    totalSize: number;
    contributionCount: number;
    groupCount: number;
    receiptCount: number;
  }> {
    let totalSize = 0;
    let contributionCount = 0;
    let groupCount = 0;
    let receiptCount = 0;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith('sunu:')) {
        const value = this.storage.getItem(key);
        if (value) {
          totalSize += value.length;
          
          if (key === 'sunu:pending_contributions') {
            contributionCount = JSON.parse(value).length;
          } else if (key.startsWith('sunu:group:')) {
            groupCount++;
          } else if (key === 'sunu:receipts') {
            receiptCount = Object.keys(JSON.parse(value)).length;
          }
        }
      }
    }

    return {
      totalSize,
      contributionCount,
      groupCount,
      receiptCount,
    };
  }

  // Export/Import for data migration
  async exportData(): Promise<string> {
    const data: Record<string, any> = {};
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith('sunu:')) {
        const value = this.storage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
    }
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('sunu:')) {
        this.storage.setItem(key, JSON.stringify(value));
      }
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Utility functions for common operations
export const createOfflineContribution = async (
  groupId: string,
  amountSats: number,
  metadata?: Record<string, any>
): Promise<PendingContribution> => {
  return offlineStorage.addPendingContribution(groupId, amountSats, metadata);
};

export const getOfflineContributions = async (): Promise<PendingContribution[]> => {
  return offlineStorage.getPendingContributions();
};

export const updateOfflineContribution = async (
  id: string,
  status: PendingContribution['status'],
  errorMessage?: string
): Promise<void> => {
  return offlineStorage.updateContributionStatus(id, status, errorMessage);
};

export const cacheGroupOffline = async (groupData: CachedGroupData): Promise<void> => {
  return offlineStorage.cacheGroupData(groupData);
};

export const getCachedGroup = async (groupId: string): Promise<CachedGroupData | null> => {
  return offlineStorage.getCachedGroupData(groupId);
};

export const storeReceiptOffline = async (
  contributionId: string,
  receiptHash: string
): Promise<void> => {
  return offlineStorage.storeReceiptHash(contributionId, receiptHash);
};

export default offlineStorage;
