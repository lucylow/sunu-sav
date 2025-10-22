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
  Smartphone, Globe, CreditCard, TrendingUp, Shield,
  Star, Heart, Gift, Target, Award, Sparkles,
  ChevronDown, Filter, SortAsc, SortDesc, Search,
  Bell, Settings, Wallet, History, BarChart3
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { NetworkAware } from "@/components/ui/network-aware";
import { ListSkeleton } from "@/components/ui/skeleton-loader";
import { UserFriendlyError } from "@/components/ui/user-friendly-error";
import { SearchInput } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Enhanced TontineCard component with modern design and Senegal-specific features
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
      case 'overdue': return 'bg-red-500 text-white shadow-red-200';
      case 'due': return 'bg-amber-500 text-white shadow-amber-200';
      case 'upcoming': return 'bg-emerald-500 text-white shadow-emerald-200';
      default: return 'bg-slate-500 text-white shadow-slate-200';
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
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-orange-50/30 hover:from-orange-50/50 hover:to-orange-100/50 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="p-6 relative z-10">
        {/* Header with enhanced visual hierarchy */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-xl text-gray-900 truncate">{group.name}</h3>
              </div>
              <Badge className={`${getStatusColor(paymentStatus.status)} shadow-sm`}>
                {getUrgencyIcon(paymentStatus.urgency)}
                <span className="ml-1 text-xs font-medium">{paymentStatus.text}</span>
              </Badge>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {group.description || "Community savings circle"}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-orange-100 rounded-full">
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onManage(group)} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Manage Group
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Invite Members
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer">
                <Heart className="h-4 w-4 mr-2" />
                Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div className="text-2xl font-bold text-orange-900 mb-1">
              {group.contributionAmount?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-orange-700 font-medium">sats</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="text-2xl font-bold text-blue-900 mb-1">
              {group.currentMembers || 0}/{group.maxMembers || 0}
            </div>
            <div className="text-xs text-blue-700 font-medium">members</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-900 mb-1">
              {group.currentCycle || 1}
            </div>
            <div className="text-xs text-emerald-700 font-medium">cycle</div>
          </div>
        </div>

        {/* Senegal-specific features with enhanced styling */}
        <div className="mb-5 flex flex-wrap gap-2">
          {group.isVerified && (
            <Badge variant="secondary" className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200 shadow-sm">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 shadow-sm">
            <Smartphone className="h-3 w-3 mr-1" />
            Wave Cash-out
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 shadow-sm">
            <Globe className="h-3 w-3 mr-1" />
            USSD Available
          </Badge>
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 shadow-sm">
            <Star className="h-3 w-3 mr-1" />
            Pro Benefits
          </Badge>
        </div>

        {/* Enhanced fee transparency */}
        {feeInfo && (
          <div className="mb-5 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Fee Breakdown
              </h4>
              <div className="text-xs text-gray-500">Transparent</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                <span className="text-gray-600">Platform:</span>
                <span className="font-semibold text-gray-900">{feeInfo.platformShare} sats</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                <span className="text-gray-600">Community:</span>
                <span className="font-semibold text-emerald-600">{feeInfo.communityShare} sats</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                <span className="text-gray-600">Partner:</span>
                <span className="font-semibold text-blue-600">{feeInfo.partnerReserve} sats</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <span className="text-gray-700 font-medium">Net Payout:</span>
                <span className="font-bold text-orange-600">{feeInfo.netPayout.toLocaleString()} sats</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-orange-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-gray-200" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{group.currentMembers || 0} of {group.maxMembers || 0} members</span>
            <span className="capitalize font-medium">{group.frequency}</span>
          </div>
        </div>

        {/* Enhanced action buttons */}
        <div className="flex gap-3">
          <Link href={`/groups/${group.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-10 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button 
            onClick={() => onPay(group)}
            size="sm"
            className="flex-1 h-10 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            disabled={paymentStatus.status === 'unknown' || userHasPaid}
          >
            <Zap className="mr-2 h-4 w-4" />
            {userHasPaid ? 'Paid ✓' : 'Pay Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

TontineCard.displayName = 'TontineCard';

// Enhanced Stats Card Component
const StatsCard = ({ title, value, icon: Icon, trend, color = "blue" }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean };
  color?: "blue" | "green" | "orange" | "purple";
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-500",
    green: "from-emerald-500 to-green-500", 
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-violet-500"
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Groups() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { data: groups, isLoading, error, refetch } = trpc.tontine.list.useQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'members'>('due');
  const [showFilters, setShowFilters] = useState(false);

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

  // Calculate stats
  const stats = useMemo(() => {
    if (!groups) return { totalGroups: 0, totalMembers: 0, totalContributions: 0, activeCycles: 0 };
    
    const totalGroups = groups.length;
    const totalMembers = groups.reduce((sum: number, group: any) => sum + (group.currentMembers || 0), 0);
    const totalContributions = groups.reduce((sum: number, group: any) => sum + (group.contributionAmount || 0), 0);
    const activeCycles = groups.filter((group: any) => group.status === 'active').length;
    
    return { totalGroups, totalMembers, totalContributions, activeCycles };
  }, [groups]);

  const handlePay = (group: any) => {
    toast.success(`Opening payment for ${group.name}`);
  };

  const handleManage = (group: any) => {
    toast.info(`Managing ${group.name}`);
  };

  if (authLoading || isLoading) {
    return (
      <NetworkAware className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
            <ListSkeleton count={6} />
          </div>
        </div>
      </NetworkAware>
    );
  }

  if (error) {
    return (
      <NetworkAware className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
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
      <NetworkAware className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Card className="max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-orange-50/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full w-fit">
              <Bitcoin className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{t('auth.login')}</CardTitle>
            <CardDescription className="text-gray-600">
              {t('tontine.create_or_join')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                {t('auth.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </NetworkAware>
    );
  }

  return (
    <NetworkAware className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Enhanced Header */}
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200">
                <Bitcoin className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">{APP_TITLE}</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-orange-100">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" className="hover:bg-orange-100">
              <Bell className="h-4 w-4" />
            </Button>
            <LanguageSelector />
            <Link href="/groups/create">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Enhanced Page Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Your Tontine Groups</h2>
          <p className="text-lg text-gray-600">Manage your community savings circles</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Groups"
            value={stats.totalGroups}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <StatsCard
            title="Total Members"
            value={stats.totalMembers}
            icon={Heart}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <StatsCard
            title="Total Contributions"
            value={`${(stats.totalContributions / 1000).toFixed(0)}k sats`}
            icon={Coins}
            trend={{ value: 15, isPositive: true }}
            color="orange"
          />
          <StatsCard
            title="Active Cycles"
            value={stats.activeCycles}
            icon={Target}
            trend={{ value: 5, isPositive: true }}
            color="purple"
          />
        </div>

        {/* Enhanced Search and Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
                  placeholder="Search groups by name or description..."
                  className="pl-10 h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200"
            />
              </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'due' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('due')}
                className={sortBy === 'due' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50'}
            >
                <Clock className="mr-2 h-4 w-4" />
              Due Date
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
                className={sortBy === 'name' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50'}
            >
                <SortAsc className="mr-2 h-4 w-4" />
              Name
            </Button>
            <Button
              variant={sortBy === 'members' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('members')}
                className={sortBy === 'members' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50'}
            >
                <Users className="mr-2 h-4 w-4" />
              Members
            </Button>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {filteredAndSortedGroups.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
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
          <Card className="text-center py-16 border-0 shadow-xl bg-gradient-to-br from-white to-orange-50/30">
            <CardContent>
              <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full w-fit">
                <Users className="h-16 w-16 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchQuery ? 'No groups found' : 'No groups yet'}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchQuery 
                  ? 'No groups match your search criteria'
                  : 'Be the first to create a tontine group and start building your community!'
                }
              </p>
              <Link href="/groups/create">
                <Button className="h-12 px-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </NetworkAware>
  );
}