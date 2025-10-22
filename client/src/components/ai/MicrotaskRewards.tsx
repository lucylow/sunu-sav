// frontend/src/components/ai/MicrotaskRewards.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bitcoin, CheckCircle, Clock, Star, Zap } from 'lucide-react';
import aiClient from '../../ai/mockAiClient';

interface MicrotaskRewardsProps {
  userId: string;
}

interface RewardResult {
  userId: string;
  taskId: string;
  sats: number;
  txProof: string;
}

export default function MicrotaskRewards({ userId }: MicrotaskRewardsProps) {
  const [reward, setReward] = useState<RewardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const availableTasks = [
    {
      id: 'label_001',
      title: 'Label 5 Market Photos',
      description: 'Help train our AI by labeling market scenes',
      reward: '5-15 sats',
      difficulty: 'Easy',
      timeEstimate: '2 min'
    },
    {
      id: 'verify_002',
      title: 'Verify Payment Data',
      description: 'Verify 3 Lightning payment transactions',
      reward: '10-25 sats',
      difficulty: 'Medium',
      timeEstimate: '3 min'
    },
    {
      id: 'translate_003',
      title: 'Translate Wolof Phrases',
      description: 'Translate 10 financial terms to Wolof',
      reward: '15-30 sats',
      difficulty: 'Hard',
      timeEstimate: '5 min'
    }
  ];

  const doTask = async (taskId: string) => {
    setLoading(true);
    try {
      const res = await aiClient.rewardMicrotask({ userId, taskId });
      setReward(res);
      setCompletedTasks(prev => [...prev, taskId]);
    } catch (error) {
      console.error('Microtask error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return <Badge variant="default" className="bg-green-500">Easy</Badge>;
      case 'Medium': return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
      case 'Hard': return <Badge variant="destructive">Hard</Badge>;
      default: return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Microtask Rewards
          <Badge variant="outline" className="ml-auto">Earn Bitcoin</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recent Reward */}
        {reward && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">Reward Earned!</span>
            </div>
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-bold text-green-800">
                {reward.sats} sats
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Transaction proof: {reward.txProof}
            </p>
          </div>
        )}

        {/* Available Tasks */}
        <div className="space-y-3">
          <h4 className="font-medium">Available Tasks</h4>
          {availableTasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id);
            
            return (
              <div 
                key={task.id} 
                className={`p-3 rounded-lg border ${
                  isCompleted 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{task.title}</h5>
                  {getDifficultyBadge(task.difficulty)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {task.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Bitcoin className="h-3 w-3" />
                      <span>{task.reward}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.timeEstimate}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => doTask(task.id)}
                    disabled={loading || isCompleted}
                    size="sm"
                    className={isCompleted ? 'bg-gray-400' : ''}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </>
                    ) : loading ? (
                      'Processing...'
                    ) : (
                      'Start Task'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Earnings Summary */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Your Earnings</h4>
          <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="text-center">
              <div className="font-bold">Today</div>
              <div>{reward?.sats || 0} sats</div>
            </div>
            <div className="text-center">
              <div className="font-bold">This Week</div>
              <div>{Math.round((reward?.sats || 0) * 1.5)} sats</div>
            </div>
            <div className="text-center">
              <div className="font-bold">Total</div>
              <div>{Math.round((reward?.sats || 0) * 3.2)} sats</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">How It Works</h4>
          <div className="space-y-1 text-sm text-yellow-800">
            <p>1. Complete simple tasks to help improve our AI</p>
            <p>2. Earn Bitcoin sats instantly via Lightning</p>
            <p>3. Tasks help train models for better financial services</p>
            <p>4. All payments are verified on-chain</p>
          </div>
        </div>

        {/* Community Impact */}
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-900">Community Impact</span>
          </div>
          <p className="text-sm text-purple-800">
            Your microtasks help improve AI models that benefit thousands of 
            tontine members across Senegal. Every task contributes to better 
            financial inclusion and fraud detection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
