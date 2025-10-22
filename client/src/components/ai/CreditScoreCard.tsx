// frontend/src/components/ai/CreditScoreCard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import aiClient from '../../ai/mockAiClient';

interface CreditScoreCardProps {
  userId: string;
  features: {
    punctualityRate?: number;
    tontine_contributions?: number;
    community_reputation?: number;
  };
}

export default function CreditScoreCard({ userId, features }: CreditScoreCardProps) {
  const [loading, setLoading] = useState(true);
  const [scoreObj, setScoreObj] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await aiClient.predictCreditScore({ userId, features });
        if (mounted) setScoreObj(res);
      } catch (e) {
        console.error(e);
      } finally { 
        if (mounted) setLoading(false); 
      }
    })();
    return () => { mounted = false; };
  }, [userId, JSON.stringify(features)]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreObj) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-600">No credit score available</p>
        </CardContent>
      </Card>
    );
  }

  const score = Math.round(scoreObj.score * 1000);
  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 800) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (score >= 600) return <Badge variant="secondary">Good</Badge>;
    if (score >= 400) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          AI Credit Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-sm text-gray-500 mb-2">out of 1000</div>
          {getScoreBadge(score)}
        </div>
        
        <div>
          <Progress value={scoreObj.score * 100} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            Trust Probability: {Math.round(scoreObj.score * 100)}%
          </p>
        </div>

        {scoreObj.recommendedLoanXOF > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">Pre-approved Loan</span>
            </div>
            <p className="text-lg font-bold text-green-800">
              {scoreObj.recommendedLoanXOF.toLocaleString()} XOF
            </p>
            <p className="text-sm text-green-700">
              Based on your tontine participation and punctuality
            </p>
          </div>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Score Breakdown</summary>
          <div className="mt-2 space-y-1">
            {scoreObj.explanation.map((item: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span className="capitalize">{item.feature.replace('_', ' ')}</span>
                <span className="font-medium">{(item.impact * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
