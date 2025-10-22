import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './brand-button';
import { Badge } from './badge';
import { 
  HelpCircle, 
  BookOpen, 
  Play, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  Shield,
  Zap,
  Users,
  Clock,
  X
} from 'lucide-react';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'interactive';
  duration?: string;
  completed?: boolean;
  language: 'fr' | 'wo'; // French or Wolof
}

interface TooltipContent {
  id: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface EducationalPanelProps {
  content: EducationalContent[];
  onContentComplete: (contentId: string) => void;
  className?: string;
}

export const EducationalPanel: React.FC<EducationalPanelProps> = ({
  content,
  onContentComplete,
  className
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'wo'>('fr');
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'interactive': return HelpCircle;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'interactive': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Language Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
            Centre d'apprentissage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedLanguage === 'fr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('fr')}
            >
              Français
            </Button>
            <Button
              variant={selectedLanguage === 'wo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('wo')}
            >
              Wolof
            </Button>
          </div>

          {/* Content List */}
          <div className="space-y-3">
            {content
              .filter(item => item.language === selectedLanguage)
              .map((item) => {
                const IconComponent = getContentIcon(item.type);
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedContent(item)}
                  >
                    <div className={cn(
                      'p-2 rounded-full',
                      item.completed ? 'bg-green-100' : 'bg-gray-200'
                    )}>
                      <IconComponent className={cn(
                        'w-5 h-5',
                        item.completed ? 'text-green-600' : 'text-gray-600'
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-charcoal-900">{item.title}</h4>
                        <Badge className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                        {item.duration && (
                          <span className="text-xs text-gray-500">{item.duration}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Content Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedContent.title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContent(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{selectedContent.description}</p>
                
                {selectedContent.type === 'video' && (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Vidéo d'apprentissage</p>
                    </div>
                  </div>
                )}
                
                {selectedContent.type === 'interactive' && (
                  <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold mb-3">Quiz interactif</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm font-medium mb-2">Qu'est-ce qu'une tontine?</p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="quiz" className="text-orange-600" />
                            <span className="text-sm">Un groupe d'épargne communautaire</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="quiz" className="text-orange-600" />
                            <span className="text-sm">Une banque traditionnelle</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="quiz" className="text-orange-600" />
                            <span className="text-sm">Un prêt individuel</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      onContentComplete(selectedContent.id);
                      setSelectedContent(null);
                    }}
                    disabled={selectedContent.completed}
                  >
                    {selectedContent.completed ? 'Terminé' : 'Marquer comme terminé'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Tooltip Component for guidance
export const GuidanceTooltip: React.FC<{
  content: TooltipContent;
  children: React.ReactNode;
  className?: string;
}> = ({ content, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={cn(
          'absolute z-50 w-64 p-3 bg-charcoal-900 text-white text-sm rounded-lg shadow-lg',
          positionClasses[content.position],
          'before:absolute before:w-2 before:h-2 before:bg-charcoal-900 before:rotate-45',
          content.position === 'top' && 'before:top-full before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-1/2',
          content.position === 'bottom' && 'before:bottom-full before:left-1/2 before:transform before:-translate-x-1/2 before:translate-y-1/2',
          content.position === 'left' && 'before:left-full before:top-1/2 before:transform before:-translate-y-1/2 before:-translate-x-1/2',
          content.position === 'right' && 'before:right-full before:top-1/2 before:transform before:-translate-y-1/2 before:translate-x-1/2'
        )}>
          <div className="font-semibold mb-1">{content.title}</div>
          <div className="text-gray-200">{content.description}</div>
        </div>
      )}
    </div>
  );
};

// Quick Tips Component
export const QuickTips: React.FC<{
  tips: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'security' | 'saving' | 'community' | 'lightning';
  }>;
  className?: string;
}> = ({ tips, className }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-green-100 text-green-800';
      case 'saving': return 'bg-blue-100 text-blue-800';
      case 'community': return 'bg-purple-100 text-purple-800';
      case 'lightning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'saving': return Users;
      case 'community': return Users;
      case 'lightning': return Zap;
      default: return Lightbulb;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-gold-600" />
          Conseils rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tips.map((tip) => {
            const CategoryIcon = getCategoryIcon(tip.category);
            const TipIcon = tip.icon;
            
            return (
              <div key={tip.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <TipIcon className="w-4 h-4 text-orange-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-charcoal-900">{tip.title}</h4>
                    <Badge className={getCategoryColor(tip.category)}>
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {tip.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Onboarding Progress Component
export const OnboardingProgress: React.FC<{
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
    current: boolean;
  }>;
  className?: string;
}> = ({ steps, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Configuration initiale
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : step.current 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              )}>
                {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              
              <div className="flex-1">
                <h4 className={cn(
                  'font-medium',
                  step.completed ? 'text-green-700' : step.current ? 'text-orange-700' : 'text-gray-500'
                )}>
                  {step.title}
                </h4>
              </div>
              
              {step.current && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  En cours
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
