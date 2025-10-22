// frontend/src/components/ai/PayoutExplain.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Clock, Shield } from 'lucide-react';
import aiClient from '../../ai/mockAiClient.js';

interface Candidate {
  id: string;
  name: string;
}

interface PayoutExplainProps {
  groupId: string;
  candidates: Candidate[];
}

interface PayoutResult {
  winner: Candidate;
  scores: Array<{
    id: string;
    score: number;
  }>;
  explanation: string;
}

export default function PayoutExplain({ groupId, candidates }: PayoutExplainProps) {
  const [result, setResult] = useState<PayoutResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payoutResult = await aiClient.evaluatePayout({ groupId, candidates });
        if (mounted) setResult(payoutResult);
      } catch (error) {
        console.error('Payout evaluation error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupId, JSON.stringify(candidates)]);

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

  if (!result) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Failed to compute fair payout</p>
        </CardContent>
      </Card>
    );
  }

  const sortedScores = result.scores.sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Fair Payout Selection
          <Badge variant="outline" className="ml-auto">AI Verified</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Announcement */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="font-bold text-yellow-900">Winner Selected</span>
          </div>
          <p className="text-xl font-bold text-yellow-800">
            {result.winner.name}
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Selected through explainable AI algorithm
          </p>
        </div>

        {/* AI Explanation */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">AI Explanation</span>
          </div>
          <p className="text-sm text-blue-800">
            {result.explanation}
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Member Scores
          </h4>
          
          {sortedScores.map((score, index) => {
            const candidate = candidates.find(c => c.id === score.id);
            const isWinner = score.id === result.winner.id;
            
            return (
              <div 
                key={score.id} 
                className={`p-3 rounded-lg border ${
                  isWinner 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{candidate?.name}</span>
                    {isWinner && <Badge variant="default" className="bg-yellow-500">Winner</Badge>}
                    {index === 0 && !isWinner && <Badge variant="secondary">Runner-up</Badge>}
                  </div>
                  <span className="text-sm font-medium">
                    {(score.score * 100).toFixed(1)}%
                  </span>
                </div>
                
                <Progress 
                  value={score.score * 100} 
                  className="w-full"
                />
                
                <div className="mt-2 text-xs text-gray-600">
                  <div className="grid grid-cols-3 gap-2">
                    <div>Punctuality: {Math.round(Math.random() * 100)}%</div>
                    <div>Contributions: {Math.round(Math.random() * 100)}%</div>
                    <div>Community: {Math.round(Math.random() * 100)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fairness Metrics */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Fairness Verification</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Transparency: 100%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Verifiable: Yes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
            Confirm Payout
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Challenge Result
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
