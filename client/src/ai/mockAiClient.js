// client/src/ai/mockAiClient.js
// Mock AI client for development and testing

export class MockAiClient {
  constructor() {
    this.isConnected = true;
    this.apiKey = 'mock-api-key';
  }

  async getCreditScore(userId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock credit score data
    return {
      score: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      factors: [
        { name: 'Payment History', impact: 'positive', value: 0.85 },
        { name: 'Group Participation', impact: 'positive', value: 0.92 },
        { name: 'Contribution Consistency', impact: 'positive', value: 0.78 },
        { name: 'Risk Assessment', impact: 'neutral', value: 0.65 }
      ],
      recommendations: [
        'Maintain consistent payment schedule',
        'Consider joining additional groups',
        'Increase contribution amounts gradually'
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  async getFraudAlerts(userId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      alerts: [
        {
          id: 'alert-1',
          type: 'suspicious_activity',
          severity: 'medium',
          message: 'Unusual payment pattern detected',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        }
      ],
      riskLevel: 'low'
    };
  }

  async getAgentRecommendations(userId) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      recommendations: [
        {
          id: 'rec-1',
          type: 'agent',
          name: 'Ousmane Diouf',
          location: 'Dakar Central',
          rating: 4.8,
          distance: '2.3 km',
          specialties: ['cash-in', 'cash-out', 'group-management']
        }
      ]
    };
  }

  async getInflationData() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      currentRate: 2.3,
      trend: 'stable',
      forecast: [
        { month: 'Jan', rate: 2.1 },
        { month: 'Feb', rate: 2.3 },
        { month: 'Mar', rate: 2.2 },
        { month: 'Apr', rate: 2.4 }
      ]
    };
  }

  async getMicrotaskRewards(userId) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return {
      availableTasks: [
        {
          id: 'task-1',
          title: 'Complete profile verification',
          reward: 100,
          estimatedTime: '5 minutes',
          completed: false
        },
        {
          id: 'task-2',
          title: 'Invite a friend to join',
          reward: 500,
          estimatedTime: '2 minutes',
          completed: true
        }
      ],
      totalEarned: 500,
      pendingRewards: 100
    };
  }

  async getPayoutExplanation(groupId, cycle) {
    await new Promise(resolve => setTimeout(resolve, 350));
    
    return {
      explanation: 'This payout was calculated based on the group\'s contribution schedule and member participation rates.',
      breakdown: [
        { item: 'Base contribution', amount: 10000 },
        { item: 'Participation bonus', amount: 500 },
        { item: 'Group fee', amount: -200 }
      ],
      total: 10300
    };
  }

  async getPredictiveData(userId) {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      predictions: {
        nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 0.15,
        recommendedContribution: 12000
      },
      trends: [
        { date: '2024-01-01', value: 0.8 },
        { date: '2024-01-08', value: 0.85 },
        { date: '2024-01-15', value: 0.82 }
      ]
    };
  }

  async getReminderSchedule(userId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      reminders: [
        {
          id: 'reminder-1',
          type: 'payment_due',
          message: 'Payment due for Market Central Tontine',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          active: true
        }
      ]
    };
  }

  async getRoutingOptimization(groupId) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      recommendations: [
        {
          type: 'payment_routing',
          suggestion: 'Use Lightning Network for faster settlements',
          estimatedSavings: 150,
          confidence: 0.85
        }
      ]
    };
  }

  async chat(message, context = {}) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple mock responses based on message content
    const responses = {
      'hello': 'Hello! How can I help you with your tontine today?',
      'payment': 'I can help you with payment questions. What would you like to know?',
      'group': 'I can assist with group management. What do you need help with?',
      'credit': 'Your credit score is looking good! Would you like to see your detailed report?',
      'default': 'I understand you\'re asking about tontines. Could you be more specific about what you need help with?'
    };
    
    const lowerMessage = message.toLowerCase();
    let response = responses.default;
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = responses.hello;
    } else if (lowerMessage.includes('payment')) {
      response = responses.payment;
    } else if (lowerMessage.includes('group')) {
      response = responses.group;
    } else if (lowerMessage.includes('credit')) {
      response = responses.credit;
    }
    
    return {
      message: response,
      timestamp: new Date().toISOString(),
      context: context
    };
  }
}

// Export singleton instance
export const mockAiClient = new MockAiClient();
export default mockAiClient;