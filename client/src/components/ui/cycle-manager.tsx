// src/components/ui/cycle-manager.tsx
// Cycle management component for tontine cycles
// Handles cycle completion, winner selection, and payout processing

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrophyIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { apiClient, GroupStatus, Payout, Contribution } from '@/lib/api-client';
import { UserFriendlyError } from './user-friendly-error';
import { SkeletonLoader } from './skeleton-loader';
import { Button } from './brand-button';
import { webhookHandler } from '@/lib/webhook-handler';

interface CycleManagerProps {
  groupId: string;
  onCycleCompleted?: (cycleNumber: number, winner: string, amount: number) => void;
  onPayoutReady?: (payout: Payout) => void;
  className?: string;
}

interface CycleInfo {
  cycleNumber: number;
  startDate: string;
  endDate: string;
  totalContributions: number;
  pendingContributions: number;
  totalAmount: number;
  isComplete: boolean;
  winner?: string;
  winnerAmount?: number;
}

export const CycleManager: React.FC<CycleManagerProps> = ({
  groupId,
  onCycleCompleted,
  onPayoutReady,
  className = '',
}) => {
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load cycle data
  const loadCycleData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statusResponse, contributionsResponse, payoutsResponse] = await Promise.all([
        apiClient.getGroupStatus(groupId),
        apiClient.getContributions(groupId),
        apiClient.getPayouts(groupId),
      ]);

      if (statusResponse.success && statusResponse.data) {
        const status = statusResponse.data;
        setCycleInfo({
          cycleNumber: status.current_cycle,
          startDate: new Date(Date.now() - (status.cycle_progress * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          endDate: status.next_cycle_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
          totalContributions: status.total_contributions,
          pendingContributions: status.pending_contributions,
          totalAmount: status.total_amount,
          isComplete: status.pending_contributions === 0 && status.total_contributions > 0,
          winner: status.winner,
        });
      }

      if (contributionsResponse.success && contributionsResponse.data) {
        setContributions(contributionsResponse.data);
      }

      if (payoutsResponse.success && payoutsResponse.data) {
        setPayouts(payoutsResponse.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load cycle data'));
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Process cycle completion
  const processCycleCompletion = useCallback(async () => {
    if (!cycleInfo || cycleInfo.isComplete) return;

    try {
      setIsProcessing(true);
      setError(null);

      // In a real implementation, this would trigger the backend to process the cycle
      // For demo purposes, we'll simulate the process
      
      // Select random winner from contributors
      const paidContributions = contributions.filter(c => c.status === 'paid');
      if (paidContributions.length === 0) {
        throw new Error('No paid contributions found');
      }

      const winner = paidContributions[Math.floor(Math.random() * paidContributions.length)];
      const totalAmount = paidContributions.reduce((sum, c) => sum + c.amount_sats, 0);

      // Update cycle info
      setCycleInfo(prev => prev ? {
        ...prev,
        isComplete: true,
        winner: winner.user_id,
        winnerAmount: totalAmount,
      } : null);

      // Emit cycle completed event
      onCycleCompleted?.(cycleInfo.cycleNumber, winner.user_id, totalAmount);

      // Generate payout invoice for winner
      const payoutResponse = await apiClient.generatePayoutInvoice(groupId, totalAmount, winner.user_id);
      
      if (payoutResponse.success && payoutResponse.data) {
        const payout: Payout = {
          id: payoutResponse.data.payout_id,
          group_id: groupId,
          cycle_number: cycleInfo.cycleNumber,
          winner_user_id: winner.user_id,
          amount_sats: totalAmount,
          payment_request: payoutResponse.data.invoice,
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        setPayouts(prev => [...prev, payout]);
        onPayoutReady?.(payout);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process cycle completion'));
    } finally {
      setIsProcessing(false);
    }
  }, [cycleInfo, contributions, groupId, onCycleCompleted, onPayoutReady]);

  // Format amount for display
  const formatAmount = (sats: number) => {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M sats`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}K sats`;
    }
    return `${sats} sats`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate cycle progress percentage
  const getCycleProgress = () => {
    if (!cycleInfo) return 0;
    const total = cycleInfo.totalContributions + cycleInfo.pendingContributions;
    if (total === 0) return 0;
    return (cycleInfo.totalContributions / total) * 100;
  };

  // Load data on mount
  useEffect(() => {
    loadCycleData();
  }, [loadCycleData]);

  // Listen for webhook events
  useEffect(() => {
    const handleCycleCompleted = (completion: any) => {
      if (completion.group_id === groupId) {
        loadCycleData(); // Refresh data
      }
    };

    const handlePayoutReady = (payout: any) => {
      if (payout.group_id === groupId) {
        loadCycleData(); // Refresh data
      }
    };

    webhookHandler.on('cycle_completed', handleCycleCompleted);
    webhookHandler.on('payout_ready', handlePayoutReady);

    return () => {
      webhookHandler.off('cycle_completed', handleCycleCompleted);
      webhookHandler.off('payout_ready', handlePayoutReady);
    };
  }, [groupId, loadCycleData]);

  if (isLoading && !cycleInfo) {
    return (
      <div className={`space-y-6 ${className}`}>
        <SkeletonLoader className="h-8 w-64" />
        <SkeletonLoader className="h-32 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <UserFriendlyError
        error={error}
        onRetry={loadCycleData}
        title="Failed to load cycle data"
        retryText="Try Again"
      />
    );
  }

  if (!cycleInfo) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No cycle data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Cycle Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cycle {cycleInfo.cycleNumber}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(cycleInfo.startDate)} - {formatDate(cycleInfo.endDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(getCycleProgress())}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCycleProgress()}%` }}
            />
          </div>
        </div>

        {/* Cycle Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{cycleInfo.totalContributions}</div>
            <div className="text-sm text-gray-500">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{cycleInfo.pendingContributions}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatAmount(cycleInfo.totalAmount)}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Cycle Completion */}
      {cycleInfo.isComplete && cycleInfo.winner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cycle Complete!</h3>
              <p className="text-sm text-gray-600">Winner has been selected</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-800 mb-2">
                {formatAmount(cycleInfo.winnerAmount || 0)}
              </div>
              <div className="text-sm text-yellow-700">
                Winner: {cycleInfo.winner}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Cycle Button */}
      {!cycleInfo.isComplete && cycleInfo.pendingContributions === 0 && cycleInfo.totalContributions > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Complete</h3>
              <p className="text-sm text-gray-600">All contributions received</p>
            </div>
          </div>

          <Button
            onClick={processCycleCompletion}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Complete Cycle & Select Winner'}
          </Button>
        </div>
      )}

      {/* Pending Contributions */}
      {cycleInfo.pendingContributions > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Waiting for Contributions</h3>
              <p className="text-sm text-gray-600">
                {cycleInfo.pendingContributions} members still need to contribute
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {contributions
              .filter(c => c.status === 'pending')
              .map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-medium">
                        {contribution.user_id.slice(-2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contribution.user_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pending since {formatDate(contribution.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatAmount(contribution.amount_sats)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Payouts */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Payouts</h3>
              <p className="text-sm text-gray-600">Cycle winners and payments</p>
            </div>
          </div>

          <div className="space-y-3">
            {payouts.slice(0, 5).map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrophyIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Cycle {payout.cycle_number} Winner
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(payout.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatAmount(payout.amount_sats)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {payout.status === 'paid' ? 'Paid' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleManager;
