// client/src/ai/mockAiClient.d.ts
declare module '../../ai/mockAiClient.js' {
  export interface CreditScoreResult {
    score: number;
    recommendedLoanXOF: number;
    explanation: Array<{
      feature: string;
      impact: number;
    }>;
  }

  export interface ChatResult {
    text: string;
    timestamp: string;
  }

  export interface FraudResult {
    alert: boolean;
    score: number;
    reason: string;
  }

  export interface RoutingResult {
    groupId: string;
    recommendedNode: string;
    expectedFeeSats: number;
    confidence: number;
  }

  export interface InflationForecast {
    horizonDays: number;
    timeseries: Array<{
      date: string;
      btcCfa: number;
    }>;
    confidence: number;
  }

  export interface PayoutResult {
    winner: {
      id: string;
      name: string;
    };
    scores: Array<{
      id: string;
      score: number;
    }>;
    explanation: string;
  }

  export interface PredictionResult {
    groupId: string;
    completion_prob: number;
    eta_days: number;
  }

  export interface ReminderResult {
    userId: string;
    nextReminderAt: string;
    reason: string;
  }

  export interface AgentRecommendationResult {
    agent: {
      name: string;
      phone: string;
      rating?: number;
    };
    eta_minutes: number;
  }

  export interface RewardResult {
    userId: string;
    taskId: string;
    sats: number;
    txProof: string;
  }

  export const aiClient: {
    predictCreditScore: (payload: { userId: string; features: any }) => Promise<CreditScoreResult>;
    chat: (payload: { userId: string; message: string; language: string }) => Promise<ChatResult>;
    detectFraud: (payload: { batch: any[] }) => Promise<FraudResult[]>;
    suggestRouting: (payload: { groupId: string }) => Promise<RoutingResult>;
    forecastInflation: (payload: { horizonDays: number }) => Promise<InflationForecast>;
    evaluatePayout: (payload: { groupId: string; candidates: any[] }) => Promise<PayoutResult>;
    predictGroupCompletion: (payload: { groupId: string }) => Promise<PredictionResult>;
    nextRemindTime: (payload: { userId: string; history: any[] }) => Promise<ReminderResult>;
    recommendAgent: (payload: { location: { lat: number; lon: number }; agents: any[] }) => Promise<AgentRecommendationResult>;
    rewardMicrotask: (payload: { userId: string; taskId: string }) => Promise<RewardResult>;
  };

  export default aiClient;
}
