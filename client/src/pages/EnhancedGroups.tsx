// client/src/pages/EnhancedGroups.tsx
/**
 * Enhanced Groups Page with Improved UX
 * Integrates Senegalese demo data with enhanced user experience
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';
import { demoService, DemoUser, DemoGroup } from '@/lib/demo-service';
import { 
  Users, Calendar, Coins, ArrowRight, Plus, Bitcoin, 
  Clock, CheckCircle, AlertCircle, MoreVertical, Zap,
  Smartphone, Globe, CreditCard, TrendingUp, Shield,
  Search, Filter, SortAsc, SortDesc, Eye, Settings,
  Bell, BellOff, Star, StarOff, Heart, Share2,
  MapPin, DollarSign, Timer, Award, Target,
  BarChart3, PieChart, Activity, Wallet,
  ChevronDown, ChevronUp, Info, HelpCircle
} from 'lucide-react';
import { APP_TITLE } from '@/const';
import { NetworkAware } from '@/components/ui/network-aware';
import { ListSkeleton } from '@/components/ui/skeleton-loader';
import { UserFriendlyError } from '@/components/ui/user-friendly-error';
import { toast } from 'sonner';

// Enhanced TontineCard with better UX
const EnhancedTontineCard = React.memo(({ 
  group, 
  user, 
  onPay, 
  onManage, 
  onJoin,
  onLeave,
  onFavorite,
  isFavorite = false,
  showDetails = false
}: { 
  group: DemoGroup; 
  user: DemoUser | null;
  onPay: (group: DemoGroup) => void;
  onManage: (group: DemoGroup) => void;
  onJoin: (group: DemoGroup) => void;
  onLeave: (group: DemoGroup) => void;
  onFavorite: (group: DemoGroup) => void;
  isFavorite?: boolean;
  showDetails?: boolean;
}) => {
  const { t } = useTranslation();
  
  // Calculate payment status and urgency
  const paymentStatus = useMemo(() => {
    const now = new Date();
    const nextDue = group.nextPayoutDate ? new Date(group.nextPayoutDate) : null;
    const daysUntilDue = nextDue ? Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    if (daysUntilDue === null) return { status: 'unknown', urgency: 'neutral', text: 'No due date', color: 'gray' };
    if (daysUntilDue < 0) return { status: 'overdue', urgency: 'high', text: `${Math.abs(daysUntilDue)} overdue`, color: 'red' };
    if (daysUntilDue <= 3) return { status: 'due', urgency: 'medium', text: `${daysUntilDue}d`, color: 'yellow' };
    return { status: 'upcoming', urgency: 'low', text: `${daysUntilDue}d`, color: 'green' };
  }, [group.nextPayoutDate]);

  // Calculate progress and stats
  const progressPercentage = useMemo(() => {
    if (!group.currentMembers || !group.maxMembers) return 0;
    return Math.round((group.currentMembers / group.maxMembers) * 100);
  }, [group.currentMembers, group.maxMembers]);

  const totalPayout = useMemo(() => {
    return group.contributionAmount * group.maxMembers;
  }, [group.contributionAmount, group.maxMembers]);

  const xofAmount = useMemo(() => {
    return demoService.satsToXof(group.contributionAmount);
  }, [group.contributionAmount]);

  const totalXofPayout = useMemo(() => {
    return demoService.satsToXof(totalPayout);
  }, [totalPayout]);

  // Check if user is member
  const isMember = useMemo(() => {
    if (!user) return false;
    const members = demoService.getGroupMembers(group.id);
    return members.some(member => member.id === user.id);
  }, [group.id, user]);

  // Check if user has paid this cycle
  const userHasPaid = useMemo(() => {
    if (!user || !isMember) return false;
    const contributions = demoService.getCurrentCycleContributions(group.id);
    return contributions.some(c => c.userId === user.id && c.status === 'paid');
  }, [group.id, user, isMember]);

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 text-white';
      case 'yellow': return 'bg-yellow-500 text-white';
      case 'green': return 'bg-green-500 text-white';
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
    <Card className="hover:shadow-xl transition-all duration-300 border-orange-200 hover:border-orange-400 group">
      <CardContent className="p-6">
        {/* Header with status and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg truncate text-orange-900">{group.name}</h3>
              <Badge className={getStatusColor(paymentStatus.color)}>
                {getUrgencyIcon(paymentStatus.urgency)}
                <span className="ml-1 text-xs">{paymentStatus.text}</span>
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {group.description}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{group.rules.location}</span>
              <Timer className="h-3 w-3 ml-2" />
              <span>{group.rules.meetingDay} {group.rules.meetingTime}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFavorite(group)}
              className="h-8 w-8 p-0"
            >
              {isFavorite ? (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              ) : (
                <StarOff className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManage(group)}
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key metrics with XOF conversion */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-900">
              {group.contributionAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">sats</div>
            <div className="text-xs text-orange-700 font-medium">
              ≈ {xofAmount.toLocaleString()} XOF
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-900">
              {totalPayout.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">total payout</div>
            <div className="text-xs text-blue-700 font-medium">
              ≈ {totalXofPayout.toLocaleString()} XOF
            </div>
          </div>
        </div>

        {/* Progress and members */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Members</span>
            <span className="text-sm text-gray-600">
              {group.currentMembers}/{group.maxMembers}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{progressPercentage}% complete</span>
            <span className="capitalize font-medium">{group.frequency}</span>
          </div>
        </div>

        {/* Member avatars */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Members:</span>
            <div className="flex -space-x-2">
              {demoService.getGroupMembers(group.id).slice(0, 4).map((member, index) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs bg-orange-100 text-orange-600">
                    {member.profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {group.currentMembers > 4 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{group.currentMembers - 4}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Senegal-specific features */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Secure
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Smartphone className="h-3 w-3 mr-1" />
            Wave Cash-out
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            <Globe className="h-3 w-3 mr-1" />
            USSD Available
          </Badge>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Award className="h-3 w-3 mr-1" />
            Cycle {group.currentCycle}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href={`/groups/${group.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="mr-1 h-3 w-3" />
              View Details
            </Button>
          </Link>
          
          {isMember ? (
            <>
              {userHasPaid ? (
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" disabled>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Paid
                </Button>
              ) : (
                <Button 
                  onClick={() => onPay(group)}
                  size="sm"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Pay Now
                </Button>
              )}
              <Button 
                onClick={() => onLeave(group)}
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Leave
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => onJoin(group)}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Users className="mr-1 h-3 w-3" />
              Join Group
            </Button>
          )}
        </div>

        {/* Quick stats */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Purpose:</span>
                <span className="font-medium">{group.rules.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Late Penalty:</span>
                <span className="font-medium">{group.rules.penaltyLate} sats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emergency Loan:</span>
                <span className="font-medium">{group.rules.emergencyLoan ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Social Fund:</span>
                <span className="font-medium">{group.rules.socialFund ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

EnhancedTontineCard.displayName = 'EnhancedTontineCard';

// Quick stats component
const QuickStats = ({ groups, user }: { groups: DemoGroup[], user: DemoUser | null }) => {
  const stats = useMemo(() => {
    const userGroups = user ? demoService.getUserGroups(user.id) : [];
    const totalContributions = userGroups.reduce((sum, group) => sum + group.contributionAmount, 0);
    const totalPayouts = userGroups.reduce((sum, group) => {
      const payouts = demoService.getGroupPayouts(group.id);
      return sum + payouts.reduce((pSum, payout) => pSum + payout.amountSats, 0);
    }, 0);
    
    return {
      totalGroups: groups.length,
      userGroups: userGroups.length,
      totalContributions: demoService.satsToXof(totalContributions),
      totalPayouts: demoService.satsToXof(totalPayouts),
      netContribution: demoService.satsToXof(totalContributions - totalPayouts)
    };
  }, [groups, user]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">{stats.totalGroups}</div>
          <div className="text-xs text-orange-700">Total Groups</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-4 text-center">
          <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{stats.userGroups}</div>
          <div className="text-xs text-blue-700">My Groups</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{stats.totalContributions.toLocaleString()}</div>
          <div className="text-xs text-green-700">Contributed (XOF)</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-4 text-center">
          <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">{stats.totalPayouts.toLocaleString()}</div>
          <div className="text-xs text-purple-700">Received (XOF)</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-4 text-center">
          <BarChart3 className="h-6 w-6 text-gray-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.netContribution.toLocaleString()}</div>
          <div className="text-xs text-gray-700">Net (XOF)</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function EnhancedGroups() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { data: groups, isLoading, error, refetch } = trpc.tontine.list.useQuery();
  
  // Demo service state
  const [demoGroups, setDemoGroups] = useState<DemoGroup[]>([]);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'members' | 'amount'>('due');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'my' | 'available' | 'overdue'>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Initialize demo data
  useEffect(() => {
    const initializeDemo = async () => {
      try {
        await demoService.initializeDemo();
        const groups = demoService.getGroups();
        setDemoGroups(groups);
        
        // Set first user as current user for demo
        const users = demoService.getUsers();
        if (users.length > 0) {
          const demoUser = users[0]; // Fatou Diop
          demoService.setCurrentUser(demoUser);
          setCurrentUser(demoUser);
        }
      } catch (error) {
        console.error('Failed to initialize demo:', error);
      }
    };
    
    initializeDemo();
  }, []);

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = demoGroups.filter((group) => {
      // Search filter
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.rules.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Category filter
      switch (filterBy) {
        case 'my':
          return currentUser ? demoService.getUserGroups(currentUser.id).some(g => g.id === group.id) : false;
        case 'available':
          return group.currentMembers < group.maxMembers;
        case 'overdue':
          const now = new Date();
          const nextDue = group.nextPayoutDate ? new Date(group.nextPayoutDate) : null;
          return nextDue && nextDue.getTime() < now.getTime();
        default:
          return true;
      }
    });

    // Sort groups
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'due':
          const aDue = a.nextPayoutDate ? new Date(a.nextPayoutDate) : new Date(0);
          const bDue = b.nextPayoutDate ? new Date(b.nextPayoutDate) : new Date(0);
          comparison = aDue.getTime() - bDue.getTime();
          break;
        case 'members':
          comparison = (a.currentMembers || 0) - (b.currentMembers || 0);
          break;
        case 'amount':
          comparison = a.contributionAmount - b.contributionAmount;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [demoGroups, searchQuery, sortBy, sortOrder, filterBy, currentUser]);

  // Event handlers
  const handlePay = (group: DemoGroup) => {
    toast.success(`Opening payment for ${group.name} - ${demoService.satsToXof(group.contributionAmount)} XOF`);
    // In real implementation, open payment modal
  };

  const handleManage = (group: DemoGroup) => {
    toast.info(`Managing ${group.name}`);
    // In real implementation, open management interface
  };

  const handleJoin = (group: DemoGroup) => {
    toast.success(`Joining ${group.name}`);
    // In real implementation, handle join logic
  };

  const handleLeave = (group: DemoGroup) => {
    toast.warning(`Leaving ${group.name}`);
    // In real implementation, handle leave logic
  };

  const handleFavorite = (group: DemoGroup) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(group.id)) {
      newFavorites.delete(group.id);
      toast.info(`Removed ${group.name} from favorites`);
    } else {
      newFavorites.add(group.id);
      toast.success(`Added ${group.name} to favorites`);
    }
    setFavorites(newFavorites);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
      {/* Enhanced Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Bitcoin className="h-8 w-8 text-orange-600" />
                <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure
                </Badge>
              </div>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <LanguageSelector />
              <Link href="/groups/create">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold text-orange-900 mb-2">
                {currentUser ? `${currentUser.profile.name}'s Tontines` : 'Your Tontines'}
              </h2>
              <p className="text-gray-600">
                {currentUser ? `${currentUser.profile.occupation} • ${currentUser.profile.market}` : 'Manage your community savings circles'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showDetails ? 'Less Details' : 'More Details'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <QuickStats groups={demoGroups} user={currentUser} />
        </div>

        {/* Enhanced Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search groups by name, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="my">My Groups</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due">Due Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="px-3"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Groups</TabsTrigger>
              <TabsTrigger value="my">My Groups</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Groups Grid */}
        {filteredAndSortedGroups.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGroups.map((group) => (
              <EnhancedTontineCard
                key={group.id}
                group={group}
                user={currentUser}
                onPay={handlePay}
                onManage={handleManage}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onFavorite={handleFavorite}
                isFavorite={favorites.has(group.id)}
                showDetails={showDetails}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <Users className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4 text-gray-700">
                {searchQuery ? 'No groups found' : 'No groups yet'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Be the first to create a tontine group in your community!'
                }
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/groups/create">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Group
                  </Button>
                </Link>
                <Button variant="outline">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Info Alert */}
        <Alert className="mt-8 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Demo Mode:</strong> This page shows Senegalese market vendor data integrated with enterprise security features. 
            All transactions are simulated for demonstration purposes.
          </AlertDescription>
        </Alert>
      </div>
    </NetworkAware>
  );
}
