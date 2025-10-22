// client/src/components/SecurePaymentFlow.tsx
// Example component showing how to integrate security into the payment flow

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { securityIntegration } from '@/lib/security/integration';
import { toast } from 'sonner';

interface SecurePaymentFlowProps {
  group: any;
  onPaymentComplete?: (result: any) => void;
  onCancel?: () => void;
}

export function SecurePaymentFlow({ group, onPaymentComplete, onCancel }: SecurePaymentFlowProps) {
  const [invoice, setInvoice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(false);

  // Check security status on mount
  React.useEffect(() => {
    const checkSecurity = async () => {
      try {
        await securityIntegration.initialize();
        setIsSecure(true);
      } catch (err) {
        console.error('Security check failed:', err);
        setIsSecure(false);
      }
    };
    
    checkSecurity();
  }, []);

  const handlePayment = async () => {
    if (!invoice.trim()) {
      setError('Please enter a valid Lightning invoice');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await securityIntegration.makePayment(invoice, {
        groupId: group.id,
        groupName: group.name,
        contributionAmount: group.contributionAmount
      });

      toast.success('Payment processed successfully!');
      onPaymentComplete?.(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      toast.error(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSecure) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Security Check Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to initialize secure payment system. Please check your connection and try again.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          Secure Payment
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-name">Group</Label>
          <Input
            id="group-name"
            value={group.name}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            value={`${group.contributionAmount?.toLocaleString() || 0} sats`}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice">Lightning Invoice</Label>
          <Input
            id="invoice"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="lnbc..."
            className="font-mono text-sm"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing || !invoice.trim()}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Pay Securely
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Certificate pinned</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Lightning Network</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
