// src/lib/api-client.ts
// API client for Lightning-powered Tontine backend
// Handles all communication with the FastAPI backend

export interface User {
  id: string;
  phone_number: string;
  public_key?: string;
  created_at: string;
  language: string;
}

export interface TontineGroup {
  id: string;
  name: string;
  description?: string;
  contribution_amount_sats: number;
  cycle_days: number;
  max_members: number;
  current_cycle: number;
  status: 'active' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  members?: GroupMember[];
  multi_sig_wallet?: MultiSigWallet;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  user?: User;
}

export interface Contribution {
  id: string;
  group_id: string;
  user_id: string;
  cycle_number: number;
  amount_sats: number;
  payment_request?: string;
  payment_hash?: string;
  status: 'pending' | 'paid' | 'confirmed';
  paid_at?: string;
  created_at: string;
}

export interface Payout {
  id: string;
  group_id: string;
  cycle_number: number;
  winner_user_id: string;
  amount_sats: number;
  payment_request?: string;
  payment_hash?: string;
  status: 'pending' | 'paid' | 'confirmed';
  paid_at?: string;
  created_at: string;
}

export interface MultiSigWallet {
  id: string;
  group_id: string;
  address: string;
  redeem_script: string;
  required_signatures: number;
  total_signatures: number;
  balance_sats: number;
  created_at: string;
}

export interface ContributionInvoice {
  payment_request: string;
  payment_hash: string;
  amount_sats: number;
  expiry: number;
}

export interface GroupStatus {
  group_id: string;
  current_cycle: number;
  total_contributions: number;
  total_amount: number;
  pending_contributions: number;
  cycle_progress: number;
  next_cycle_date?: string;
  winner?: string;
}

export interface LightningWebhook {
  payment_hash: string;
  status: string;
  amount_paid_sat: number;
  settled_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.loadAuthToken();
  }

  private loadAuthToken(): void {
    this.authToken = localStorage.getItem('sunu:auth_token');
  }

  private setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('sunu:auth_token', token);
  }

  private clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('sunu:auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication
  async authenticate(phoneNumber: string, otp?: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const endpoint = otp ? '/auth/verify' : '/auth/send-otp';
    const payload = otp 
      ? { phone_number: phoneNumber, otp }
      : { phone_number: phoneNumber };

    const response = await this.request<{ token: string; user: User }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearAuthToken();
  }

  // User management
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/user/me');
  }

  async updateUserProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Tontine groups
  async createTontineGroup(groupData: {
    name: string;
    description?: string;
    contribution_amount_sats: number;
    cycle_days: number;
    max_members: number;
  }): Promise<ApiResponse<TontineGroup>> {
    return this.request<TontineGroup>('/tontine/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async getTontineGroups(): Promise<ApiResponse<TontineGroup[]>> {
    return this.request<TontineGroup[]>('/tontine/groups');
  }

  async getTontineGroup(groupId: string): Promise<ApiResponse<TontineGroup>> {
    return this.request<TontineGroup>(`/tontine/groups/${groupId}`);
  }

  async joinTontineGroup(groupId: string): Promise<ApiResponse<GroupMember>> {
    return this.request<GroupMember>(`/tontine/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveTontineGroup(groupId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tontine/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getGroupStatus(groupId: string): Promise<ApiResponse<GroupStatus>> {
    return this.request<GroupStatus>(`/tontine/groups/${groupId}/status`);
  }

  // Contributions
  async getContributionInvoice(groupId: string): Promise<ApiResponse<ContributionInvoice>> {
    return this.request<ContributionInvoice>(`/tontine/groups/${groupId}/invoice`);
  }

  async getContributions(groupId: string, cycleNumber?: number): Promise<ApiResponse<Contribution[]>> {
    const endpoint = cycleNumber 
      ? `/tontine/groups/${groupId}/contributions?cycle=${cycleNumber}`
      : `/tontine/groups/${groupId}/contributions`;
    return this.request<Contribution[]>(endpoint);
  }

  async getMyContributions(): Promise<ApiResponse<Contribution[]>> {
    return this.request<Contribution[]>('/tontine/contributions/my');
  }

  // Payouts
  async getPayouts(groupId: string): Promise<ApiResponse<Payout[]>> {
    return this.request<Payout[]>(`/tontine/groups/${groupId}/payouts`);
  }

  async getMyPayouts(): Promise<ApiResponse<Payout[]>> {
    return this.request<Payout[]>('/tontine/payouts/my');
  }

  async createPayoutInvoice(groupId: string, amountSats: number): Promise<ApiResponse<ContributionInvoice>> {
    return this.request<ContributionInvoice>(`/tontine/groups/${groupId}/payout-invoice`, {
      method: 'POST',
      body: JSON.stringify({ amount_sats: amountSats }),
    });
  }

  // Lightning Network
  async checkInvoiceStatus(paymentHash: string): Promise<ApiResponse<{
    settled: boolean;
    state: string;
    amount_paid: number;
  }>> {
    return this.request(`/lightning/invoice/${paymentHash}/status`);
  }

  async payInvoice(paymentRequest: string): Promise<ApiResponse<{
    payment_hash: string;
    status: string;
    fee_msat: number;
  }>> {
    return this.request('/lightning/pay', {
      method: 'POST',
      body: JSON.stringify({ payment_request: paymentRequest }),
    });
  }

  // Multi-signature wallets
  async getGroupWallet(groupId: string): Promise<ApiResponse<MultiSigWallet>> {
    return this.request<MultiSigWallet>(`/tontine/groups/${groupId}/wallet`);
  }

  async getWalletBalance(groupId: string): Promise<ApiResponse<{ balance_sats: number }>> {
    return this.request<{ balance_sats: number }>(`/tontine/groups/${groupId}/wallet/balance`);
  }

  // Offline sync
  async syncPendingContributions(contributions: Array<{
    id: string;
    groupId: string;
    amountSats: number;
    createdAt: number;
  }>): Promise<ApiResponse<Array<{
    id: string;
    success: boolean;
    receiptHash?: string;
    error?: string;
  }>>> {
    return this.request('/sync/contributions', {
      method: 'POST',
      body: JSON.stringify({ contributions }),
    });
  }

  async getGroupUpdates(since?: number): Promise<ApiResponse<{
    groups: TontineGroup[];
    contributions: Contribution[];
    payouts: Payout[];
    lastUpdate: number;
  }>> {
    const endpoint = since 
      ? `/sync/updates?since=${since}`
      : '/sync/updates';
    return this.request(endpoint);
  }

  // Receipt verification
  async verifyReceipt(contributionId: string, receiptHash: string): Promise<ApiResponse<{
    valid: boolean;
    expected_hash: string;
    provided_hash: string;
    status: string;
    confirmed: boolean;
    onchain: boolean;
    onchain_txid?: string;
  }>> {
    return this.request('/verify/receipt', {
      method: 'POST',
      body: JSON.stringify({
        contribution_id: contributionId,
        receipt_hash: receiptHash,
      }),
    });
  }

  // Payout invoice generation
  async generatePayoutInvoice(groupId: string, amountSats: number, recipientUserId?: string): Promise<ApiResponse<{
    payout_id: string;
    invoice: string;
    method: string;
  }>> {
    return this.request('/payout/generate', {
      method: 'POST',
      body: JSON.stringify({
        group_id: groupId,
        amount_sats: amountSats,
        recipient_user_id: recipientUserId,
      }),
    });
  }

  // USSD/SMS fallback
  async submitUSSDContribution(groupId: string, amountSats: number, phoneNumber: string): Promise<ApiResponse<{
    success: boolean;
    ussd_code?: string;
    sms_confirmation?: string;
  }>> {
    return this.request('/ussd/contribute', {
      method: 'POST',
      body: JSON.stringify({
        group_id: groupId,
        amount_sats: amountSats,
        phone_number: phoneNumber,
      }),
    });
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>>> {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    version: string;
    lightning_connected: boolean;
    database_connected: boolean;
  }>> {
    return this.request('/health');
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Utility functions for common operations
export const createTontineGroup = async (groupData: Parameters<typeof apiClient.createTontineGroup>[0]) => {
  return apiClient.createTontineGroup(groupData);
};

export const joinGroup = async (groupId: string) => {
  return apiClient.joinTontineGroup(groupId);
};

export const getContributionInvoice = async (groupId: string) => {
  return apiClient.getContributionInvoice(groupId);
};

export const checkInvoiceStatus = async (paymentHash: string) => {
  return apiClient.checkInvoiceStatus(paymentHash);
};

export const syncPendingContributions = async (contributions: Parameters<typeof apiClient.syncPendingContributions>[0]) => {
  return apiClient.syncPendingContributions(contributions);
};

export const verifyReceipt = async (contributionId: string, receiptHash: string) => {
  return apiClient.verifyReceipt(contributionId, receiptHash);
};

export const generatePayoutInvoice = async (groupId: string, amountSats: number, recipientUserId?: string) => {
  return apiClient.generatePayoutInvoice(groupId, amountSats, recipientUserId);
};

export default apiClient;
