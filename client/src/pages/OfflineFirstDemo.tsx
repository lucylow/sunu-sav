// src/pages/OfflineFirstDemo.tsx
// Comprehensive demonstration of offline-first features for SunuSàv
// Shows all offline capabilities, sync status, and fallback options

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/brand-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  OfflineBanner,
  SyncStatusIndicator,
  PendingQueueList,
  OfflineContributionForm,
  USSDContributionCard,
  SyncProgressIndicator,
  OfflineSettingsPanel
} from '@/components/ui/offline-aware';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  Download,
  Zap,
  Smartphone,
  MessageSquare,
  Database,
  Settings,
  BarChart3,
  Shield,
  Users,
  TrendingUp
} from 'lucide-react';
import { 
  offlineStorage, 
  PendingContribution, 
  SyncStatus,
  CachedGroupData 
} from '@/lib/offline-storage';
import { 
  syncEngine, 
  addConnectivityListener, 
  getSyncStatus,
  forceSync,
  retryFailedContributions,
  isOnline
} from '@/lib/sync-engine';

export default function OfflineFirstDemo() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pendingContributions, setPendingContributions] = useState<PendingContribution[]>([]);
  const [cachedGroups, setCachedGroups] = useState<CachedGroupData[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('group-1');

  useEffect(() => {
    const unsubscribe = addConnectivityListener(setIsOnline);
    
    const loadData = async () => {
      const [status, contributions, groups, stats] = await Promise.all([
        getSyncStatus(),
        offlineStorage.getPendingContributions(),
        offlineStorage.getAllCachedGroups(),
        offlineStorage.getStorageStats()
      ]);
      
      setSyncStatus(status);
      setPendingContributions(contributions);
      setCachedGroups(groups);
      setStorageStats(stats);
    };
    
    loadData();
    const interval = setInterval(loadData, 3000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleContributionQueued = (contribution: PendingContribution) => {
    setPendingContributions(prev => [...prev, contribution]);
  };

  const simulateOfflineMode = () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  };

  const simulateOnlineMode = () => {
    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));
  };

  const addMockContribution = async () => {
    const contribution = await offlineStorage.addPendingContribution(
      selectedGroupId,
      Math.floor(Math.random() * 50000) + 10000,
      { 
        submittedVia: 'demo',
        mockData: true 
      }
    );
    setPendingContributions(prev => [...prev, contribution]);
  };

  const addMockGroup = async () => {
    const mockGroup: CachedGroupData = {
      id: `group-${Date.now()}`,
      name: `Tontine ${cachedGroups.length + 1}`,
      description: 'Groupe d\'épargne communautaire',
      memberCount: Math.floor(Math.random() * 10) + 5,
      totalAmount: Math.floor(Math.random() * 100000) + 50000,
      contributionAmount: Math.floor(Math.random() * 10000) + 5000,
      status: 'active',
      progress: Math.floor(Math.random() * 100),
      nextContributionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      lastUpdated: Date.now(),
      version: 1,
    };
    
    await offlineStorage.cacheGroupData(mockGroup);
    setCachedGroups(prev => [...prev, mockGroup]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-gold-50">
      <OfflineBanner />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-gold-500 rounded-2xl shadow-lg">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-charcoal-900">SunuSàv Offline-First</h1>
          </div>
          <p className="text-xl text-charcoal-600 mb-4">
            Fonctionnalités hors ligne pour les connexions intermittentes
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Conçu pour fonctionner dans des conditions de connectivité difficiles au Sénégal, 
            avec synchronisation automatique et fallbacks USSD/SMS.
          </p>
          
          {/* Connectivity Status */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <SyncStatusIndicator />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={simulateOfflineMode}
                disabled={!isOnline}
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Simuler hors ligne
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={simulateOnlineMode}
                disabled={isOnline}
              >
                <Wifi className="w-4 h-4 mr-2" />
                Simuler en ligne
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="sync">Synchronisation</TabsTrigger>
            <TabsTrigger value="groups">Groupes</TabsTrigger>
            <TabsTrigger value="fallback">Fallbacks</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Contributions hors ligne</h3>
                  <p className="text-sm text-gray-600">Queue et synchronisation automatique</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Cache local</h3>
                  <p className="text-sm text-gray-600">Données disponibles sans internet</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">USSD/SMS</h3>
                  <p className="text-sm text-gray-600">Fallback pour téléphones basiques</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Vérification</h3>
                  <p className="text-sm text-gray-600">Hachages de reçus sécurisés</p>
                </CardContent>
              </Card>
            </div>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  État actuel du système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Connectivité</span>
                      <Badge variant={isOnline ? 'default' : 'destructive'}>
                        {isOnline ? 'En ligne' : 'Hors ligne'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Contributions en attente</span>
                      <Badge variant="secondary">{pendingContributions.length}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Groupes mis en cache</span>
                      <Badge variant="secondary">{cachedGroups.length}</Badge>
                    </div>
                    
                    {storageStats && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Taille du cache</span>
                        <span className="text-sm text-gray-600">
                          {(storageStats.totalSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <SyncProgressIndicator />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contributions Tab */}
          <TabsContent value="contributions" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <OfflineContributionForm
                groupId={selectedGroupId}
                onContributionQueued={handleContributionQueued}
              />
              
              <USSDContributionCard groupId={selectedGroupId} />
            </div>
            
            <PendingQueueList />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Actions de démonstration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button onClick={addMockContribution} variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Ajouter contribution test
                  </Button>
                  
                  <Button onClick={() => forceSync()} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Forcer synchronisation
                  </Button>
                  
                  <Button onClick={() => retryFailedContributions()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer échecs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    Statut de synchronisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {syncStatus && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dernière synchronisation</span>
                        <span className="text-sm text-gray-600">
                          {new Date(syncStatus.lastSyncAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">En cours</span>
                        <Badge variant={syncStatus.syncInProgress ? 'default' : 'secondary'}>
                          {syncStatus.syncInProgress ? 'Oui' : 'Non'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">En attente</span>
                        <Badge variant="secondary">{syncStatus.pendingCount}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Échecs</span>
                        <Badge variant="destructive">{syncStatus.failedCount}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    Actions de synchronisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => forceSync()} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Synchroniser maintenant
                  </Button>
                  
                  <Button onClick={() => retryFailedContributions()} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer les échecs
                  </Button>
                  
                  <Button onClick={() => offlineStorage.clearSubmittedContributions()} variant="outline" className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Nettoyer les soumissions
                  </Button>
                </CardContent>
              </Card>
            </div>

            <PendingQueueList />
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Groupes mis en cache</h3>
              <Button onClick={addMockGroup} variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Ajouter groupe test
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cachedGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-gray-600">{group.description}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Membres</span>
                      <span className="font-medium">{group.memberCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total</span>
                      <span className="font-medium">{group.totalAmount.toLocaleString()} sats</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Progression</span>
                      <span className="font-medium">{group.progress}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Mis à jour: {new Date(group.lastUpdated).toLocaleString('fr-FR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Fallback Tab */}
          <TabsContent value="fallback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  Options de fallback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">USSD (*888#)</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>• Composez *888# sur votre téléphone</div>
                      <div>• Suivez les instructions vocales</div>
                      <div>• Confirmez votre contribution</div>
                      <div>• Recevez une confirmation SMS</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">SMS</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>• Envoyez "CONTRIB" au 888</div>
                      <div>• Suivez les instructions</div>
                      <div>• Confirmez le montant</div>
                      <div>• Recevez un reçu</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-3">Agent mobile money</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl mb-2">🏪</div>
                      <div className="font-medium">Agent Orange Money</div>
                      <div className="text-sm text-gray-600">Près de chez vous</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl mb-2">🏦</div>
                      <div className="font-medium">Agent Free Money</div>
                      <div className="text-sm text-gray-600">Dans votre quartier</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-medium">Agent Wave</div>
                      <div className="text-sm text-gray-600">Marchés et commerces</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <OfflineSettingsPanel />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-gray-600" />
                    Gestion des données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => offlineStorage.cleanupOldData()}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nettoyer les anciennes données
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      const data = await offlineStorage.exportData();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sunusav-backup.json';
                      a.click();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter les données
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Statistiques de stockage</h4>
                    {storageStats && (
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Contributions: {storageStats.contributionCount}</div>
                        <div>Groupes: {storageStats.groupCount}</div>
                        <div>Reçus: {storageStats.receiptCount}</div>
                        <div>Taille: {(storageStats.totalSize / 1024).toFixed(1)} KB</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-12" />

        {/* Feature Highlights */}
        <Card className="bg-gradient-to-r from-orange-50 to-gold-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Avantages du mode hors ligne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WifiOff className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fonctionne sans internet</h3>
                <p className="text-sm text-gray-600">Contributions et navigation même hors ligne</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Synchronisation automatique</h3>
                <p className="text-sm text-gray-600">Synchronise dès que la connexion revient</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Support USSD/SMS</h3>
                <p className="text-sm text-gray-600">Compatible avec tous les téléphones</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Sécurité garantie</h3>
                <p className="text-sm text-gray-600">Hachages de reçus et vérification</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Cache intelligent</h3>
                <p className="text-sm text-gray-600">Données disponibles instantanément</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Performance optimisée</h3>
                <p className="text-sm text-gray-600">Minimise l'utilisation des données</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
