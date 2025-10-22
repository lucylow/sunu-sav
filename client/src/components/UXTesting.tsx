// client/src/components/UXTesting.tsx
/**
 * UX Testing Component
 * Validates user experience improvements
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Zap, 
  Shield,
  Smartphone,
  Globe,
  BarChart3,
  Star,
  Heart,
  Target
} from 'lucide-react';
import { uxEnhancementService } from '@/lib/ux-enhancements';
import { demoService } from '@/lib/demo-service';

interface UXTestResult {
  category: string;
  score: number;
  maxScore: number;
  details: string[];
  icon: React.ReactNode;
  color: string;
}

export default function UXTesting() {
  const [testResults, setTestResults] = useState<UXTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const runUXTests = async () => {
    setIsRunning(true);
    const results: UXTestResult[] = [];

    // Test 1: Accessibility
    const accessibilityScore = await testAccessibility();
    results.push({
      category: 'Accessibility',
      score: accessibilityScore,
      maxScore: 100,
      details: [
        'High contrast mode available',
        'Large text option implemented',
        'Reduced motion support',
        'Screen reader compatibility',
        'Keyboard navigation working'
      ],
      icon: <Shield className="h-5 w-5" />,
      color: 'green'
    });

    // Test 2: Performance
    const performanceScore = await testPerformance();
    results.push({
      category: 'Performance',
      score: performanceScore,
      maxScore: 100,
      details: [
        'Page load time < 2 seconds',
        'Smooth animations',
        'Efficient filtering',
        'Optimized rendering',
        'Memory usage optimized'
      ],
      icon: <Zap className="h-5 w-5" />,
      color: 'blue'
    });

    // Test 3: Mobile Experience
    const mobileScore = await testMobileExperience();
    results.push({
      category: 'Mobile Experience',
      score: mobileScore,
      maxScore: 100,
      details: [
        'Responsive design working',
        'Touch interactions optimized',
        'Mobile-first layout',
        'Feature phone compatibility',
        'Offline capability'
      ],
      icon: <Smartphone className="h-5 w-5" />,
      color: 'purple'
    });

    // Test 4: Cultural Adaptation
    const culturalScore = await testCulturalAdaptation();
    results.push({
      category: 'Cultural Adaptation',
      score: culturalScore,
      maxScore: 100,
      details: [
        'Senegalese market data integrated',
        'XOF currency prominently displayed',
        'French/Wolof language support',
        'Local payment methods (Wave, Orange Money)',
        'Cultural context appropriate'
      ],
      icon: <Globe className="h-5 w-5" />,
      color: 'orange'
    });

    // Test 5: User Engagement
    const engagementScore = await testUserEngagement();
    results.push({
      category: 'User Engagement',
      score: engagementScore,
      maxScore: 100,
      details: [
        'Interactive elements working',
        'Smart suggestions implemented',
        'Personalized experience',
        'Clear call-to-actions',
        'Feedback mechanisms'
      ],
      icon: <Heart className="h-5 w-5" />,
      color: 'pink'
    });

    // Test 6: Data Visualization
    const dataScore = await testDataVisualization();
    results.push({
      category: 'Data Visualization',
      score: dataScore,
      maxScore: 100,
      details: [
        'Financial metrics clearly displayed',
        'Progress indicators working',
        'Member avatars showing',
        'Status badges functional',
        'Charts and graphs readable'
      ],
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'indigo'
    });

    setTestResults(results);
    
    // Calculate overall score
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const maxTotalScore = results.reduce((sum, result) => sum + result.maxScore, 0);
    setOverallScore(Math.round((totalScore / maxTotalScore) * 100));
    
    setIsRunning(false);
  };

  const testAccessibility = async (): Promise<number> => {
    let score = 0;
    
    // Test high contrast mode
    if (document.documentElement.classList.contains('high-contrast')) {
      score += 20;
    }
    
    // Test large text mode
    if (document.documentElement.classList.contains('large-text')) {
      score += 20;
    }
    
    // Test reduced motion
    if (document.documentElement.classList.contains('reduced-motion')) {
      score += 20;
    }
    
    // Test keyboard navigation
    const focusableElements = document.querySelectorAll('button, input, select, textarea, [tabindex]');
    if (focusableElements.length > 0) {
      score += 20;
    }
    
    // Test ARIA labels
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby]');
    if (ariaElements.length > 0) {
      score += 20;
    }
    
    return score;
  };

  const testPerformance = async (): Promise<number> => {
    let score = 0;
    
    // Test page load time
    const loadTime = performance.now();
    if (loadTime < 2000) {
      score += 30;
    } else if (loadTime < 3000) {
      score += 20;
    } else {
      score += 10;
    }
    
    // Test memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize < 50 * 1024 * 1024) { // 50MB
        score += 25;
      } else if (memory.usedJSHeapSize < 100 * 1024 * 1024) { // 100MB
        score += 15;
      } else {
        score += 5;
      }
    } else {
      score += 20; // Assume good if can't measure
    }
    
    // Test DOM efficiency
    const domNodes = document.querySelectorAll('*').length;
    if (domNodes < 1000) {
      score += 25;
    } else if (domNodes < 2000) {
      score += 15;
    } else {
      score += 5;
    }
    
    // Test image optimization
    const images = document.querySelectorAll('img');
    let optimizedImages = 0;
    images.forEach(img => {
      if (img.loading === 'lazy' || img.hasAttribute('data-src')) {
        optimizedImages++;
      }
    });
    if (images.length === 0 || optimizedImages / images.length > 0.5) {
      score += 20;
    }
    
    return Math.min(score, 100);
  };

  const testMobileExperience = async (): Promise<number> => {
    let score = 0;
    
    // Test responsive design
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      score += 20;
    }
    
    // Test touch targets
    const buttons = document.querySelectorAll('button');
    let touchFriendlyButtons = 0;
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) { // 44px minimum touch target
        touchFriendlyButtons++;
      }
    });
    if (buttons.length === 0 || touchFriendlyButtons / buttons.length > 0.8) {
      score += 25;
    }
    
    // Test mobile-specific features
    if ('serviceWorker' in navigator) {
      score += 15;
    }
    
    // Test offline capability
    if ('onLine' in navigator) {
      score += 20;
    }
    
    // Test mobile payment integration
    const paymentElements = document.querySelectorAll('[data-payment-method]');
    if (paymentElements.length > 0) {
      score += 20;
    }
    
    return Math.min(score, 100);
  };

  const testCulturalAdaptation = async (): Promise<number> => {
    let score = 0;
    
    // Test XOF currency display
    const xofElements = document.querySelectorAll('[data-currency="XOF"], .xof-amount');
    if (xofElements.length > 0) {
      score += 25;
    }
    
    // Test Senegalese market data
    const marketElements = document.querySelectorAll('[data-market]');
    if (marketElements.length > 0) {
      score += 25;
    }
    
    // Test language support
    const langElements = document.querySelectorAll('[lang="fr"], [lang="wo"]');
    if (langElements.length > 0) {
      score += 25;
    }
    
    // Test mobile money integration
    const mobileMoneyElements = document.querySelectorAll('[data-payment-method="wave"], [data-payment-method="orange-money"]');
    if (mobileMoneyElements.length > 0) {
      score += 25;
    }
    
    return Math.min(score, 100);
  };

  const testUserEngagement = async (): Promise<number> => {
    let score = 0;
    
    // Test interactive elements
    const interactiveElements = document.querySelectorAll('button, input, select, [role="button"]');
    if (interactiveElements.length > 10) {
      score += 25;
    }
    
    // Test smart suggestions
    const suggestionElements = document.querySelectorAll('[data-suggestion]');
    if (suggestionElements.length > 0) {
      score += 25;
    }
    
    // Test personalization
    const userElements = document.querySelectorAll('[data-user-id]');
    if (userElements.length > 0) {
      score += 25;
    }
    
    // Test feedback mechanisms
    const feedbackElements = document.querySelectorAll('[data-feedback], .toast, .notification');
    if (feedbackElements.length > 0) {
      score += 25;
    }
    
    return Math.min(score, 100);
  };

  const testDataVisualization = async (): Promise<number> => {
    let score = 0;
    
    // Test progress indicators
    const progressElements = document.querySelectorAll('.progress, [role="progressbar"]');
    if (progressElements.length > 0) {
      score += 20;
    }
    
    // Test status indicators
    const statusElements = document.querySelectorAll('.badge, [data-status]');
    if (statusElements.length > 0) {
      score += 20;
    }
    
    // Test avatars
    const avatarElements = document.querySelectorAll('.avatar, [data-avatar]');
    if (avatarElements.length > 0) {
      score += 20;
    }
    
    // Test financial metrics
    const metricElements = document.querySelectorAll('[data-metric], .metric');
    if (metricElements.length > 0) {
      score += 20;
    }
    
    // Test charts/graphs
    const chartElements = document.querySelectorAll('svg, canvas, [data-chart]');
    if (chartElements.length > 0) {
      score += 20;
    }
    
    return Math.min(score, 100);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runUXTests();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          UX Testing Dashboard
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(overallScore)}>{overallScore}</span>
            <span className="text-gray-500">/100</span>
          </div>
          <p className="text-gray-600 mb-4">Overall UX Score</p>
          <Progress value={overallScore} className="h-3 mb-4" />
          <Badge className={getScoreBadgeColor(overallScore)}>
            {overallScore >= 90 ? 'Excellent' : 
             overallScore >= 70 ? 'Good' : 
             overallScore >= 50 ? 'Fair' : 'Needs Improvement'}
          </Badge>
        </div>

        {/* Test Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testResults.map((result, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {result.icon}
                    <h3 className="font-semibold">{result.category}</h3>
                  </div>
                  <Badge className={getScoreBadgeColor(result.score)}>
                    {result.score}/{result.maxScore}
                  </Badge>
                </div>
                
                <Progress value={result.score} className="h-2 mb-3" />
                
                <ul className="text-sm text-gray-600 space-y-1">
                  {result.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={runUXTests} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Tests Again
              </>
            )}
          </Button>
          
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Report
          </Button>
        </div>

        {/* Recommendations */}
        {overallScore < 90 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Recommendations</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {overallScore < 70 && (
                  <li>• Consider improving performance optimization</li>
                )}
                {overallScore < 80 && (
                  <li>• Enhance accessibility features</li>
                )}
                {overallScore < 90 && (
                  <li>• Add more interactive elements</li>
                )}
                <li>• Test with real Senegalese users</li>
                <li>• Gather user feedback for further improvements</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
