import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Star, 
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/hooks/useLanguage';

interface CreditScoreProps {
  userId: string;
  className?: string;
}

export default function CreditScore({ userId, className = '' }: CreditScoreProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { t } = useLanguage();

  const creditScoreQuery = trpc.ai.credit.getScore.useQuery(
    { userId },
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      enabled: !!userId
    }
  );

  const updateScoreMutation = trpc.ai.credit.updateScore.useMutation({
    onSuccess: () => {
      setLastUpdated(new Date());
      creditScoreQuery.refetch();
    }
  });

  useEffect(() => {
    if (creditScoreQuery.data) {
      setLastUpdated(new Date());
    }
  }, [creditScoreQuery.data]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    if (score >= 0.4) return 'outline';
    return 'destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return t('excellent');
    if (score >= 0.8) return t('veryGood');
    if (score >= 0.7) return t('good');
    if (score >= 0.6) return t('fair');
    if (score >= 0.4) return t('poor');
    return t('veryPoor');
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { level: t('low'), color: 'text-green-600' };
    if (score >= 0.6) return { level: t('medium'), color: 'text-yellow-600' };
    if (score >= 0.4) return { level: t('high'), color: 'text-orange-600' };
    return { level: t('veryHigh'), color: 'text-red-600' };
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <Shield className="h-5 w-5 text-green-500" />;
    if (score >= 0.6) return <Star className="h-5 w-5 text-blue-500" />;
    if (score >= 0.4) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const handleRefreshScore = () => {
    updateScoreMutation.mutate({
      userId,
      score: creditScoreQuery.data?.credit_score || 0
    });
  };

  if (creditScoreQuery.isLoading) {
    return (
      <Card className={className}>
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

  if (creditScoreQuery.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">{t('failedToLoadCreditScore')}</p>
          <Button onClick={() => creditScoreQuery.refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scoreData = creditScoreQuery.data;
  if (!scoreData) return null;

  const score = scoreData.credit_score;
  const riskLevel = getRiskLevel(score);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon(score)}
            {t('creditScore')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getScoreBadgeVariant(score)}>
              {getScoreLabel(score)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshScore}
              disabled={updateScoreMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${updateScoreMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="text-6xl font-bold mb-2">
              <span className={getScoreColor(score)}>
                {Math.round(score * 1000)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {t('outOf')} 1000
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={score * 100} className="w-full max-w-xs mx-auto" />
            <p className="text-sm text-gray-600 mt-2">
              {t('reliabilityProbability')}: {Math.round(scoreData.reliability_probability * 100)}%
            </p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{t('riskLevel')}</p>
            <p className={`text-lg font-semibold ${riskLevel.color}`}>
              {riskLevel.level}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{t('modelVersion')}</p>
            <p className="text-lg font-semibold">
              {scoreData.model_version}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('aiRecommendations')}
          </h4>
          <div className="space-y-2">
            {scoreData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium">{t('scoreFactors')}</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('tontineContributions')}</span>
              <div className="flex items-center gap-2">
                <Progress value={score * 100} className="w-20" />
                <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('punctualityRate')}</span>
              <div className="flex items-center gap-2">
                <Progress value={score * 100} className="w-20" />
                <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('communityReputation')}</span>
              <div className="flex items-center gap-2">
                <Progress value={score * 100} className="w-20" />
                <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            {t('lastUpdated')}: {lastUpdated.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
