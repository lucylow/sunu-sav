// client/src/components/SenegalSubscriptionManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, Zap, Shield, Smartphone, Globe, 
  CheckCircle, Clock, AlertCircle, TrendingUp
} from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface SubscriptionTier {
  id: string;
  name: string;
  priceXof: number;
  priceSats: number;
  features: string[];
  feeDiscount: number;
  description: string;
  popular?: boolean;
}

interface SubscriptionManagerProps {
  userId: string;
  currentSubscription?: any;
  onSubscriptionChange?: (subscription: any) => void;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'standard',
    name: 'Standard',
    priceXof: 0,
    priceSats: 0,
    features: [
      'Basic tontine management',
      'Standard support',
      '1% transaction fee'
    ],
    feeDiscount: 0,
    description: 'Perfect for getting started'
  },
  {
    id: 'pro',
    name: 'Pro',
    priceXof: 500,
    priceSats: 2500,
    features: [
      'Advanced analytics',
      'Priority support',
      '25% fee discount',
      'Wave cash-out priority',
      'USSD access'
    ],
    feeDiscount: 0.25,
    description: 'Best for active users',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceXof: 2000,
    priceSats: 10000,
    features: [
      'All Pro features',
      'Dedicated support',
      '50% fee discount',
      'Custom integrations',
      'Advanced reporting',
      'White-label options'
    ],
    feeDiscount: 0.50,
    description: 'For organizations and groups'
  }
];

export const SenegalSubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userId,
  currentSubscription,
  onSubscriptionChange
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(currentSubscription);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleCreateSubscription = async (tier: SubscriptionTier) => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          tier: tier.id,
          payment_method: 'lightning'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      
      const result = await response.json();
      setSubscription(result);
      onSubscriptionChange?.(result);
      
      toast.success(`Subscription ${tier.name} created successfully!`);
      
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/monetization/subscriptions/${subscription.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      setSubscription(null);
      onSubscriptionChange?.(null);
      
      toast.success('Subscription cancelled successfully');
      
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'pro':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'enterprise':
        return <Shield className="h-5 w-5 text-purple-500" />;
      default:
        return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'pro':
        return 'border-yellow-200 bg-yellow-50';
      case 'enterprise':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {subscription && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Active Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">
                  {SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier)?.name} Plan
                </h3>
                <p className="text-sm text-green-700">
                  {subscription.recurring_xof} XOF/month
                </p>
                <p className="text-xs text-green-600">
                  Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-green-100 text-green-800">
                  {Math.round(subscription.tier === 'pro' ? 25 : subscription.tier === 'enterprise' ? 50 : 0)}% Fee Discount
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="mt-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Tiers */}
      <div className="grid md:grid-cols-3 gap-4">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative ${getTierColor(tier.id)} ${
              tier.popular ? 'ring-2 ring-yellow-300' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getTierIcon(tier.id)}
              </div>
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {tier.priceXof === 0 ? 'Free' : `${tier.priceXof} XOF`}
                </div>
                <div className="text-sm text-gray-600">
                  {tier.priceSats > 0 && `~${tier.priceSats} sats`}
                </div>
                <div className="text-xs text-gray-500">
                  {tier.description}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Fee Discount Visualization */}
              {tier.feeDiscount > 0 && (
                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Fee Discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${tier.feeDiscount * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {Math.round(tier.feeDiscount * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Senegal-specific features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Smartphone className="h-4 w-4" />
                  <span>Wave Mobile Money</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Globe className="h-4 w-4" />
                  <span>USSD Access</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Shield className="h-4 w-4" />
                  <span>Senegal Holidays Aware</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
                onClick={() => handleCreateSubscription(tier)}
                disabled={loading || subscription?.tier === tier.id}
              >
                {subscription?.tier === tier.id ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Current Plan
                  </>
                ) : (
                  <>
                    {tier.priceXof === 0 ? 'Get Started' : 'Subscribe'}
                    {loading && <Clock className="h-4 w-4 ml-2 animate-spin" />}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits Summary */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="text-orange-900">Why Subscribe?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-800">Senegal-Specific Benefits</h4>
              <ul className="space-y-2 text-sm text-orange-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Instant Wave mobile money cash-outs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  USSD access for feature phones
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Senegal holiday-aware scheduling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  French & Wolof language support
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-800">Financial Benefits</h4>
              <ul className="space-y-2 text-sm text-orange-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Reduced transaction fees
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Priority payout processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Advanced analytics & reporting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Community fund transparency
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
