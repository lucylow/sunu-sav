import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/accessible-input';
import { 
  Smartphone, Bitcoin, ArrowRight, CheckCircle, 
  AlertCircle, Clock, TrendingUp, Shield
} from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface WaveCashOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutAmount: number; // in sats
  winnerPhone?: string;
  onSuccess?: (result: any) => void;
}

interface ExchangeRate {
  btc_xof_rate: number;
  source: string;
  timestamp: string;
}

export const WaveCashOutModal: React.FC<WaveCashOutModalProps> = ({
  isOpen,
  onClose,
  payoutAmount,
  winnerPhone = '',
  onSuccess
}) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState(winnerPhone);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [xofAmount, setXofAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch exchange rate
  useEffect(() => {
    if (isOpen && payoutAmount > 0) {
      fetchExchangeRate();
    }
  }, [isOpen, payoutAmount]);

  // Calculate XOF amount when exchange rate changes
  useEffect(() => {
    if (exchangeRate && payoutAmount > 0) {
      const btcAmount = payoutAmount / 100000000; // Convert sats to BTC
      const calculatedXof = Math.floor(btcAmount * exchangeRate.btc_xof_rate);
      setXofAmount(calculatedXof);
    }
  }, [exchangeRate, payoutAmount]);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/monetization/rates/current');
      if (response.ok) {
        const rate = await response.json();
        setExchangeRate(rate);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Fallback rate
      setExchangeRate({
        btc_xof_rate: 8000000,
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }
  };

  const validateSenegalPhone = (phone: string): boolean => {
    // Senegal mobile numbers: +221 followed by 7, 8, or 9 digits
    const senegalRegex = /^\+221[789]\d{8}$/;
    return senegalRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove spaces and ensure +221 prefix
    let cleaned = phone.replace(/\s+/g, '');
    if (!cleaned.startsWith('+221')) {
      if (cleaned.startsWith('221')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+221' + cleaned.substring(1);
      } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '+221' + cleaned;
      }
    }
    return cleaned;
  };

  const handleCashOut = async () => {
    if (!validateSenegalPhone(phoneNumber)) {
      toast.error('Please enter a valid Senegal phone number (+221XXXXXXXX)');
      return;
    }

    if (xofAmount < 500) {
      toast.error('Minimum cash-out amount is 500 XOF');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/monetization/partners/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner: 'wave',
          phone_number: phoneNumber,
          amount_xof: xofAmount,
          amount_sats: payoutAmount,
          reference: `SunuSav_Payout_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error('Cash-out request failed');
      }

      const result = await response.json();
      setResult(result);
      onSuccess?.(result);
      
      toast.success(`Successfully cashed out ${xofAmount.toLocaleString()} XOF to Wave!`);
      
    } catch (error) {
      console.error('Cash-out failed:', error);
      toast.error('Cash-out failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-500" />
            Wave Mobile Money Cash-out
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Payout Amount Display */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-800">Payout Amount</span>
              <Bitcoin className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {payoutAmount.toLocaleString()} sats
            </div>
            {xofAmount > 0 && (
              <div className="text-sm text-orange-700">
                ≈ {xofAmount.toLocaleString()} XOF
              </div>
            )}
          </div>

          {/* Exchange Rate Info */}
          {exchangeRate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Exchange Rate:</span>
                <div className="text-right">
                  <div className="font-medium">
                    1 BTC = {exchangeRate.btc_xof_rate.toLocaleString()} XOF
                  </div>
                  <div className="text-xs text-gray-500">
                    Source: {exchangeRate.source}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Senegal Phone Number</label>
            <Input
              type="tel"
              placeholder="+221701234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              className={!phoneNumber || validateSenegalPhone(phoneNumber) ? '' : 'border-red-300'}
            />
            {phoneNumber && !validateSenegalPhone(phoneNumber) && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                Please enter a valid Senegal phone number
              </div>
            )}
            {phoneNumber && validateSenegalPhone(phoneNumber) && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Valid Senegal phone number
              </div>
            )}
          </div>

          {/* Wave Features */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Wave Mobile Money Features</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-blue-600">
                <CheckCircle className="h-3 w-3" />
                Instant transfer
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                No fees
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <CheckCircle className="h-3 w-3" />
                All networks
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <CheckCircle className="h-3 w-3" />
                Secure
              </div>
            </div>
          </div>

          {/* Minimum Amount Warning */}
          {xofAmount > 0 && xofAmount < 500 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Minimum Wave cash-out is 500 XOF. Current amount: {xofAmount} XOF
                </span>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Cash-out Successful!</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>Amount: {xofAmount.toLocaleString()} XOF</div>
                <div>Recipient: {phoneNumber}</div>
                <div>Transaction ID: {result.wave_transaction_id}</div>
                <div>Status: {result.status}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCashOut}
              disabled={processing || !validateSenegalPhone(phoneNumber) || xofAmount < 500}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Cash-out to Wave
                </>
              )}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              Funds will be instantly available in the recipient's Wave wallet.
              This service is powered by Wave Mobile Money Senegal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
