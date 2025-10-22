// Mock AI client for development and testing
export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CreditScoreData {
  score: number;
  recommendations: string[];
}

export interface FraudAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: string;
}

export interface InflationData {
  currentRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: string;
}

export interface MicrotaskReward {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
}

export interface PayoutExplanation {
  cycle: number;
  winner: string;
  amount: number;
  explanation: string;
}

export interface PredictiveInsight {
  type: string;
  confidence: number;
  prediction: string;
  timeframe: string;
}

export interface RoutingOptimization {
  route: string[];
  savings: number;
  timeReduction: number;
}

export interface ReminderSchedule {
  id: string;
  type: string;
  time: string;
  message: string;
  active: boolean;
}

export class MockAiClient {
  async getCreditScore(userId: string): Promise<AIResponse> {
    return {
      success: true,
      data: {
        score: Math.floor(Math.random() * 300) + 300,
        recommendations: ['Make payments on time', 'Reduce credit utilization']
      }
    };
  }

  async getFraudAlerts(userId: string): Promise<AIResponse> {
    return {
      success: true,
      data: [
        {
          id: '1',
          type: 'Suspicious transaction',
          severity: 'medium',
          description: 'Unusual payment pattern detected',
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  async getInflationData(): Promise<AIResponse> {
    return {
      success: true,
      data: {
        currentRate: 2.5,
        trend: 'increasing',
        impact: 'Moderate impact on purchasing power'
      }
    };
  }

  async getMicrotaskRewards(userId: string): Promise<AIResponse> {
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Complete profile',
          description: 'Add your business information',
          reward: 100,
          completed: false
        }
      ]
    };
  }

  async getPayoutExplanation(groupId: string, cycle: number): Promise<AIResponse> {
    return {
      success: true,
      data: {
        cycle,
        winner: 'User123',
        amount: 50000,
        explanation: 'Winner selected based on fair random selection'
      }
    };
  }

  async getPredictiveInsights(userId: string): Promise<AIResponse> {
    return {
      success: true,
      data: [
        {
          type: 'Payment prediction',
          confidence: 0.85,
          prediction: 'Likely to make payment on time',
          timeframe: 'Next 7 days'
        }
      ]
    };
  }

  async getRoutingOptimization(groupId: string): Promise<AIResponse> {
    return {
      success: true,
      data: {
        route: ['User1', 'User2', 'User3'],
        savings: 1500,
        timeReduction: 30
      }
    };
  }

  async getReminderSchedule(userId: string): Promise<AIResponse> {
    return {
      success: true,
      data: [
        {
          id: '1',
          type: 'Payment reminder',
          time: '09:00',
          message: 'Don\'t forget your tontine contribution',
          active: true
        }
      ]
    };
  }

  async generateRecommendations(userId: string, context: string): Promise<AIResponse> {
    return {
      success: true,
      data: {
        recommendations: [
          'Consider joining a smaller group for faster payouts',
          'Set up automatic payments to avoid late fees',
          'Diversify your tontine participation'
        ]
      }
    };
  }

  async recommendAgent(userId: string, context: string): Promise<AIResponse> {
    return {
      success: true,
      data: {
        agent: 'Financial Advisor',
        reason: 'Based on your payment patterns and group participation',
        confidence: 0.85
      }
    };
  }

  // Additional methods that components are calling
  async predictCreditScore(userId: string): Promise<AIResponse> {
    return this.getCreditScore(userId);
  }

  async detectFraud(userId: string): Promise<AIResponse> {
    return this.getFraudAlerts(userId);
  }

  async forecastInflation(): Promise<AIResponse> {
    return this.getInflationData();
  }

  async rewardMicrotask(userId: string): Promise<AIResponse> {
    return this.getMicrotaskRewards(userId);
  }

  async evaluatePayout(groupId: string, cycle: number): Promise<AIResponse> {
    return this.getPayoutExplanation(groupId, cycle);
  }

  async predictGroupCompletion(userId: string): Promise<AIResponse> {
    return this.getPredictiveInsights(userId);
  }

  async nextRemindTime(userId: string): Promise<AIResponse> {
    return this.getReminderSchedule(userId);
  }

  async suggestRouting(groupId: string): Promise<AIResponse> {
    return this.getRoutingOptimization(groupId);
  }

  async chat(message: string, context?: any): Promise<AIResponse> {
    return {
      success: true,
      data: {
        response: `AI response to: ${message}`,
        suggestions: ['How to contribute?', 'Check my balance', 'View groups']
      }
    };
  }
}

const mockAiClient = new MockAiClient();
export default mockAiClient;