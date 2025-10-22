// frontend/src/components/ai/InflationDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin } from 'lucide-react';
import aiClient from '../../ai/mockAiClient.js';

interface DataPoint {
  date: string;
  btcCfa: number;
}

interface ForecastData {
  horizonDays: number;
  timeseries: DataPoint[];
  confidence: number;
}

export default function InflationDashboard() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await aiClient.forecastInflation({ horizonDays: 60 });
        if (mounted) setForecastData(data);
      } catch (error) {
        console.error('Inflation forecast error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Failed to load inflation forecast</p>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = forecastData.timeseries[0]?.btcCfa || 50000;
  const futurePrice = forecastData.timeseries[forecastData.timeseries.length - 1]?.btcCfa || 50000;
  const priceChange = ((futurePrice - currentPrice) / currentPrice) * 100;
  const isPositive = priceChange > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Bitcoin vs CFA Forecast
          <Badge variant="outline" className="ml-auto">
            AI Confidence: {Math.round(forecastData.confidence * 100)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Price</p>
            <p className="text-xl font-bold">{formatCurrency(currentPrice)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">60-Day Forecast</p>
            <p className="text-xl font-bold">{formatCurrency(futurePrice)}</p>
          </div>
        </div>

        {/* Price Change */}
        <div className={`p-4 rounded-lg ${isPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-600">projected change</span>
          </div>
        </div>

        {/* Simple Chart */}
        <div className="space-y-2">
          <h4 className="font-medium">Price Trend (60 days)</h4>
          <div className="h-32 bg-gray-50 rounded-lg p-4 flex items-end justify-between">
            {forecastData.timeseries.slice(0, 10).map((point, index) => {
              const height = (point.btcCfa / Math.max(...forecastData.timeseries.map(p => p.btcCfa))) * 100;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-blue-500 w-3 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${formatCurrency(point.btcCfa)}`}
                  />
                  {index % 3 === 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {formatDate(point.date)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Impact */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Savings Impact</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Weekly 5,000 XOF in Bitcoin:</strong> 
              {isPositive ? ' Potential gain' : ' Potential loss'} of {Math.abs(priceChange * 0.1).toFixed(1)}% over 60 days
            </p>
            <p>
              <strong>vs CFA Inflation:</strong> Bitcoin savings may provide better protection against inflation
            </p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>AI Insight:</strong> This forecast uses Prophet time series analysis 
            combined with CFA inflation data to predict Bitcoin price movements. 
            Confidence level: {Math.round(forecastData.confidence * 100)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
