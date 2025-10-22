// frontend/src/components/ai/AgentRecommendation.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Phone, Star, Navigation } from 'lucide-react';
import aiClient from '../../ai/mockAiClient';

interface Location {
  lat: number;
  lon: number;
}

interface Agent {
  name: string;
  phone: string;
  location?: Location;
  rating?: number;
}

interface AgentRecommendationProps {
  location: Location;
  agents: Agent[];
}

interface RecommendationResult {
  agent: Agent;
  eta_minutes: number;
}

export default function AgentRecommendation({ location, agents }: AgentRecommendationProps) {
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rec = await aiClient.recommendAgent({ location, agents });
        if (mounted) setRecommendation(rec);
      } catch (error) {
        console.error('Agent recommendation error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [location, JSON.stringify(agents)]);

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
          <p className="text-gray-600">No agents available in your area</p>
        </CardContent>
      </Card>
    );
  }

  const { agent, eta_minutes } = recommendation;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Recommended Agent
          <Badge variant="default" className="bg-green-500">AI Selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Info */}
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">Best Match</span>
          </div>
          <p className="text-xl font-bold text-green-800">
            {agent.name}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-sm text-green-700">
              {agent.rating || 4.8} rating
            </span>
          </div>
        </div>

        {/* ETA and Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">ETA</span>
            </div>
            <p className="text-lg font-bold text-blue-800">
              {eta_minutes} min
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Contact</span>
            </div>
            <p className="text-sm font-mono text-gray-800">
              {agent.phone}
            </p>
          </div>
        </div>

        {/* Location Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Location</span>
          </div>
          <p className="text-sm text-blue-800">
            Near Marché Sandaga, Dakar
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Coordinates: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          </p>
        </div>

        {/* AI Reasoning */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Why This Agent?</h4>
          <div className="space-y-1 text-sm text-yellow-800">
            <p>• Closest to your location</p>
            <p>• High success rate with tontine payments</p>
            <p>• Available now (no queue)</p>
            <p>• Speaks Wolof and French</p>
          </div>
        </div>

        {/* Alternative Agents */}
        <div className="space-y-2">
          <h4 className="font-medium">Other Available Agents</h4>
          <div className="space-y-2">
            {agents.filter(a => a.name !== agent.name).slice(0, 2).map((altAgent, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-sm font-medium">{altAgent.name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">{altAgent.rating || 4.2}</span>
                  </div>
                </div>
                <Badge variant="outline">
                  {Math.round(Math.random() * 20) + eta_minutes} min
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Services Available */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Services Available</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div>✅ Cash-in/Cash-out</div>
            <div>✅ Lightning payments</div>
            <div>✅ Tontine contributions</div>
            <div>✅ Mobile money</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
            Contact Agent
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Get Directions
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
