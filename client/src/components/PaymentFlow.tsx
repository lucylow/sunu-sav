import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { QrCode, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PaymentFlowProps {
  groupId?: string;
  amount?: number;
  memo?: string;
  onPaymentComplete?: (invoice: any) => void;
}

export default function PaymentFlow({ 
  groupId, 
  amount = 10000, 
  memo = "Tontine contribution",
  onPaymentComplete 
}: PaymentFlowProps) {
  const { user } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [paymentMemo, setPaymentMemo] = useState(memo);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'paid' | 'expired'>('idle');
  const [copied, setCopied] = useState(false);

  const createInvoiceMutation = trpc.wallet.createInvoice.useMutation({
    onSuccess: (invoice) => {
      setCurrentInvoice(invoice);
      setPaymentStatus('pending');
      toast.success("Invoice created! Scan QR code or copy payment request.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });

  const checkPaymentMutation = trpc.wallet.checkPayment.useMutation({
    onSuccess: (result) => {
      if (result.status === 'paid') {
        setPaymentStatus('paid');
        toast.success("Payment confirmed!");
        onPaymentComplete?.(currentInvoice);
      } else if (result.status === 'expired') {
        setPaymentStatus('expired');
        toast.error("Payment expired");
      }
    },
  });

  const processPaymentMutation = trpc.wallet.processPayment.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setPaymentStatus('paid');
        toast.success("Payment processed successfully!");
        onPaymentComplete?.(result.invoice);
      } else {
        toast.error(result.error || "Payment processing failed");
      }
    },
  });

  const handleCreateInvoice = () => {
    if (!user) {
      toast.error("Please sign in to create an invoice");
      return;
    }

    createInvoiceMutation.mutate({
      amount: paymentAmount,
      groupId,
      memo: paymentMemo,
    });
  };

  const handleCheckPayment = () => {
    if (!currentInvoice) return;
    
    checkPaymentMutation.mutate({
      paymentHash: currentInvoice.paymentHash,
    });
  };

  const handleProcessPayment = () => {
    if (!currentInvoice) return;
    
    processPaymentMutation.mutate({
      paymentHash: currentInvoice.paymentHash,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatAmount = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Auto-check payment status every 10 seconds when pending
  useEffect(() => {
    if (paymentStatus === 'pending' && currentInvoice) {
      const interval = setInterval(() => {
        handleCheckPayment();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [paymentStatus, currentInvoice]);

  return (
    <div className="space-y-6">
      {/* Payment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Lightning Payment
          </CardTitle>
          <CardDescription>
            Create a Lightning invoice for instant Bitcoin payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (satoshis)</Label>
            <Input
              id="amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              min="1"
              placeholder="10000"
            />
            <p className="text-sm text-gray-500">
              {formatAmount(paymentAmount)} ≈ ${(paymentAmount * 0.0001).toFixed(2)} USD
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Input
              id="memo"
              value={paymentMemo}
              onChange={(e) => setPaymentMemo(e.target.value)}
              placeholder="Payment description"
            />
          </div>

          <Button
            onClick={handleCreateInvoice}
            disabled={createInvoiceMutation.isPending || !paymentAmount}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Display */}
      {currentInvoice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Payment Invoice
              </CardTitle>
              <Badge className={getStatusColor()}>
                {paymentStatus.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>
              {formatAmount(currentInvoice.amount)} • Expires in 1 hour
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={currentInvoice.qrCode}
                  alt="Payment QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Payment Request */}
            <div className="space-y-2">
              <Label>Payment Request</Label>
              <div className="flex gap-2">
                <Input
                  value={currentInvoice.paymentRequest}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(currentInvoice.paymentRequest)}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Payment Hash */}
            <div className="space-y-2">
              <Label>Payment Hash</Label>
              <div className="flex gap-2">
                <Input
                  value={currentInvoice.paymentHash}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(currentInvoice.paymentHash)}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCheckPayment}
                disabled={checkPaymentMutation.isPending}
                className="flex-1"
              >
                {checkPaymentMutation.isPending ? "Checking..." : "Check Status"}
              </Button>
              
              {paymentStatus === 'pending' && (
                <Button
                  onClick={handleProcessPayment}
                  disabled={processPaymentMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processPaymentMutation.isPending ? "Processing..." : "Process Payment"}
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How to Pay</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Open your Lightning wallet (Phoenix, Breez, etc.)</li>
                <li>2. Scan the QR code or paste the payment request</li>
                <li>3. Confirm the payment amount and send</li>
                <li>4. Payment will be confirmed automatically</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Mode Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">Demo Mode</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This is a demo environment. Payments are simulated and no real Bitcoin is used.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
