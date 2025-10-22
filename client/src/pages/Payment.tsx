import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkAware } from '@/components/ui/network-aware';
import { UserFriendlyError } from '@/components/ui/user-friendly-error';
import { PaymentFlow } from '@/components/ui/payment-flow';
import { Bitcoin, ArrowLeft, CheckCircle } from 'lucide-react';
import { APP_TITLE } from '@/const';

interface PaymentPageProps {
  groupId?: string;
  amount?: number;
}

export default function PaymentPage({ groupId, amount }: PaymentPageProps) {
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const handlePaymentComplete = (data: any) => {
    setPaymentData(data);
    setPaymentCompleted(true);
  };

  const handlePaymentCancel = () => {
    // Navigate back to group or home
    window.history.back();
  };

  const handleRetry = () => {
    setError(null);
    setPaymentCompleted(false);
    setPaymentData(null);
  };

  if (error) {
    return (
      <NetworkAware className="min-h-screen bg-gray-50 flex items-center justify-center">
        <UserFriendlyError
          error={error}
          onRetry={handleRetry}
          title="Erreur de paiement"
          retryText="Réessayer"
        />
      </NetworkAware>
    );
  }

  if (paymentCompleted) {
    return (
      <NetworkAware className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 mb-8">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/">
                <div className="flex items-center gap-2 cursor-pointer">
                  <Bitcoin className="h-8 w-8 text-orange-600" />
                  <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
                </div>
              </Link>
            </div>
          </header>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-800">Paiement réussi!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-lg font-semibold text-gray-900">
                  Montant payé: {paymentData?.amount?.toLocaleString()} sats
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Transaction confirmée sur le réseau Lightning
                </p>
              </div>
              
              <div className="space-y-3">
                <Link href="/groups">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Retour aux groupes
                  </Button>
                </Link>
                
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Voir le tableau de bord
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </NetworkAware>
    );
  }

  return (
    <NetworkAware className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 mb-8">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Bitcoin className="h-8 w-8 text-orange-600" />
                <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
              </div>
            </Link>
            
            <Button variant="ghost" onClick={handlePaymentCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </header>

        {/* Payment Flow */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Paiement Lightning
            </h2>
            <p className="text-gray-600">
              Effectuez votre contribution en utilisant le réseau Lightning
            </p>
          </div>

          <PaymentFlow
            onComplete={handlePaymentComplete}
            onCancel={handlePaymentCancel}
            initialAmount={amount || 0}
          />
        </div>
      </div>
    </NetworkAware>
  );
}
