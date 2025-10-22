import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bitcoin, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/hooks/useLanguage';

interface SavingsProjectionProps {
  userId?: string;
}

export default function AIInsightsDashboard({ userId }: SavingsProjectionProps) {
  const [weeklyAmount, setWeeklyAmount] = useState(5000);
  const [durationMonths, setDurationMonths] = useState(6);
  const [currentBtcPrice, setCurrentBtcPrice] = useState(50000);
  
  const { t } = useLanguage();

  const marketInsightsQuery = trpc.ai.insights.getMarketInsights.useQuery();
  const inflationHistoryQuery = trpc.ai.insights.getInflationHistory.useQuery({ days: 30 });
  
  const projectSavingsMutation = trpc.ai.insights.projectSavings.useMutation();

  const handleProjectSavings = () => {
    if (userId) {
      projectSavingsMutation.mutate({
        userId,
        weeklyAmountXOF: weeklyAmount,
        durationMonths,
        currentBtcPriceXOF: currentBtcPrice
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'falling': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('aiInsights')}</h2>
        <Badge variant="outline" className="text-sm">
          <Bitcoin className="h-3 w-3 mr-1" />
          {t('poweredByAI')}
        </Badge>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market">{t('marketInsights')}</TabsTrigger>
          <TabsTrigger value="savings">{t('savingsProjection')}</TabsTrigger>
          <TabsTrigger value="inflation">{t('inflationTracker')}</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          {marketInsightsQuery.isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ) : marketInsightsQuery.data ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('currentMarketConditions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{t('cfaInflation')}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPercentage(marketInsightsQuery.data.current_cfa_inflation * 100)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{t('btcTrend')}</p>
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(marketInsightsQuery.data.btc_price_trend)}
                        <span className="text-lg font-semibold capitalize">
                          {marketInsightsQuery.data.btc_price_trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      {t('aiRecommendation')}
                    </p>
                    <p className="text-sm text-blue-800">
                      {marketInsightsQuery.data.savings_recommendation}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      {t('riskAssessment')}
                    </p>
                    <p className="text-sm text-yellow-800">
                      {marketInsightsQuery.data.risk_assessment}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('marketConfidence')}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={marketInsightsQuery.data.market_confidence * 100} 
                        className="w-24" 
                      />
                      <span className="text-sm font-medium">
                        {Math.round(marketInsightsQuery.data.market_confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600">{t('failedToLoadMarketData')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('savingsProjectionCalculator')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('weeklyAmount')} (XOF)
                  </label>
                  <Input
                    type="number"
                    value={weeklyAmount}
                    onChange={(e) => setWeeklyAmount(Number(e.target.value))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('durationMonths')}
                  </label>
                  <Input
                    type="number"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    placeholder="6"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('currentBtcPrice')} (XOF)
                </label>
                <Input
                  type="number"
                  value={currentBtcPrice}
                  onChange={(e) => setCurrentBtcPrice(Number(e.target.value))}
                  placeholder="50000"
                />
              </div>
              
              <Button 
                onClick={handleProjectSavings}
                disabled={projectSavingsMutation.isPending || !userId}
                className="w-full"
              >
                {projectSavingsMutation.isPending ? t('calculating') : t('calculateProjection')}
              </Button>
            </CardContent>
          </Card>

          {projectSavingsMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {t('projectionResults')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{t('totalInvestment')}</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(projectSavingsMutation.data.total_investment_xof)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">{t('projectedValue')}</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(projectSavingsMutation.data.projected_value_xof)}
                    </p>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('projectedGain')}</p>
                  <p className={`text-2xl font-bold ${
                    projectSavingsMutation.data.projected_gain_xof >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(projectSavingsMutation.data.projected_gain_xof)}
                  </p>
                  <p className={`text-lg ${
                    projectSavingsMutation.data.projected_gain_percentage >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatPercentage(projectSavingsMutation.data.projected_gain_percentage)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('confidenceScore')}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={projectSavingsMutation.data.confidence_score * 100} 
                        className="w-24" 
                      />
                      <span className="text-sm font-medium">
                        {Math.round(projectSavingsMutation.data.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('volatilityRisk')}</span>
                    <Badge 
                      variant="outline" 
                      className={getRiskColor(projectSavingsMutation.data.btc_volatility_risk)}
                    >
                      {projectSavingsMutation.data.btc_volatility_risk}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    {t('aiRecommendations')}
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {projectSavingsMutation.data.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inflation" className="space-y-4">
          {inflationHistoryQuery.isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ) : inflationHistoryQuery.data ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('inflationHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{t('last30Days')}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatPercentage(
                        inflationHistoryQuery.data.data.reduce((sum, d) => sum + d.cfa_inflation_rate, 0) / 
                        inflationHistoryQuery.data.data.length * 100
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{t('averageInflation')}</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      {t('inflationImpact')}
                    </p>
                    <p className="text-sm text-yellow-800">
                      {t('inflationImpactDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600">{t('failedToLoadInflationData')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
