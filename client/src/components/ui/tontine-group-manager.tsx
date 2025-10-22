// src/components/ui/tontine-group-manager.tsx
// Tontine group management with multi-signature wallet integration
// Handles group creation, member management, and wallet operations

import React, { useState, useEffect, useCallback } from 'react';
import { 
  UsersIcon, 
  WalletIcon, 
  PlusIcon, 
  UserPlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { apiClient, TontineGroup, GroupMember, MultiSigWallet } from '@/lib/api-client';
import { UserFriendlyError } from './user-friendly-error';
import { SkeletonLoader } from './skeleton-loader';
import { BrandButton } from './brand-button';

interface TontineGroupManagerProps {
  groupId?: string;
  onCreateGroup?: (group: TontineGroup) => void;
  onJoinGroup?: (member: GroupMember) => void;
  className?: string;
}

interface CreateGroupForm {
  name: string;
  description: string;
  contribution_amount_sats: number;
  cycle_days: number;
  max_members: number;
}

export const TontineGroupManager: React.FC<TontineGroupManagerProps> = ({
  groupId,
  onCreateGroup,
  onJoinGroup,
  className = '',
}) => {
  const [group, setGroup] = useState<TontineGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [wallet, setWallet] = useState<MultiSigWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateGroupForm>({
    name: '',
    description: '',
    contribution_amount_sats: 10000,
    cycle_days: 7,
    max_members: 10,
  });

  // Load group data
  const loadGroupData = useCallback(async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [groupResponse, membersResponse, walletResponse] = await Promise.all([
        apiClient.getTontineGroup(groupId),
        apiClient.getTontineGroups(), // This would be a specific members endpoint
        apiClient.getGroupWallet(groupId),
      ]);

      if (groupResponse.success && groupResponse.data) {
        setGroup(groupResponse.data);
      }

      if (membersResponse.success && membersResponse.data) {
        // Filter members for this group (mock implementation)
        setMembers([]);
      }

      if (walletResponse.success && walletResponse.data) {
        setWallet(walletResponse.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load group data'));
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Create new tontine group
  const handleCreateGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.createTontineGroup(createForm);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create group');
      }

      setGroup(response.data);
      setShowCreateForm(false);
      onCreateGroup?.(response.data);

      // Reset form
      setCreateForm({
        name: '',
        description: '',
        contribution_amount_sats: 10000,
        cycle_days: 7,
        max_members: 10,
      });

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create group'));
    } finally {
      setIsLoading(false);
    }
  }, [createForm, onCreateGroup]);

  // Join existing group
  const handleJoinGroup = useCallback(async (targetGroupId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.joinTontineGroup(targetGroupId);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to join group');
      }

      onJoinGroup?.(response.data);
      await loadGroupData(); // Refresh group data

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to join group'));
    } finally {
      setIsLoading(false);
    }
  }, [onJoinGroup, loadGroupData]);

  // Format amount for display
  const formatAmount = (sats: number) => {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M sats`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}K sats`;
    }
    return `${sats} sats`;
  };

  // Format cycle duration
  const formatCycleDuration = (days: number) => {
    if (days === 1) return 'Daily';
    if (days === 7) return 'Weekly';
    if (days === 30) return 'Monthly';
    return `Every ${days} days`;
  };

  // Load data on mount
  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  if (isLoading && !group) {
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
        onRetry={loadGroupData}
        title="Failed to load group"
        retryText="Try Again"
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Group Header */}
      {group && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
              {group.description && (
                <p className="text-gray-600">{group.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>{members.length}/{group.max_members} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatCycleDuration(group.cycle_days)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>{formatAmount(group.contribution_amount_sats)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Cycle</div>
              <div className="text-2xl font-bold text-orange-600">{group.current_cycle}</div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Sig Wallet Info */}
      {wallet && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <WalletIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Group Wallet</h3>
              <p className="text-sm text-gray-600">Multi-signature Lightning wallet</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Balance</div>
              <div className="text-xl font-bold text-gray-900">
                {formatAmount(wallet.balance_sats)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Signatures Required</div>
              <div className="text-xl font-bold text-gray-900">
                {wallet.required_signatures}/{wallet.total_signatures}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Secured by multi-signature technology</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Tontine Group</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter group name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Describe your tontine group"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Amount (sats)
                </label>
                <input
                  type="number"
                  value={createForm.contribution_amount_sats}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, contribution_amount_sats: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min="1000"
                  step="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cycle Duration (days)
                </label>
                <select
                  value={createForm.cycle_days}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, cycle_days: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={1}>Daily</option>
                  <option value={7}>Weekly</option>
                  <option value={14}>Bi-weekly</option>
                  <option value={30}>Monthly</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Members
              </label>
              <input
                type="number"
                value={createForm.max_members}
                onChange={(e) => setCreateForm(prev => ({ ...prev, max_members: parseInt(e.target.value) || 2 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="2"
                max="50"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <BrandButton
              onClick={handleCreateGroup}
              disabled={isLoading || !createForm.name.trim()}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </BrandButton>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!group && !showCreateForm && (
        <div className="flex space-x-4">
          <BrandButton
            onClick={() => setShowCreateForm(true)}
            className="flex-1"
            icon={PlusIcon}
          >
            Create Tontine Group
          </BrandButton>
          <BrandButton
            onClick={() => {/* Handle join group */}}
            variant="secondary"
            className="flex-1"
            icon={UserPlusIcon}
          >
            Join Existing Group
          </BrandButton>
        </div>
      )}

      {/* Group Members */}
      {group && members.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Members</h3>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-medium">
                      {member.user?.phone_number?.slice(-2) || '??'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.user?.phone_number || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.role === 'admin' ? 'Admin' : 'Member'} • Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {member.role === 'admin' && (
                  <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Admin
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TontineGroupManager;
