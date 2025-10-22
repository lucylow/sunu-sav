import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";
import { 
  Users, Calendar, Coins, ArrowRight, Plus, Bitcoin, 
  Clock, CheckCircle, AlertCircle, MoreVertical, Zap,
  Smartphone, Globe, CreditCard, TrendingUp, Shield
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { NetworkAware } from "@/components/ui/network-aware";
import { ListSkeleton } from "@/components/ui/skeleton-loader";
import { UserFriendlyError } from "@/components/ui/user-friendly-error";
import { SearchInput } from "@/components/ui/accessible-input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Enhanced TontineCard component with Senegal-specific features
const TontineCard = React.memo(({ group, onPay, onManage }: { 
  group: any; 
  onPay: (group: any) => void;
  onManage: (group: any) => void;
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Calculate payment status and urgency
  const paymentStatus = useMemo(() => {
    const now = new Date();
    const nextDue = group.nextPayoutDate ? new Date(group.nextPayoutDate) : null;
    const daysUntilDue = nextDue ? Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    if (daysUntilDue === null) return { status: 'unknown', urgency: 'neutral', text: 'No due date' };
    if (daysUntilDue < 0) return { status: 'overdue', urgency: 'high', text: `${Math.abs(daysUntilDue)} overdue` };
    if (daysUntilDue <= 3) return { status: 'due', urgency: 'medium', text: `${daysUntilDue}d` };
    return { status: 'upcoming', urgency: 'low', text: `${daysUntilDue}d` };
  }, [group.nextPayoutDate]);

  // Calculate fee information
  const feeInfo = useMemo(() => {
    if (!group.contributionAmount || !group.maxMembers) return null;
    
    const payoutTotal = group.contributionAmount * group.maxMembers;
    const baseFee = Math.floor(payoutTotal * 0.01); // 1% base fee
    const platformShare = Math.floor(baseFee * 0.5); // 50% to platform
    const communityShare = Math.floor(baseFee * 0.2); // 20% to community
    const partnerReserve = Math.floor(baseFee * 0.3); // 30% to partners
    
    return {
      totalFee: baseFee,
      platformShare,
      communityShare,
      partnerReserve,
      netPayout: payoutTotal - baseFee
    };
  }, [group.contributionAmount, group.maxMembers]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!group.currentMembers || !group.maxMembers) return 0;
    return Math.round((group.currentMembers / group.maxMembers) * 100);
  }, [group.currentMembers, group.maxMembers]);

  // Check if user has paid this cycle
  const userHasPaid = useMemo(() => {
    // This would need to be calculated based on actual payment data
    return false; // Placeholder
  }, [group.id, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-500 text-white';
      case 'due': return 'bg-yellow-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      default: return <CheckCircle className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-orange-200 hover:border-orange-300">
      <CardContent className="p-4">
        {/* Compact header with key info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{group.name}</h3>
              <Badge className={getStatusColor(paymentStatus.status)}>
                {getUrgencyIcon(paymentStatus.urgency)}
                <span className="ml-1 text-xs">{paymentStatus.text}</span>
              </Badge>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {group.description || "Community savings circle"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onManage(group)}>
                Manage Group
              </DropdownMenuItem>
              <DropdownMenuItem>
                Invite Members
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Key metrics in compact layout */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-orange-900">
              {group.contributionAmount?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-600">sats</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {group.currentMembers || 0}/{group.maxMembers || 0}
            </div>
            <div className="text-xs text-gray-600">members</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {group.currentCycle || 1}
            </div>
            <div className="text-xs text-gray-600">cycle</div>
          </div>
        </div>

        {/* Senegal-specific features */}
        <div className="mb-4 flex flex-wrap gap-2">
          {group.isVerified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Smartphone className="h-3 w-3 mr-1" />
            Wave Cash-out
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            <Globe className="h-3 w-3 mr-1" />
            USSD Available
          </Badge>
        </div>

        {/* Fee transparency */}
        {feeInfo && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Fee Breakdown</h4>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Platform:</span>
                <span className="font-medium">{feeInfo.platformShare} sats</span>
              </div>
              <div className="flex justify-between">
                <span>Community:</span>
                <span className="font-medium text-green-600">{feeInfo.communityShare} sats</span>
              </div>
              <div className="flex justify-between">
                <span>Partner:</span>
                <span className="font-medium text-blue-600">{feeInfo.partnerReserve} sats</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Net Payout:</span>
                <span className="text-orange-600">{feeInfo.netPayout.toLocaleString()} sats</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{progressPercentage}% complete</span>
            <span className="capitalize">{group.frequency}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href={`/groups/${group.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          <Button 
            onClick={() => onPay(group)}
            size="sm"
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            disabled={paymentStatus.status === 'unknown' || userHasPaid}
          >
            <Zap className="mr-1 h-3 w-3" />
            {userHasPaid ? 'Paid' : 'Pay'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

TontineCard.displayName = 'TontineCard';

export default function Groups() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { data: groups, isLoading, error, refetch } = trpc.tontine.list.useQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'members'>('due');

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    if (!groups) return [];
    
    let filtered = groups.filter((group: any) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort based on selected criteria
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'due':
          const aDue = a.nextPayoutDate ? new Date(a.nextPayoutDate) : new Date(0);
          const bDue = b.nextPayoutDate ? new Date(b.nextPayoutDate) : new Date(0);
          return aDue.getTime() - bDue.getTime();
        case 'members':
          return (b.currentMembers || 0) - (a.currentMembers || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [groups, searchQuery, sortBy]);

  const handlePay = (group: any) => {
    // Navigate to payment flow
    toast.success(`Opening payment for ${group.name}`);
    // In a real implementation, this would open the payment modal or navigate to payment screen
  };

  const handleManage = (group: any) => {
    toast.info(`Managing ${group.name}`);
    // In a real implementation, this would open the management interface
  };

  if (authLoading || isLoading) {
    return (
      <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <ListSkeleton count={6} />
          </div>
        </div>
      </NetworkAware>
    );
  }

  if (error) {
    return (
      <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <UserFriendlyError
          error={error as unknown as Error}
          onRetry={() => refetch()}
          title={t('errors.server')}
          retryText={t('app.retry')}
        />
      </NetworkAware>
    );
  }

  if (!user) {
    return (
      <NetworkAware className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
            <CardDescription>
              {t('tontine.create_or_join')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                {t('auth.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </NetworkAware>
    );
  }

  return (
    <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Bitcoin className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">{t('settings.dashboard')}</Button>
            </Link>
            <LanguageSelector />
            <Link href="/groups/create">
              <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                {t('tontine.create')}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-orange-900 mb-2">{t('tontine.your_tontines')}</h2>
          <p className="text-gray-600">{t('community.community')}</p>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search groups..."
              className="max-w-md"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'due' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('due')}
            >
              Due Date
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Name
            </Button>
            <Button
              variant={sortBy === 'members' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('members')}
            >
              Members
            </Button>
          </div>
        </div>

        {/* Groups Grid */}
        {filteredAndSortedGroups.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGroups.map((group: any) => (
              <TontineCard
                key={group.id}
                group={group}
                onPay={handlePay}
                onManage={handleManage}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No groups found' : 'No groups yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'No groups match your search'
                  : 'Be the first to create a tontine group!'
                }
              </p>
              <Link href="/groups/create">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </NetworkAware>
  );
}