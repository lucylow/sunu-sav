// client/src/services/offline/types.ts

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type NetworkQuality = 'offline' | 'poor' | 'good' | 'excellent';

export interface OfflineAction {
  id: string;
  type: 'contribution' | 'group_join' | 'payout_request' | 'profile_update';
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  lastAttempt?: number;
  data: any;
  error?: string;
}

export interface CachedData {
  groups: GroupData[];
  contributions: ContributionData[];
  cycles: CycleData[];
  lastSync: number;
  version: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: OfflineAction[];
}

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  contributionAmount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  maxMembers: number;
  currentMembers: number;
  status: 'active' | 'completed' | 'cancelled';
  multiSigAddress?: string;
  currentCycle: number;
  createdAt: string;
  nextPayoutDate?: string;
}

export interface ContributionData {
  id: string;
  groupId: string;
  userId: string;
  amount: number;
  cycle: number;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
}

export interface CycleData {
  id: string;
  groupId: string;
  cycleNumber: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  winnerId?: string;
  totalAmount: number;
}
