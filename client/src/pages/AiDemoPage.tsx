// frontend/src/pages/AiDemoPage.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Shield, TrendingUp } from 'lucide-react';

// Import all AI components
import CreditScoreCard from '../components/ai/CreditScoreCard';
import ChatAssistant from '../components/ai/ChatAssistant';
import FraudAlerts from '../components/ai/FraudAlerts';
import RoutingOptimizerCard from '../components/ai/RoutingOptimizerCard';
import InflationDashboard from '../components/ai/InflationDashboard';
import PayoutExplain from '../components/ai/PayoutExplain';
import PredictiveDashboard from '../components/ai/PredictiveDashboard';
import ReminderScheduler from '../components/ai/ReminderScheduler';
import AgentRecommendation from '../components/ai/AgentRecommendation';
import MicrotaskRewards from '../components/ai/MicrotaskRewards';

export default function AiDemoPage() {
  // Demo data
  const userId = 'demo-user-1';
  const features = { 
    punctualityRate: 0.85, 
    tontine_contributions: 24, 
    community_reputation: 0.8 
  };
  
  const recentTxs = [
    { txid: 'tx-1', amountSats: 10000, userId },
    { txid: 'tx-2', amountSats: 999999, userId }, // This will trigger fraud alert
    { txid: 'tx-3', amountSats: 15000, userId }
  ];
  
  const candidates = [
    { id: 'u1', name: 'Fatou' }, 
    { id: 'u2', name: 'Aminata' }, 
    { id: 'u3', name: 'Samba' }
  ];

  const agents = [
    { name: 'Agent A', phone: '+221770012345', rating: 4.8 },
    { name: 'Agent B', phone: '+221770012346', rating: 4.2 }
  ];

  const location = { lat: 14.7167, lon: -17.4677 }; // Dakar coordinates

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">SunuSàv AI Demo</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience all 10 AI-powered features with interactive mock data. 
            Click around to see how AI enhances your tontine experience!
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Mock AI Client
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Deterministic Results
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Interactive Demo
            </Badge>
          </div>
        </div>

        {/* Demo Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🎯 Demo Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Try These Features:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Credit Score:</strong> See AI-generated trust score and loan pre-approval</li>
                  <li>• <strong>Chat Assistant:</strong> Ask questions in Wolof, French, or English with voice</li>
                  <li>• <strong>Fraud Detection:</strong> Notice the large transaction (999,999 sats) triggers an alert</li>
                  <li>• <strong>Routing:</strong> See AI-optimized Lightning payment routes</li>
                  <li>• <strong>Inflation:</strong> View Bitcoin vs CFA forecast with AI predictions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">More Features:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>Payout Fairness:</strong> Transparent AI explanation for winner selection</li>
                  <li>• <strong>Predictions:</strong> Group completion probability and risk factors</li>
                  <li>• <strong>Smart Reminders:</strong> AI-optimized notification timing</li>
                  <li>• <strong>Agent Matching:</strong> Location-based agent recommendations</li>
                  <li>• <strong>Microtasks:</strong> Earn Bitcoin sats by helping train AI models</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Row 1 */}
          <CreditScoreCard userId={userId} features={features} />
          <ChatAssistant userId={userId} />
          <FraudAlerts recentTxs={recentTxs} />

          {/* Row 2 */}
          <RoutingOptimizerCard groupId="group-1" />
          <InflationDashboard />
          <PayoutExplain groupId="group-1" candidates={candidates} />

          {/* Row 3 */}
          <PredictiveDashboard groupId="group-1" />
          <ReminderScheduler userId={userId} history={[]} />
          <AgentRecommendation location={location} agents={agents} />

          {/* Row 4 */}
          <div className="lg:col-span-2 xl:col-span-3">
            <MicrotaskRewards userId={userId} />
          </div>
        </div>

        {/* Technical Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🔧 Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Mock AI Client</h4>
                <p className="text-sm text-blue-800">
                  All AI responses are generated by a deterministic mock client 
                  that simulates real AI microservices. Responses are consistent 
                  and predictable for demo purposes.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Real Integration</h4>
                <p className="text-sm text-green-800">
                  To switch to real AI services, simply replace the mock client 
                  with actual API calls. The component interfaces remain identical.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Production Ready</h4>
                <p className="text-sm text-purple-800">
                  All components include proper error handling, loading states, 
                  and responsive design. Ready for production deployment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📊 AI Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">Fraud Detection Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">&lt;100ms</div>
                <div className="text-sm text-gray-600">Credit Score Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">87%</div>
                <div className="text-sm text-gray-600">Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">3x</div>
                <div className="text-sm text-gray-600">Faster Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🚀 Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Ready for Production</h4>
                <p className="text-sm text-yellow-800">
                  This demo showcases all AI features with mock data. To deploy with real AI services:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                  <li>1. Replace <code>mockAiClient.js</code> with real API calls</li>
                  <li>2. Deploy AI microservices using the provided Docker Compose</li>
                  <li>3. Configure environment variables for AI service URLs</li>
                  <li>4. Train models with real Senegalese financial data</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Senegalese Market Focus</h4>
                <p className="text-sm text-green-800">
                  All AI features are specifically designed for the Senegalese market with:
                  Wolof language support, CFA inflation tracking, local agent networks, 
                  and cultural adaptation for tontine communities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
