import React from 'react';
import { cn } from '@/lib/utils';
import { textilePatterns, brandColors } from '@/lib/design-system';
import { Users, TrendingUp, Clock, CheckCircle, Zap } from 'lucide-react';
import { Badge } from './badge';
import { Button, ContributionButton, JoinGroupButton } from './brand-button';
import { ProgressiveAvatar } from './progressive-image';

interface CommunityCardProps {
  title: string;
  description: string;
  memberCount: number;
  totalAmount: number;
  contributionAmount: number;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  nextContributionDate: string;
  members?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  className?: string;
  onJoin?: () => void;
  onContribute?: () => void;
  onViewDetails?: () => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  title,
  description,
  memberCount,
  totalAmount,
  contributionAmount,
  status,
  progress,
  nextContributionDate,
  members = [],
  className,
  onJoin,
  onContribute,
  onViewDetails,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR');
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-white rounded-2xl border border-orange-100 shadow-md hover:shadow-lg transition-all duration-300',
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-1',
        status === 'active' && 'before:bg-gradient-to-r before:from-orange-500 before:to-gold-500',
        status === 'completed' && 'before:bg-gradient-to-r before:from-green-500 before:to-blue-500',
        status === 'pending' && 'before:bg-gradient-to-r before:from-yellow-500 before:to-orange-500',
        className
      )}
    >
      {/* Subtle African textile pattern background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: textilePatterns.geometric.background,
          backgroundSize: textilePatterns.geometric.size,
        }}
      />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-charcoal-900 truncate mb-2">
              {title}
            </h3>
            <p className="text-sm text-charcoal-600 line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>
          <Badge className={cn('ml-3 flex-shrink-0 flex items-center gap-1', getStatusColor(status))}>
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </Badge>
        </div>

        {/* Progress Ring */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f3f4f6"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-charcoal-900">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <Users className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-charcoal-900">{memberCount}</div>
            <div className="text-xs text-charcoal-600">Membres</div>
          </div>
          <div className="text-center p-3 bg-gold-50 rounded-xl">
            <TrendingUp className="w-5 h-5 text-gold-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-charcoal-900">{formatAmount(totalAmount)}</div>
            <div className="text-xs text-charcoal-600">sats</div>
          </div>
        </div>

        {/* Member Avatars */}
        {members.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-charcoal-700">Membres actifs</span>
              <span className="text-xs text-charcoal-500">{members.length} sur {memberCount}</span>
            </div>
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((member, index) => (
                <ProgressiveAvatar
                  key={member.id}
                  src={member.avatar}
                  alt={member.name}
                  size="md"
                  fallbackText={member.name}
                  className="border-2 border-white shadow-sm"
                />
              ))}
              {members.length > 5 && (
                <div className="w-12 h-12 rounded-full bg-charcoal-100 border-2 border-white flex items-center justify-center text-xs font-medium text-charcoal-600 shadow-sm">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Contribution */}
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-gold-50 rounded-xl border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-charcoal-900">Prochaine contribution</div>
              <div className="text-lg font-bold text-orange-700">{formatAmount(contributionAmount)} sats</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-charcoal-600">Le</div>
              <div className="text-sm font-medium text-charcoal-900">{formatDate(nextContributionDate)}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'active' && (
            <ContributionButton onClick={onContribute}>
              Contribuer maintenant
            </ContributionButton>
          )}
          
          {status === 'pending' && (
            <JoinGroupButton onClick={onJoin}>
              Rejoindre le groupe
            </JoinGroupButton>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewDetails}
          >
            Voir les détails
          </Button>
        </div>
      </div>
    </div>
  );
};

// Specialized card for completed tontines
export const CompletedTontineCard: React.FC<Omit<CommunityCardProps, 'status'>> = (props) => (
  <CommunityCard {...props} status="completed" />
);

// Specialized card for active tontines
export const ActiveTontineCard: React.FC<Omit<CommunityCardProps, 'status'>> = (props) => (
  <CommunityCard {...props} status="active" />
);

// Specialized card for pending tontines
export const PendingTontineCard: React.FC<Omit<CommunityCardProps, 'status'>> = (props) => (
  <CommunityCard {...props} status="pending" />
);
