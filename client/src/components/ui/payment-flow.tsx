import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowLeft, 
  ArrowRight, 
  CreditCard, 
  QrCode, 
  Clock,
  Coins,
  Smartphone,
  Copy,
  ExternalLink
} from 'lucide-react';

interface PaymentStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PaymentFlowProps {
  onComplete: (paymentData: any) => void;
  onCancel: () => void;
  initialAmount?: number;
  className?: string;
}

const steps: PaymentStep[] = [
  { 
    id: 1, 
    title: 'Montant', 
    description: 'Choisir le montant',
    icon: Coins
  },
  { 
    id: 2, 
    title: 'Paiement', 
    description: 'Scanner ou partager',
    icon: QrCode
  },
  { 
    id: 3, 
    title: 'Confirmation', 
    description: 'Attendre validation',
    icon: CheckCircle
  },
];

const AmountStep: React.FC<{
  onNext: (amount: number) => void;
  initialAmount?: number;
}> = ({ onNext, initialAmount = 0 }) => {
  const [amount, setAmount] = useState(initialAmount);
  const [customAmount, setCustomAmount] = useState('');
  
  const predefinedAmounts = [1000, 5000, 10000, 20000];
  
  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };
  
  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value) || 0;
    setAmount(numValue);
  };
  
  const getFCFAEquivalent = (sats: number) => {
    // Approximate conversion: 1 sat ≈ 0.0003 FCFA (this should be dynamic)
    return Math.round(sats * 0.0003);
  };
  
  const isValidAmount = amount > 0 && amount <= 1000000; // Max 1M sats
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Combien voulez-vous payer?</h3>
        <p className="text-gray-600">Choisissez le montant en satoshis</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {predefinedAmounts.map((predefinedAmount) => (
          <Button
            key={predefinedAmount}
            variant={amount === predefinedAmount ? 'default' : 'outline'}
            className={cn(
              'h-auto p-4 flex flex-col items-center space-y-1',
              amount === predefinedAmount && 'bg-black text-white'
            )}
            onClick={() => handleAmountSelect(predefinedAmount)}
          >
            <span className="font-semibold">{predefinedAmount.toLocaleString()} sats</span>
            <span className="text-xs opacity-75">
              ≈ {getFCFAEquivalent(predefinedAmount).toLocaleString()} FCFA
            </span>
          </Button>
        ))}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="custom-amount">Montant personnalisé</Label>
        <div className="relative">
          <Input
            id="custom-amount"
            type="number"
            placeholder="Entrez le montant"
            value={customAmount}
            onChange={(e) => handleCustomAmount(e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            sats
          </div>
        </div>
        {amount > 0 && (
          <p className="text-sm text-gray-600">
            ≈ {getFCFAEquivalent(amount).toLocaleString()} FCFA
          </p>
        )}
      </div>
      
      <Button
        onClick={() => onNext(amount)}
        disabled={!isValidAmount}
        className="w-full"
        size="lg"
      >
        Continuer avec {amount.toLocaleString()} sats
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const PaymentStep: React.FC<{
  amount: number;
  onNext: () => void;
  onBack: () => void;
}> = ({ amount, onNext, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'link' | 'copy'>('qr');
  const [invoice, setInvoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Mock invoice generation
  useEffect(() => {
    if (amount > 0) {
      setIsGenerating(true);
      // Simulate API call
      setTimeout(() => {
        setInvoice(`lnbc${amount}u1p...`); // Mock Lightning invoice
        setIsGenerating(false);
      }, 1500);
    }
  }, [amount]);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invoice);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Paiement Lightning',
        text: `Paiement de ${amount} sats`,
        url: invoice
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Méthode de paiement</h3>
        <p className="text-gray-600">Choisissez comment vous voulez payer</p>
      </div>
      
      <div className="space-y-3">
        <Button
          variant={paymentMethod === 'qr' ? 'default' : 'outline'}
          className="w-full justify-start h-auto p-4"
          onClick={() => setPaymentMethod('qr')}
        >
          <QrCode className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Scanner QR Code</div>
            <div className="text-sm opacity-75">Utilisez votre portefeuille Lightning</div>
          </div>
        </Button>
        
        <Button
          variant={paymentMethod === 'link' ? 'default' : 'outline'}
          className="w-full justify-start h-auto p-4"
          onClick={() => setPaymentMethod('link')}
        >
          <Smartphone className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Partager le lien</div>
            <div className="text-sm opacity-75">Envoyer le lien de paiement</div>
          </div>
        </Button>
        
        <Button
          variant={paymentMethod === 'copy' ? 'default' : 'outline'}
          className="w-full justify-start h-auto p-4"
          onClick={() => setPaymentMethod('copy')}
        >
          <Copy className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Copier l'invoice</div>
            <div className="text-sm opacity-75">Copier le code Lightning</div>
          </div>
        </Button>
      </div>
      
      {isGenerating ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Génération de la facture...</p>
        </div>
      ) : invoice ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Facture Lightning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Montant:</p>
              <p className="font-semibold">{amount.toLocaleString()} sats</p>
            </div>
            
            {paymentMethod === 'qr' && (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  {/* QR Code placeholder - you'd use a QR code library here */}
                  <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Scannez avec votre portefeuille Lightning
                </p>
              </div>
            )}
            
            {paymentMethod === 'copy' && (
              <div className="space-y-2">
                <Label>Code de facture:</Label>
                <div className="flex space-x-2">
                  <Input value={invoice} readOnly className="font-mono text-xs" />
                  <Button onClick={copyToClipboard} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {paymentMethod === 'link' && (
              <div className="space-y-2">
                <Button onClick={shareLink} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Partager le lien de paiement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
      
      <div className="flex space-x-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!invoice}>
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const ConfirmationStep: React.FC<{
  amount: number;
  onComplete: () => void;
  onBack: () => void;
}> = ({ amount, onComplete, onBack }) => {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  
  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      setStatus('processing');
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        setStatus('completed');
      }, 3000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-gray-400" />;
      case 'processing':
        return <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <Circle className="w-8 h-8 text-red-500" />;
    }
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'En attente du paiement...';
      case 'processing':
        return 'Traitement du paiement...';
      case 'completed':
        return 'Paiement confirmé!';
      case 'failed':
        return 'Paiement échoué';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        <h3 className="text-xl font-semibold mb-2">{getStatusMessage()}</h3>
        <p className="text-gray-600">
          Montant: {amount.toLocaleString()} sats
        </p>
      </div>
      
      {status === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h4 className="font-semibold text-green-800">Paiement réussi!</h4>
              <p className="text-green-700">
                Votre paiement de {amount.toLocaleString()} sats a été confirmé.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {status === 'failed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Circle className="w-12 h-12 text-red-500 mx-auto" />
              <h4 className="font-semibold text-red-800">Paiement échoué</h4>
              <p className="text-red-700">
                Le paiement n'a pas pu être traité. Veuillez réessayer.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex space-x-3">
        {status !== 'completed' && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        )}
        
        {status === 'completed' && (
          <Button onClick={onComplete} className="flex-1">
            Terminer
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  onComplete,
  onCancel,
  initialAmount = 0,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [amount, setAmount] = useState(initialAmount);
  
  const StepIndicator: React.FC = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
              currentStep >= step.id 
                ? 'bg-black border-black text-white' 
                : 'bg-white border-gray-300 text-gray-400'
            )}>
              {currentStep > step.id ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="ml-3 hidden sm:block">
              <p className={cn(
                'text-sm font-medium',
                currentStep >= step.id ? 'text-black' : 'text-gray-400'
              )}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-4 transition-colors',
              currentStep > step.id ? 'bg-black' : 'bg-gray-300'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <AmountStep 
            onNext={(selectedAmount) => {
              setAmount(selectedAmount);
              setCurrentStep(2);
            }}
            initialAmount={amount}
          />
        );
      case 2:
        return (
          <PaymentStep
            amount={amount}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <ConfirmationStep
            amount={amount}
            onComplete={() => onComplete({ amount, status: 'completed' })}
            onBack={() => setCurrentStep(2)}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className={cn('max-w-md mx-auto', className)}>
      <StepIndicator />
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>
      
      <div className="mt-8 pt-4 border-t">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="w-full text-gray-500"
        >
          Annuler le paiement
        </Button>
      </div>
    </div>
  );
};
