// frontend/src/components/ai/FraudAlerts.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import aiClient from '../../ai/mockAiClient.js';

interface Transaction {
  txid?: string;
  payment_hash?: string;
  amountSats: number;
  userId: string;
}

interface FraudAlert {
  txid?: string;
  payment_hash?: string;
  amountSats: number;
  userId: string;
  reason: string;
  score: number;
}

interface FraudAlertsProps {
  recentTxs?: Transaction[];
}

export default function FraudAlerts({ recentTxs = [] }: FraudAlertsProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (recentTxs.length === 0) { 
        setAlerts([]); 
        return; 
      }
      
      setLoading(true);
      try {
        const r = await aiClient.detectFraud({ batch: recentTxs });
        if (mounted) setAlerts(r);
      } catch (error) {
        console.error('Fraud detection error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [JSON.stringify(recentTxs)]);

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.6) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getRiskBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 0.6) return <Badge variant="outline" className="border-orange-500 text-orange-600">Medium Risk</Badge>;
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low Risk</Badge>;
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'large_amount':
        return 'Unusually large transaction amount';
      case 'anomalous_timing':
        return 'Suspicious timing pattern';
      case 'rapid_fire_payments':
        return 'Multiple rapid payments detected';
      case 'amount_manipulation':
        return 'Potential amount manipulation';
      default:
        return 'Suspicious activity detected';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alerts.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Fraud Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No fraud detected</p>
          <p className="text-sm text-gray-500 mt-2">
            All recent transactions appear legitimate
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Fraud Alerts
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-900">Suspicious Activity Detected</span>
          </div>
          <p className="text-sm text-red-800">
            AI has identified {alerts.length} potentially fraudulent transaction{alerts.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {alert.txid || alert.payment_hash || 'Unknown'}
                  </span>
                  {getRiskBadge(alert.score)}
                </div>
                <span className={`text-sm font-medium ${getRiskColor(alert.score)}`}>
                  {(alert.score * 100).toFixed(0)}% risk
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  <strong>Amount:</strong> {alert.amountSats.toLocaleString()} sats
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Reason:</strong> {getReasonText(alert.reason)}
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Block Transaction
                </button>
                <button className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                  Review Manually
                </button>
                <button className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                  Mark as Safe
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>AI Protection:</strong> These alerts are generated by our machine learning 
            fraud detection system that analyzes transaction patterns, amounts, and timing 
            to identify suspicious activity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
