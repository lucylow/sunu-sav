// frontend/src/components/ai/RoutingOptimizerCard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Network, Clock, DollarSign } from 'lucide-react';
import aiClient from '../../ai/mockAiClient.js';

interface RoutingOptimizerCardProps {
  groupId: string;
}

interface RoutingRecommendation {
  groupId: string;
  recommendedNode: string;
  expectedFeeSats: number;
  confidence: number;
}

export default function RoutingOptimizerCard({ groupId }: RoutingOptimizerCardProps) {
  const [recommendation, setRecommendation] = useState<RoutingRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rec = await aiClient.suggestRouting({ groupId });
        if (mounted) setRecommendation(rec);
      } catch (error) {
        console.error('Routing optimization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Failed to load routing recommendation</p>
        </CardContent>
      </Card>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (confidence >= 0.6) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Lightning Routing AI
          {getConfidenceBadge(recommendation.confidence)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended Node */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Recommended Node</span>
          </div>
          <p className="font-mono text-sm text-blue-800 break-all">
            {recommendation.recommendedNode}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Optimized for lowest fees and highest success rate
          </p>
        </div>

        {/* Fee Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Expected Fee</span>
            </div>
            <p className="text-lg font-bold">{recommendation.expectedFeeSats} sats</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Est. Time</span>
            </div>
            <p className="text-lg font-bold">~2s</p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">AI Confidence</span>
            <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
              {Math.round(recommendation.confidence * 100)}%
            </span>
          </div>
          <Progress value={recommendation.confidence * 100} className="w-full" />
        </div>

        {/* Alternative Routes */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Alternative Routes</h4>
          <div className="space-y-1 text-sm text-yellow-800">
            <p>• Backup route via 02cd34...node (3 sats fee)</p>
            <p>• Emergency route via 04ef56...node (8 sats fee)</p>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>AI Analysis:</strong> This route was selected based on channel liquidity, 
            historical success rates, and current network congestion. The AI model analyzes 
            real-time Lightning Network data to optimize your payment path.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
            Use Recommended Route
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            View Alternatives
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
