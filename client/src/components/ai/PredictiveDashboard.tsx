// frontend/src/components/ai/PredictiveDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Calendar, Users, AlertTriangle } from 'lucide-react';
import aiClient from '../../ai/mockAiClient';

interface PredictiveDashboardProps {
  groupId: string;
}

interface PredictionResult {
  groupId: string;
  completion_prob: number;
  eta_days: number;
}

export default function PredictiveDashboard({ groupId }: PredictiveDashboardProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pred = await aiClient.predictGroupCompletion({ groupId });
        if (mounted) setPrediction(pred);
      } catch (error) {
        console.error('Prediction error:', error);
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

  if (!prediction) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Failed to load predictions</p>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = Math.round(prediction.completion_prob * 100);
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (percentage >= 60) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Predictive Analytics
          {getCompletionBadge(completionPercentage)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Probability */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">On-Time Completion</span>
          </div>
          <div className={`text-3xl font-bold ${getCompletionColor(completionPercentage)}`}>
            {completionPercentage}%
          </div>
          <Progress value={completionPercentage} className="w-full mt-2" />
        </div>

        {/* ETA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">ETA</span>
            </div>
            <p className="text-lg font-bold text-blue-800">
              {prediction.eta_days} days
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Confidence</span>
            </div>
            <p className="text-lg font-bold text-green-800">
              {Math.round(prediction.completion_prob * 100)}%
            </p>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2">
          <h4 className="font-medium">Risk Factors</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
              <span className="text-sm">Late Payments</span>
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                Medium Risk
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm">Member Engagement</span>
              <Badge variant="outline" className="border-green-500 text-green-600">
                Low Risk
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="text-sm">Network Connectivity</span>
              <Badge variant="outline" className="border-red-500 text-red-600">
                High Risk
              </Badge>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">AI Recommendations</h4>
          <div className="space-y-2 text-sm text-blue-800">
            {completionPercentage >= 80 ? (
              <p>✅ Group is on track for successful completion. Continue current practices.</p>
            ) : completionPercentage >= 60 ? (
              <>
                <p>⚠️ Monitor payment patterns closely. Consider sending reminders.</p>
                <p>💡 Suggest offline payment options for members with poor connectivity.</p>
              </>
            ) : (
              <>
                <p>🚨 High risk of delays. Immediate action required.</p>
                <p>📞 Contact members with missed payments personally.</p>
                <p>🔄 Consider extending the cycle timeline.</p>
              </>
            )}
          </div>
        </div>

        {/* Historical Comparison */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Historical Comparison</h4>
          <div className="grid grid-cols-3 gap-2 text-sm text-gray-700">
            <div className="text-center">
              <div className="font-bold">Similar Groups</div>
              <div>87% completion rate</div>
            </div>
            <div className="text-center">
              <div className="font-bold">This Group</div>
              <div>{completionPercentage}% predicted</div>
            </div>
            <div className="text-center">
              <div className="font-bold">Market Average</div>
              <div>73% completion rate</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
            View Detailed Report
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Set Alerts
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
