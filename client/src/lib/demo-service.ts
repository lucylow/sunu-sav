// client/src/lib/demo-service.ts
/**
 * Demo Service for SunuSàv Hackathon
 * Integrates Senegalese mock data with security framework
 */

import { 
  senegaleseUsers, 
  senegaleseTontineGroups, 
  groupMemberships, 
  contributionHistory, 
  payoutHistory, 
  userNotifications,
  senegalMarketData,
  hackathonDemoScenarios,
  demoSummary
} from './mock-data/senegalese-users';
import { securityIntegration } from './security/integration';

export interface DemoUser {
  id: string;
  phoneNumber: string;
  publicKey: string;
  language: string;
  createdAt: Date;
  profile: {
    name: string;
    age: number;
    occupation: string;
    market: string;
    weeklyIncome: number;
    businessType: string;
    location: string;
    educationLevel: string;
    tontineExperience: number;
    preferredPayment: string;
    deviceType: string;
  };
}

export interface DemoGroup {
  id: string;
  name: string;
  description: string;
  contributionAmount: number;
  cycleDays: number;
  maxMembers: number;
  currentMembers: number;
  currentCycle: number;
  status: string;
  createdBy: string;
  nextPayoutDate: Date;
  createdAt: Date;
  frequency: string;
  rules: {
    meetingDay: string;
    meetingTime: string;
    location: string;
    purpose: string;
    penaltyLate: number;
    emergencyLoan: boolean;
    socialFund: boolean;
  };
}

export interface DemoContribution {
  id: string;
  groupId: string;
  userId: string;
  cycleNumber: number;
  amountSats: number;
  paymentRequest: string;
  paymentHash: string;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface DemoPayout {
  id: string;
  groupId: string;
  cycleNumber: number;
  winnerUserId: string;
  amountSats: number;
  paymentRequest: string;
  paymentHash: string;
  status: string;
  paidAt: Date;
  createdAt: Date;
  waveTransactionId: string;
  localCurrencyAmount: number;
  exchangeRateUsed: number;
}

export interface DemoNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
}

export class DemoService {
  private static instance: DemoService;
  private currentUser: DemoUser | null = null;
  private isDemoMode = true;

  static getInstance(): DemoService {
    if (!DemoService.instance) {
      DemoService.instance = new DemoService();
    }
    return DemoService.instance;
  }

  /**
   * Initialize demo mode with security integration
   */
  async initializeDemo(): Promise<void> {
    try {
      // Initialize security framework
      await securityIntegration.initialize();
      
      // Set demo mode
      this.isDemoMode = true;
      
      console.log('🎯 Demo mode initialized with Senegalese market data');
      console.log('📊 Available data:', {
        users: senegaleseUsers.length,
        groups: senegaleseTontineGroups.length,
        contributions: contributionHistory.length,
        payouts: payoutHistory.length
      });
      
    } catch (error) {
      console.error('Failed to initialize demo:', error);
      throw error;
    }
  }

  /**
   * Get all demo users
   */
  getUsers(): DemoUser[] {
    return senegaleseUsers;
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): DemoUser | null {
    return senegaleseUsers.find(user => user.id === userId) || null;
  }

  /**
   * Set current demo user
   */
  setCurrentUser(user: DemoUser): void {
    this.currentUser = user;
    console.log(`👤 Demo user set: ${user.profile.name} (${user.profile.occupation})`);
  }

  /**
   * Get current demo user
   */
  getCurrentUser(): DemoUser | null {
    return this.currentUser;
  }

  /**
   * Get all demo groups
   */
  getGroups(): DemoGroup[] {
    return senegaleseTontineGroups;
  }

  /**
   * Get groups for current user
   */
  getUserGroups(userId?: string): DemoGroup[] {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) return [];

    const userMemberships = groupMemberships.filter(
      membership => membership.userId === targetUserId && membership.isActive
    );

    return senegaleseTontineGroups.filter(group =>
      userMemberships.some(membership => membership.groupId === group.id)
    );
  }

  /**
   * Get group by ID
   */
  getGroupById(groupId: string): DemoGroup | null {
    return senegaleseTontineGroups.find(group => group.id === groupId) || null;
  }

  /**
   * Get group members
   */
  getGroupMembers(groupId: string): DemoUser[] {
    const memberships = groupMemberships.filter(
      membership => membership.groupId === groupId && membership.isActive
    );

    return memberships.map(membership => 
      this.getUserById(membership.userId)
    ).filter(user => user !== null) as DemoUser[];
  }

  /**
   * Get contributions for a group
   */
  getGroupContributions(groupId: string): DemoContribution[] {
    return contributionHistory.filter(contribution => contribution.groupId === groupId);
  }

  /**
   * Get contributions for current cycle
   */
  getCurrentCycleContributions(groupId: string): DemoContribution[] {
    const group = this.getGroupById(groupId);
    if (!group) return [];

    return contributionHistory.filter(
      contribution => 
        contribution.groupId === groupId && 
        contribution.cycleNumber === group.currentCycle
    );
  }

  /**
   * Get payouts for a group
   */
  getGroupPayouts(groupId: string): DemoPayout[] {
    return payoutHistory.filter(payout => payout.groupId === groupId);
  }

  /**
   * Get notifications for current user
   */
  getUserNotifications(userId?: string): DemoNotification[] {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) return [];

    return userNotifications.filter(notification => notification.userId === targetUserId);
  }

  /**
   * Get unread notifications count
   */
  getUnreadNotificationsCount(userId?: string): number {
    const notifications = this.getUserNotifications(userId);
    return notifications.filter(notification => !notification.isRead).length;
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Simulate secure payment
   */
  async simulatePayment(
    groupId: string, 
    amountSats: number, 
    paymentMethod: string = 'Wave'
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      if (!this.currentUser) {
        throw new Error('No current user set');
      }

      // Simulate secure payment through security integration
      const mockInvoice = `lnbc${amountSats}n1pjsample${Date.now()}...`;
      
      const result = await securityIntegration.makePayment(mockInvoice, {
        groupId,
        userId: this.currentUser.id,
        amountSats,
        paymentMethod,
        timestamp: new Date().toISOString()
      });

      // Generate mock transaction ID
      const transactionId = `WAVE_TX_${Date.now()}`;

      console.log(`💰 Payment simulated: ${amountSats} sats via ${paymentMethod}`);
      console.log(`📱 Transaction ID: ${transactionId}`);

      return {
        success: true,
        transactionId
      };

    } catch (error) {
      console.error('Payment simulation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get market data
   */
  getMarketData() {
    return senegalMarketData;
  }

  /**
   * Convert satoshis to XOF
   */
  satsToXof(sats: number): number {
    return Math.round(sats * senegalMarketData.exchangeRates.satoshiToXof);
  }

  /**
   * Convert XOF to satoshis
   */
  xofToSats(xof: number): number {
    return Math.round(xof / senegalMarketData.exchangeRates.satoshiToXof);
  }

  /**
   * Get demo scenarios
   */
  getDemoScenarios() {
    return hackathonDemoScenarios;
  }

  /**
   * Get demo summary
   */
  getDemoSummary() {
    return demoSummary;
  }

  /**
   * Get group statistics
   */
  getGroupStats(groupId: string) {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const contributions = this.getGroupContributions(groupId);
    const payouts = this.getGroupPayouts(groupId);
    const members = this.getGroupMembers(groupId);

    const totalContributed = contributions.reduce((sum, c) => sum + c.amountSats, 0);
    const totalPaidOut = payouts.reduce((sum, p) => sum + p.amountSats, 0);
    const completedCycles = payouts.length;
    const averageContribution = contributions.length > 0 ? totalContributed / contributions.length : 0;

    return {
      groupName: group.name,
      totalMembers: members.length,
      completedCycles,
      totalContributed,
      totalPaidOut,
      averageContribution,
      totalContributedXof: this.satsToXof(totalContributed),
      totalPaidOutXof: this.satsToXof(totalPaidOut),
      averageContributionXof: this.satsToXof(averageContribution)
    };
  }

  /**
   * Get user statistics
   */
  getUserStats(userId?: string) {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) return null;

    const user = this.getUserById(targetUserId);
    if (!user) return null;

    const userContributions = contributionHistory.filter(c => c.userId === targetUserId);
    const userPayouts = payoutHistory.filter(p => p.winnerUserId === targetUserId);
    const userGroups = this.getUserGroups(targetUserId);

    const totalContributed = userContributions.reduce((sum, c) => sum + c.amountSats, 0);
    const totalReceived = userPayouts.reduce((sum, p) => sum + p.amountSats, 0);
    const netContribution = totalContributed - totalReceived;

    return {
      userName: user.profile.name,
      occupation: user.profile.occupation,
      market: user.profile.market,
      activeGroups: userGroups.length,
      totalContributed,
      totalReceived,
      netContribution,
      totalContributedXof: this.satsToXof(totalContributed),
      totalReceivedXof: this.satsToXof(totalReceived),
      netContributionXof: this.satsToXof(netContribution),
      wins: userPayouts.length,
      contributions: userContributions.length
    };
  }

  /**
   * Check if in demo mode
   */
  isInDemoMode(): boolean {
    return this.isDemoMode;
  }

  /**
   * Exit demo mode
   */
  exitDemoMode(): void {
    this.isDemoMode = false;
    this.currentUser = null;
    console.log('🚪 Demo mode exited');
  }
}

// Export singleton instance
export const demoService = DemoService.getInstance();

// Export types
export type { DemoUser, DemoGroup, DemoContribution, DemoPayout, DemoNotification };
