import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Input } from './input';
import { SkeletonLoader, ListSkeleton } from './skeleton-loader';
import { NetworkAware, useNetworkStatus } from './network-aware';
import { UserFriendlyError } from './user-friendly-error';
import { ProgressiveImage } from './progressive-image';
import { SearchInput } from './accessible-input';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

// Types
interface Tontine {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalAmount: number;
  contributionAmount: number;
  status: 'active' | 'completed' | 'pending';
  nextContributionDate: string;
  progress: number;
  imageUrl?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color: string;
}

// Optimized Tontine Card Component
const TontineCard = React.memo<{
  tontine: Tontine;
  onPress: (tontine: Tontine) => void;
}>(({ tontine, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(tontine);
  }, [tontine, onPress]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handlePress}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {tontine.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {tontine.description}
            </p>
          </div>
          <Badge className={cn('ml-2 flex-shrink-0', getStatusColor(tontine.status))}>
            {getStatusIcon(tontine.status)}
            <span className="ml-1 capitalize">{tontine.status}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className="font-medium">{tontine.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${tontine.progress}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{tontine.memberCount} membres</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{tontine.totalAmount.toLocaleString()} sats</span>
            </div>
          </div>
          
          {/* Next Contribution */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              Prochaine contribution: {tontine.contributionAmount.toLocaleString()} sats
            </div>
            <Button size="sm" variant="outline">
              Contribuer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TontineCard.displayName = 'TontineCard';

// Empty State Component
const EmptyState = React.memo<{
  title: string;
  message: string;
  actionText: string;
  onAction: () => void;
}>(({ title, message, actionText, onAction }) => (
  <div className="text-center py-12 px-4">
    <div className="text-6xl mb-4">🏦</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-sm mx-auto">{message}</p>
    <Button onClick={onAction} size="lg">
      <Plus className="w-4 h-4 mr-2" />
      {actionText}
    </Button>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Quick Actions Component
const QuickActions = React.memo<{
  actions: QuickAction[];
}>(({ actions }) => (
  <div className="grid grid-cols-2 gap-3 mb-6">
    {actions.map((action) => (
      <Button
        key={action.id}
        variant="outline"
        className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
        onClick={action.action}
      >
        <action.icon className={cn('w-6 h-6', action.color)} />
        <div className="text-center">
          <div className="font-medium text-sm">{action.title}</div>
          <div className="text-xs text-gray-500">{action.description}</div>
        </div>
      </Button>
    ))}
  </div>
));

QuickActions.displayName = 'QuickActions';

// Main HomeScreen Component
export const OptimizedHomeScreen: React.FC = () => {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'pending'>('all');
  const [error, setError] = useState<Error | null>(null);
  
  const { isConnected, isSlowConnection } = useNetworkStatus();

  // Memoized filtered tontines
  const filteredTontines = useMemo(() => {
    return tontines.filter(tontine => {
      const matchesSearch = tontine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tontine.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || tontine.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [tontines, searchQuery, filterStatus]);

  // Memoized quick actions
  const quickActions = useMemo((): QuickAction[] => [
    {
      id: 'create-tontine',
      title: 'Créer une tontine',
      description: 'Nouveau groupe',
      icon: Plus,
      action: () => console.log('Create tontine'),
      color: 'text-green-600'
    },
    {
      id: 'join-tontine',
      title: 'Rejoindre',
      description: 'Code d\'invitation',
      icon: Users,
      action: () => console.log('Join tontine'),
      color: 'text-blue-600'
    },
    {
      id: 'my-contributions',
      title: 'Mes contributions',
      description: 'Historique',
      icon: TrendingUp,
      action: () => console.log('My contributions'),
      color: 'text-purple-600'
    },
    {
      id: 'wallet',
      title: 'Portefeuille',
      description: 'Solde Lightning',
      icon: CheckCircle,
      action: () => console.log('Wallet'),
      color: 'text-orange-600'
    }
  ], []);

  // Optimized data fetching
  const fetchTontines = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Simulate API call with network awareness
      await new Promise(resolve => setTimeout(resolve, isSlowConnection ? 2000 : 800));
      
      // Mock data
      const mockTontines: Tontine[] = [
        {
          id: '1',
          name: 'Tontine Famille Diouf',
          description: 'Épargne familiale pour les études des enfants',
          memberCount: 8,
          totalAmount: 240000,
          contributionAmount: 30000,
          status: 'active',
          nextContributionDate: '2024-01-15',
          progress: 75,
          imageUrl: '/api/placeholder/300/200'
        },
        {
          id: '2',
          name: 'Tontine Professionnelle',
          description: 'Épargne entre collègues pour les projets personnels',
          memberCount: 12,
          totalAmount: 180000,
          contributionAmount: 15000,
          status: 'active',
          nextContributionDate: '2024-01-20',
          progress: 60,
          imageUrl: '/api/placeholder/300/200'
        },
        {
          id: '3',
          name: 'Tontine Quartier',
          description: 'Épargne communautaire pour les événements',
          memberCount: 15,
          totalAmount: 300000,
          contributionAmount: 20000,
          status: 'completed',
          nextContributionDate: '2024-01-10',
          progress: 100,
          imageUrl: '/api/placeholder/300/200'
        }
      ];

      setTontines(mockTontines);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isSlowConnection]);

  // Initial load
  useEffect(() => {
    fetchTontines();
  }, [fetchTontines]);

  // Memoized handlers
  const handleTontinePress = useCallback((tontine: Tontine) => {
    console.log('Navigate to tontine:', tontine.id);
    // Navigation logic would go here
  }, []);

  const handleRefresh = useCallback(() => {
    fetchTontines(true);
  }, [fetchTontines]);

  const handleRetry = useCallback(() => {
    fetchTontines();
  }, [fetchTontines]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <NetworkAware className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <SkeletonLoader width="200px" height="32px" />
              <SkeletonLoader width="100px" height="40px" />
            </div>
            <QuickActions actions={quickActions} />
            <ListSkeleton count={3} />
          </div>
        </div>
      </NetworkAware>
    );
  }

  // Render error state
  if (error) {
    return (
      <NetworkAware className="min-h-screen bg-gray-50 flex items-center justify-center">
        <UserFriendlyError
          error={error}
          onRetry={handleRetry}
          title="Erreur de chargement"
          retryText="Réessayer"
        />
      </NetworkAware>
    );
  }

  return (
    <NetworkAware className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Tontines</h1>
              <p className="text-gray-600">Gérez vos groupes d'épargne</p>
            </div>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle tontine
            </Button>
          </div>

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Rechercher une tontine..."
                className="w-full"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Toutes
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Actives
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('completed')}
              >
                Terminées
              </Button>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
              Actualiser
            </Button>
          </div>

          {/* Tontines List */}
          {filteredTontines.length === 0 ? (
            <EmptyState
              title="Aucune tontine trouvée"
              message={searchQuery ? "Aucune tontine ne correspond à votre recherche" : "Rejoignez une tontine pour commencer à épargner ensemble"}
              actionText="Créer une tontine"
              onAction={() => console.log('Create tontine')}
            />
          ) : (
            <div className="grid gap-4">
              {filteredTontines.map((tontine) => (
                <TontineCard
                  key={tontine.id}
                  tontine={tontine}
                  onPress={handleTontinePress}
                />
              ))}
            </div>
          )}

          {/* Network Status Indicator */}
          {!isConnected && (
            <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Mode hors ligne</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </NetworkAware>
  );
};

// Performance optimization configuration
export const OPTIMIZED_CONFIG = {
  maxToRenderPerBatch: 5,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  initialNumToRender: 3,
  removeClippedSubviews: true,
  getItemLayout: (data: any, index: number) => ({
    length: 200, // Approximate item height
    offset: 200 * index,
    index,
  }),
};
