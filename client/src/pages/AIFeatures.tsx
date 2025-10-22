import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  MessageCircle, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Zap,
  Globe,
  Mic
} from 'lucide-react';
import ChatAssistant from '@/components/ChatAssistant';
import AIInsightsDashboard from '@/components/AIInsightsDashboard';
import CreditScore from '@/components/CreditScore';
import { useLanguage } from '@/hooks/useLanguage';

interface AIFeaturesPageProps {
  userId?: string;
}

export default function AIFeaturesPage({ userId = 'demo-user' }: AIFeaturesPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { t } = useLanguage();

  const aiFeatures = [
    {
      id: 'credit-scoring',
      title: t('aiCreditScoring'),
      description: t('aiCreditScoringDescription'),
      icon: <CreditCard className="h-6 w-6" />,
      status: 'active',
      benefits: [
        t('creditScoringBenefit1'),
        t('creditScoringBenefit2'),
        t('creditScoringBenefit3')
      ]
    },
    {
      id: 'fraud-detection',
      title: t('aiFraudDetection'),
      description: t('aiFraudDetectionDescription'),
      icon: <Shield className="h-6 w-6" />,
      status: 'active',
      benefits: [
        t('fraudDetectionBenefit1'),
        t('fraudDetectionBenefit2'),
        t('fraudDetectionBenefit3')
      ]
    },
    {
      id: 'chat-assistant',
      title: t('aiChatAssistant'),
      description: t('aiChatAssistantDescription'),
      icon: <MessageCircle className="h-6 w-6" />,
      status: 'active',
      benefits: [
        t('chatAssistantBenefit1'),
        t('chatAssistantBenefit2'),
        t('chatAssistantBenefit3')
      ]
    },
    {
      id: 'insights',
      title: t('aiInsights'),
      description: t('aiInsightsDescription'),
      icon: <TrendingUp className="h-6 w-6" />,
      status: 'active',
      benefits: [
        t('insightsBenefit1'),
        t('insightsBenefit2'),
        t('insightsBenefit3')
      ]
    },
    {
      id: 'routing',
      title: t('aiRoutingOptimization'),
      description: t('aiRoutingOptimizationDescription'),
      icon: <Zap className="h-6 w-6" />,
      status: 'coming-soon',
      benefits: [
        t('routingBenefit1'),
        t('routingBenefit2'),
        t('routingBenefit3')
      ]
    },
    {
      id: 'notifications',
      title: t('aiSmartNotifications'),
      description: t('aiSmartNotificationsDescription'),
      icon: <Mic className="h-6 w-6" />,
      status: 'coming-soon',
      benefits: [
        t('notificationsBenefit1'),
        t('notificationsBenefit2'),
        t('notificationsBenefit3')
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('active')}</Badge>;
      case 'coming-soon':
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{t('comingSoon')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">{t('aiPoweredFeatures')}</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('aiFeaturesDescription')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {t('supportingLanguages')}: Wolof, Français, English
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="credit">{t('creditScore')}</TabsTrigger>
            <TabsTrigger value="insights">{t('insights')}</TabsTrigger>
            <TabsTrigger value="chat">{t('chatAssistant')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiFeatures.map((feature) => (
                <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {feature.icon}
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{t('benefits')}:</h4>
                      <ul className="space-y-1">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Impact Statistics */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('aiImpactMetrics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">95%</div>
                    <div className="text-sm text-gray-600">{t('fraudReduction')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">87%</div>
                    <div className="text-sm text-gray-600">{t('accuracyRate')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">3x</div>
                    <div className="text-sm text-gray-600">{t('fasterProcessing')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">24/7</div>
                    <div className="text-sm text-gray-600">{t('availability')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Architecture */}
            <Card>
              <CardHeader>
                <CardTitle>{t('technicalArchitecture')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">{t('microservices')}</h4>
                      <p className="text-sm text-blue-800">
                        {t('microservicesDescription')}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">{t('machineLearning')}</h4>
                      <p className="text-sm text-green-800">
                        {t('machineLearningDescription')}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">{t('realTimeProcessing')}</h4>
                      <p className="text-sm text-purple-800">
                        {t('realTimeProcessingDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit">
            {userId ? (
              <CreditScore userId={userId} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">{t('loginRequiredForCreditScore')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights">
            <AIInsightsDashboard userId={userId} />
          </TabsContent>

          <TabsContent value="chat">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {t('aiChatAssistant')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {t('chatAssistantDescription')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">{t('multilingual')}</span>
                        </div>
                        <p className="text-sm text-blue-800">
                          {t('multilingualDescription')}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Mic className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">{t('voiceSupport')}</span>
                        </div>
                        <p className="text-sm text-green-800">
                          {t('voiceSupportDescription')}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-purple-900">{t('contextual')}</span>
                        </div>
                        <p className="text-sm text-purple-800">
                          {t('contextualDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Chat Assistant Component */}
              <div className="relative">
                <ChatAssistant userId={userId} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
