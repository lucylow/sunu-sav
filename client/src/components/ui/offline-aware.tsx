// src/components/ui/offline-aware.tsx
// Offline-aware UI components for SunuSàv
// Provides visual feedback for offline states, pending operations, and sync status

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './brand-button';
import { Badge } from './badge';
import { Progress } from './progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Upload,
  Download,
  Zap,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { 
  offlineStorage, 
  PendingContribution, 
  SyncStatus 
} from '@/lib/offline-storage';
import { 
  syncEngine, 
  addConnectivityListener, 
  getSyncStatus,
  forceSync,
  retryFailedContributions
} from '@/lib/sync-engine';

// Offline banner component
export const OfflineBanner: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const unsubscribe = addConnectivityListener(setIsOnline);
    
    const updateSyncStatus = async () => {
      const status = await getSyncStatus();
      setSyncStatus(status);
    };
    
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && (!syncStatus || syncStatus.pendingCount === 0)) {
    return null;
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300',
      !isOnline 
        ? 'bg-orange-500 text-white' 
        : 'bg-blue-500 text-white',
      className
    )}>
      <div className="flex items-center justify-center space-x-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Mode hors ligne - Actions en attente</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>{syncStatus?.pendingCount || 0} contribution(s) en attente de synchronisation</span>
          </>
        )}
      </div>
    </div>
  );
};

// Sync status indicator
export const SyncStatusIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = addConnectivityListener(setIsOnline);
    
    const updateStatus = async () => {
      const status = await getSyncStatus();
      setSyncStatus(status);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-orange-500" />;
    if (syncStatus?.syncInProgress) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (syncStatus?.pendingCount && syncStatus.pendingCount > 0) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Hors ligne';
    if (syncStatus?.syncInProgress) return 'Synchronisation...';
    if (syncStatus?.pendingCount && syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} en attente`;
    return 'Synchronisé';
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
};

// Pending contributions queue
export const PendingQueueList: React.FC<{ className?: string }> = ({ className }) => {
  const [contributions, setContributions] = useState<PendingContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContributions = async () => {
      const pending = await offlineStorage.getPendingContributions();
      setContributions(pending);
      setIsLoading(false);
    };
    
    loadContributions();
    const interval = setInterval(loadContributions, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (contribution: PendingContribution) => {
    await offlineStorage.updateContributionStatus(contribution.id, 'pending');
    await forceSync();
  };

  const handleRemove = async (id: string) => {
    await offlineStorage.removeContribution(id);
    const pending = await offlineStorage.getPendingContributions();
    setContributions(pending);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contributions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Aucune contribution en attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            Toutes vos contributions ont été synchronisées avec succès.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Contributions en attente
          </div>
          <Badge variant="secondary">{contributions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contributions.map((contribution) => (
          <div
            key={contribution.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  Groupe {contribution.groupId}
                </span>
                <Badge 
                  variant={
                    contribution.status === 'pending' ? 'secondary' :
                    contribution.status === 'retrying' ? 'outline' :
                    contribution.status === 'failed' ? 'destructive' : 'default'
                  }
                >
                  {contribution.status === 'pending' && 'En attente'}
                  {contribution.status === 'retrying' && 'Nouvelle tentative'}
                  {contribution.status === 'failed' && 'Échec'}
                  {contribution.status === 'submitted' && 'Envoyé'}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {contribution.amountSats.toLocaleString()} sats
              </div>
              {contribution.errorMessage && (
                <div className="text-xs text-red-600 mt-1">
                  {contribution.errorMessage}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {contribution.status === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetry(contribution)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Réessayer
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(contribution.id)}
              >
                <XCircle className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="flex gap-2 pt-3 border-t">
          <Button
            size="sm"
            onClick={() => forceSync()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Synchroniser maintenant
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => retryFailedContributions()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer les échecs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Offline contribution form
export const OfflineContributionForm: React.FC<{
  groupId: string;
  onContributionQueued: (contribution: PendingContribution) => void;
  className?: string;
}> = ({ groupId, onContributionQueued, className }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = addConnectivityListener(setIsOnline);
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountSats = parseInt(amount);
    if (!amountSats || amountSats <= 0) return;

    setIsSubmitting(true);
    
    try {
      const contribution = await offlineStorage.addPendingContribution(
        groupId,
        amountSats,
        { submittedVia: isOnline ? 'online' : 'offline' }
      );
      
      onContributionQueued(contribution);
      setAmount('');
    } catch (error) {
      console.error('Failed to queue contribution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Contribution Lightning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (sats)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span>En ligne - Synchronisation immédiate</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-500" />
                <span>Hors ligne - Synchronisation différée</span>
              </>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting || !amount}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Contribuer
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// USSD fallback component
export const USSDContributionCard: React.FC<{
  groupId: string;
  className?: string;
}> = ({ groupId, className }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUSSDSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountSats = parseInt(amount);
    if (!amountSats || !phoneNumber) return;

    setIsSubmitting(true);
    
    try {
      const success = await syncEngine.submitUSSDContribution(
        groupId,
        amountSats,
        phoneNumber
      );
      
      if (success) {
        setPhoneNumber('');
        setAmount('');
        // Show success message
      }
    } catch (error) {
      console.error('USSD contribution failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('border-blue-200 bg-blue-50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-600" />
          Contribution USSD
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUSSDSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="77 123 45 67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (sats)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <MessageSquare className="w-4 h-4" />
            <span>Utilisez *888# pour les téléphones basiques</span>
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting || !amount || !phoneNumber}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Envoyer via USSD
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Sync progress indicator
export const SyncProgressIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateStatus = async () => {
      const status = await getSyncStatus();
      setSyncStatus(status);
      
      if (status.pendingCount > 0) {
        setProgress((status.pendingCount - status.failedCount) / status.pendingCount * 100);
      } else {
        setProgress(100);
      }
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!syncStatus || syncStatus.pendingCount === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Synchronisation</span>
        <span className="font-medium">
          {syncStatus.pendingCount - syncStatus.failedCount} / {syncStatus.pendingCount}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

// Offline settings panel
export const OfflineSettingsPanel: React.FC<{ className?: string }> = ({ className }) => {
  const [settings, setSettings] = useState(offlineStorage.getSettings());
  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await offlineStorage.getStorageStats();
      setStorageStats(stats);
    };
    loadStats();
  }, []);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    offlineStorage.saveSettings(newSettings);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-gray-600" />
          Paramètres hors ligne
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.autoSyncEnabled}
              onChange={(e) => handleSettingChange('autoSyncEnabled', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Synchronisation automatique</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.syncOnlyOnWifi}
              onChange={(e) => handleSettingChange('syncOnlyOnWifi', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Synchroniser uniquement en Wi-Fi</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tentatives de synchronisation: {settings.maxRetryAttempts}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.maxRetryAttempts}
              onChange={(e) => handleSettingChange('maxRetryAttempts', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        {storageStats && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Statistiques de stockage</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Contributions en attente: {storageStats.contributionCount}</div>
              <div>Groupes mis en cache: {storageStats.groupCount}</div>
              <div>Reçus stockés: {storageStats.receiptCount}</div>
              <div>Taille totale: {(storageStats.totalSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
