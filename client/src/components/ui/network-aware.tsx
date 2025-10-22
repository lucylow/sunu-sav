import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface NetworkAwareProps {
  children: React.ReactNode;
  className?: string;
  showOfflineBanner?: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

export const NetworkAware: React.FC<NetworkAwareProps> = ({ 
  children, 
  className,
  showOfflineBanner = true,
  onConnectionChange 
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      const isOnline = navigator.onLine;
      setIsConnected(isOnline);
      
      // Detect connection type if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      }
      
      onConnectionChange?.(isOnline);
    };

    checkConnection();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsConnected(true);
      onConnectionChange?.(true);
    };

    const handleOffline = () => {
      setIsConnected(false);
      onConnectionChange?.(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      };

      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onConnectionChange]);

  const getConnectionMessage = () => {
    if (!isConnected) {
      return {
        message: "Pas de connexion internet",
        description: "L'application fonctionne en mode hors ligne",
        type: "offline" as const,
        icon: WifiOff
      };
    }
    
    if (isSlowConnection) {
      return {
        message: "Connexion lente détectée",
        description: "Certaines fonctionnalités peuvent être limitées",
        type: "slow" as const,
        icon: AlertTriangle
      };
    }
    
    return null;
  };

  const connectionInfo = getConnectionMessage();

  return (
    <div className={cn('relative', className)}>
      {showOfflineBanner && connectionInfo && (
        <div className={cn(
          'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300',
          connectionInfo.type === 'offline' && 'bg-orange-500 text-white',
          connectionInfo.type === 'slow' && 'bg-yellow-500 text-black'
        )}>
          <div className="flex items-center justify-center space-x-2">
            <connectionInfo.icon className="w-4 h-4" />
            <span>{connectionInfo.message}</span>
          </div>
          <div className="text-xs mt-1 opacity-90">
            {connectionInfo.description}
          </div>
        </div>
      )}
      
      <div className={cn(
        showOfflineBanner && connectionInfo && 'pt-16'
      )}>
        {children}
      </div>
    </div>
  );
};

// Hook for network status
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const isOnline = navigator.onLine;
      setIsConnected(isOnline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      }
    };

    checkConnection();

    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      };

      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isConnected,
    connectionType,
    isSlowConnection,
    isOffline: !isConnected
  };
};

// Connection quality indicator component
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { isConnected, connectionType, isSlowConnection } = useNetworkStatus();

  if (!isConnected) {
    return (
      <div className={cn('flex items-center space-x-1 text-orange-500', className)}>
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">Hors ligne</span>
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div className={cn('flex items-center space-x-1 text-yellow-500', className)}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs">Lent</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-1 text-green-500', className)}>
      <Wifi className="w-4 h-4" />
      <span className="text-xs">{connectionType}</span>
    </div>
  );
};
