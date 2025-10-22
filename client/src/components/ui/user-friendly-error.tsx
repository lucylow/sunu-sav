import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { AlertTriangle, RefreshCw, X, WifiOff, CreditCard, Clock } from 'lucide-react';

interface UserFriendlyErrorProps {
  error?: Error | string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  title?: string;
  retryText?: string;
  cancelText?: string;
  className?: string;
  variant?: 'default' | 'payment' | 'network' | 'timeout';
}

const getErrorMessage = (error: Error | string | null): string => {
  if (!error) return 'Une erreur est survenue. Réessayez plus tard.';
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'object' && error ? (error as any).code : null;

  // Convert technical errors to user-friendly messages in French
  const errorMap: Record<string, string> = {
    'NETWORK_ERROR': 'Problème de connexion. Vérifiez votre internet.',
    'TIMEOUT': 'La requête a pris trop de temps. Réessayez.',
    'INSUFFICIENT_FUNDS': 'Fonds insuffisants pour cette transaction.',
    'INVOICE_EXPIRED': 'La facture a expiré. Générez-en une nouvelle.',
    'PAYMENT_FAILED': 'Le paiement n\'a pas pu être traité.',
    'INVALID_PHONE': 'Numéro de téléphone invalide.',
    'USER_NOT_FOUND': 'Utilisateur non trouvé.',
    'TONTINE_NOT_FOUND': 'Tontine non trouvée.',
    'UNAUTHORIZED': 'Vous n\'êtes pas autorisé à effectuer cette action.',
    'RATE_LIMITED': 'Trop de tentatives. Attendez un moment.',
    'SERVER_ERROR': 'Erreur du serveur. Réessayez plus tard.',
    'default': 'Une erreur est survenue. Réessayez plus tard.'
  };

  return errorMap[errorCode] || errorMessage || errorMap.default;
};

const getErrorIcon = (variant: string, error: Error | string | null) => {
  const errorCode = typeof error === 'object' && error ? (error as any).code : null;
  
  switch (variant) {
    case 'payment':
      return CreditCard;
    case 'network':
      return WifiOff;
    case 'timeout':
      return Clock;
    default:
      return AlertTriangle;
  }
};

export const UserFriendlyError: React.FC<UserFriendlyErrorProps> = ({
  error,
  onRetry,
  onCancel,
  title = "Quelque chose s'est mal passé",
  retryText = "Réessayer",
  cancelText = "Annuler",
  className,
  variant = 'default'
}) => {
  const errorMessage = getErrorMessage(error ?? null);
  const IconComponent = getErrorIcon(variant, error ?? null);

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-gray-100',
      className
    )}>
      <div className="text-6xl mb-4">😕</div>
      <IconComponent className="w-12 h-12 text-gray-400 mb-4" />
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-gray-600 text-center mb-6 max-w-sm leading-relaxed">
        {errorMessage}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="flex-1"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryText}
          </Button>
        )}
        
        {onCancel && (
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <X className="w-4 h-4 mr-2" />
            {cancelText}
          </Button>
        )}
      </div>
    </div>
  );
};

export const PaymentError: React.FC<{
  error?: Error | string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}> = ({ error, onRetry, onCancel, className }) => (
  <UserFriendlyError
    error={error}
    onRetry={onRetry}
    onCancel={onCancel}
    title="Paiement échoué"
    retryText="Réessayer le paiement"
    cancelText="Annuler"
    variant="payment"
    className={className}
  />
);

export const NetworkError: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <UserFriendlyError
    error="NETWORK_ERROR"
    onRetry={onRetry}
    title="Problème de connexion"
    retryText="Réessayer"
    variant="network"
    className={className}
  />
);

export const TimeoutError: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <UserFriendlyError
    error="TIMEOUT"
    onRetry={onRetry}
    title="Requête expirée"
    retryText="Réessayer"
    variant="timeout"
    className={className}
  />
);

// Error boundary component for catching React errors
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error; resetError: () => void }> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error; resetError: () => void }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <UserFriendlyError
          error={this.state.error}
          onRetry={this.resetError}
          title="Une erreur inattendue s'est produite"
          retryText="Recharger la page"
        />
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors
export const useAsyncError = () => {
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const execute = React.useCallback(
    async (
      asyncFn: () => Promise<any>,
      onSuccess?: (result: any) => void,
      onError?: (error: Error) => void
    ): Promise<any> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await asyncFn();
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    execute,
    reset
  };
};
