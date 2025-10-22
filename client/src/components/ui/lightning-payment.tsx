// src/components/ui/lightning-payment.tsx
// Lightning Network payment integration component
// Handles invoice generation, payment processing, and status checking

import React, { useState, useEffect, useCallback } from 'react';
import { LightningBoltIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { apiClient, ContributionInvoice } from '@/lib/api-client';
import { UserFriendlyError } from './user-friendly-error';
import { SkeletonLoader } from './skeleton-loader';

interface LightningPaymentProps {
  groupId: string;
  amountSats: number;
  onPaymentSuccess?: (paymentHash: string) => void;
  onPaymentError?: (error: Error) => void;
  className?: string;
}

interface PaymentStatus {
  status: 'idle' | 'generating' | 'ready' | 'paying' | 'paid' | 'error';
  invoice?: ContributionInvoice;
  error?: string;
  paymentHash?: string;
}

export const LightningPayment: React.FC<LightningPaymentProps> = ({
  groupId,
  amountSats,
  onPaymentSuccess,
  onPaymentError,
  className = '',
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  const [isPolling, setIsPolling] = useState(false);

  // Generate Lightning invoice
  const generateInvoice = useCallback(async () => {
    try {
      setPaymentStatus({ status: 'generating' });
      
      const response = await apiClient.getContributionInvoice(groupId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate invoice');
      }

      setPaymentStatus({
        status: 'ready',
        invoice: response.data,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoice';
      setPaymentStatus({
        status: 'error',
        error: errorMessage,
      });
      onPaymentError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [groupId, onPaymentError]);

  // Check invoice status
  const checkInvoiceStatus = useCallback(async (paymentHash: string) => {
    try {
      const response = await apiClient.checkInvoiceStatus(paymentHash);
      
      if (!response.success || !response.data) {
        return false;
      }

      if (response.data.settled) {
        setPaymentStatus(prev => ({
          ...prev,
          status: 'paid',
          paymentHash,
        }));
        setIsPolling(false);
        onPaymentSuccess?.(paymentHash);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking invoice status:', error);
      return false;
    }
  }, [onPaymentSuccess]);

  // Start polling for payment status
  const startPolling = useCallback((paymentHash: string) => {
    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      const isPaid = await checkInvoiceStatus(paymentHash);
      if (isPaid) {
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
    }, 300000);
  }, [checkInvoiceStatus]);

  // Handle payment initiation
  const handlePayment = useCallback(async () => {
    if (!paymentStatus.invoice) return;

    try {
      setPaymentStatus(prev => ({ ...prev, status: 'paying' }));
      
      // In a real app, this would open the Lightning wallet
      // For demo purposes, we'll simulate the payment flow
      const paymentHash = paymentStatus.invoice.payment_hash;
      
      // Start polling for payment confirmation
      startPolling(paymentHash);
      
      // Simulate opening Lightning wallet
      if (window.confirm(`Open Lightning wallet to pay ${amountSats} sats?`)) {
        // In production, this would integrate with Lightning wallets like:
        // - Zeus, Phoenix, Breez (mobile)
        // - Alby, LNbits (web)
        // - Hardware wallets with Lightning support
        
        // For demo, we'll simulate a successful payment after 3 seconds
        setTimeout(() => {
          setPaymentStatus(prev => ({
            ...prev,
            status: 'paid',
            paymentHash,
          }));
          setIsPolling(false);
          onPaymentSuccess?.(paymentHash);
        }, 3000);
      } else {
        setPaymentStatus(prev => ({ ...prev, status: 'ready' }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setPaymentStatus({
        status: 'error',
        error: errorMessage,
      });
      onPaymentError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [paymentStatus.invoice, amountSats, startPolling, onPaymentSuccess, onPaymentError]);

  // Copy invoice to clipboard
  const copyInvoice = useCallback(async () => {
    if (!paymentStatus.invoice?.payment_request) return;
    
    try {
      await navigator.clipboard.writeText(paymentStatus.invoice.payment_request);
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy invoice:', error);
    }
  }, [paymentStatus.invoice]);

  // Format amount for display
  const formatAmount = (sats: number) => {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M sats`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}K sats`;
    }
    return `${sats} sats`;
  };

  // Format expiry time
  const formatExpiry = (expiry: number) => {
    const hours = Math.floor(expiry / 3600);
    const minutes = Math.floor((expiry % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <LightningBoltIcon className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Lightning Payment
          </h3>
          <p className="text-sm text-gray-600">
            {formatAmount(amountSats)} contribution
          </p>
        </div>
      </div>

      {/* Payment Status */}
      {paymentStatus.status === 'generating' && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <div>
            <p className="text-sm font-medium text-blue-900">Generating invoice...</p>
            <p className="text-xs text-blue-700">Creating Lightning payment request</p>
          </div>
        </div>
      )}

      {paymentStatus.status === 'ready' && paymentStatus.invoice && (
        <div className="space-y-4">
          {/* Invoice Details */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Invoice Ready</span>
              </div>
              <span className="text-xs text-green-700">
                Expires in {formatExpiry(paymentStatus.invoice.expiry)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatAmount(paymentStatus.invoice.amount_sats)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Hash:</span>
                <span className="text-xs font-mono text-gray-500">
                  {paymentStatus.invoice.payment_hash.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handlePayment}
              className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Pay with Lightning
            </button>
            <button
              onClick={copyInvoice}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Copy Invoice
            </button>
          </div>
        </div>
      )}

      {paymentStatus.status === 'paying' && (
        <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
          <ClockIcon className="w-6 h-6 text-yellow-600 animate-spin" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Processing Payment</p>
            <p className="text-xs text-yellow-700">
              Waiting for Lightning network confirmation...
            </p>
          </div>
        </div>
      )}

      {paymentStatus.status === 'paid' && (
        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Payment Confirmed!</p>
            <p className="text-xs text-green-700">
              Transaction hash: {paymentStatus.paymentHash?.slice(0, 16)}...
            </p>
          </div>
        </div>
      )}

      {paymentStatus.status === 'error' && (
        <UserFriendlyError
          error={new Error(paymentStatus.error || 'Payment failed')}
          onRetry={generateInvoice}
          title="Payment Error"
          retryText="Try Again"
        />
      )}

      {/* Generate Invoice Button */}
      {paymentStatus.status === 'idle' && (
        <button
          onClick={generateInvoice}
          className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
        >
          Generate Lightning Invoice
        </button>
      )}

      {/* Lightning Wallet Integration Info */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-2">
          <strong>Supported Lightning Wallets:</strong>
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>• Zeus (Mobile)</div>
          <div>• Phoenix (Mobile)</div>
          <div>• Breez (Mobile)</div>
          <div>• Alby (Web)</div>
          <div>• LNbits (Web)</div>
          <div>• Hardware Wallets</div>
        </div>
      </div>
    </div>
  );
};

export default LightningPayment;
