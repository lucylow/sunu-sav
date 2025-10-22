import React from 'react';
import { cn } from '@/lib/utils';
import { gamification, brandColors } from '@/lib/design-system';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { 
  Trophy, 
  Star, 
  Zap, 
  Users, 
  Calendar, 
  Crown, 
  Target,
  TrendingUp,
  Award,
  Gift
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: keyof typeof gamification.achievements;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  totalContributions: number;
  consistentWeeks: number;
  groupsJoined: number;
  referralsMade: number;
  level: string;
  points: number;
  nextLevelPoints: number;
}

interface GamificationPanelProps {
  achievements: Achievement[];
  userStats: UserStats;
  className?: string;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({
  achievements,
  userStats,
  className
}) => {
  const getLevelColor = (level: string) => {
    const levelKey = level.toLowerCase() as keyof typeof gamification.levels;
    return gamification.levels[levelKey]?.color || gamification.levels.beginner.color;
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert': return Crown;
      case 'advanced': return Trophy;
      case 'intermediate': return Star;
      default: return Target;
    }
  };

  const LevelIcon = getLevelIcon(userStats.level);

  return (
    <div className={cn('space-y-6', className)}>
      {/* User Level Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-gold-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <LevelIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal-900">{userStats.level}</div>
              <div className="text-sm text-charcoal-600">Niveau actuel</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Points Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-charcoal-700">Points</span>
                <span className="font-medium text-charcoal-900">
                  {userStats.points} / {userStats.nextLevelPoints}
                </span>
              </div>
              <div className="w-full bg-charcoal-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-gold-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(userStats.points / userStats.nextLevelPoints) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-charcoal-900">{userStats.totalContributions}</div>
                <div className="text-xs text-charcoal-600">Contributions</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Calendar className="w-5 h-5 text-gold-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-charcoal-900">{userStats.consistentWeeks}</div>
                <div className="text-xs text-charcoal-600">Semaines</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-charcoal-900">{userStats.groupsJoined}</div>
                <div className="text-xs text-charcoal-600">Groupes</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-charcoal-900">{userStats.referralsMade}</div>
                <div className="text-xs text-charcoal-600">Parrainages</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-600" />
            Réalisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const categoryInfo = gamification.achievements[achievement.category];
              const IconComponent = achievement.icon;
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-200',
                    achievement.unlocked 
                      ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-full',
                      achievement.unlocked 
                        ? 'bg-gradient-to-r from-green-100 to-blue-100' 
                        : 'bg-gray-200'
                    )}>
                      <IconComponent className={cn(
                        'w-5 h-5',
                        achievement.unlocked ? 'text-green-600' : 'text-gray-400'
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          'font-semibold text-sm',
                          achievement.unlocked ? 'text-charcoal-900' : 'text-gray-500'
                        )}>
                          {achievement.title}
                        </h4>
                        {achievement.unlocked && (
                          <Badge variant="secondary" className="text-xs">
                            +{achievement.points} pts
                          </Badge>
                        )}
                      </div>
                      
                      <p className={cn(
                        'text-xs mb-2',
                        achievement.unlocked ? 'text-charcoal-600' : 'text-gray-400'
                      )}>
                        {achievement.description}
                      </p>
                      
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Progression</span>
                            <span className="text-gray-500">
                              {achievement.progress} / {achievement.maxProgress}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-orange-500 to-gold-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(achievement.progress / achievement.maxProgress) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {achievement.unlockedAt && (
                        <div className="text-xs text-green-600 mt-2">
                          ✓ Débloqué le {achievement.unlockedAt.toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual Achievement Component
export const AchievementBadge: React.FC<{
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}> = ({ achievement, size = 'md', showProgress = false }) => {
  const categoryInfo = gamification.achievements[achievement.category];
  const IconComponent = achievement.icon;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="relative">
      <div className={cn(
        'rounded-full flex items-center justify-center border-2',
        sizeClasses[size],
        achievement.unlocked 
          ? 'bg-gradient-to-r from-green-100 to-blue-100 border-green-300' 
          : 'bg-gray-100 border-gray-300'
      )}>
        <IconComponent className={cn(
          iconSizeClasses[size],
          achievement.unlocked ? 'text-green-600' : 'text-gray-400'
        )} />
      </div>
      
      {achievement.unlocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
          <Star className="w-2 h-2 text-white fill-current" />
        </div>
      )}
      
      {showProgress && achievement.progress !== undefined && achievement.maxProgress && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full px-2 py-1 shadow-sm border">
            <span className="text-xs font-medium text-charcoal-700">
              {achievement.progress}/{achievement.maxProgress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Referral Component
export const ReferralCard: React.FC<{
  referralCode: string;
  totalReferrals: number;
  pendingRewards: number;
  onShare: () => void;
}> = ({ referralCode, totalReferrals, pendingRewards, onShare }) => {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Programme de parrainage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-white rounded-xl border border-purple-100">
          <div className="text-sm text-charcoal-600 mb-2">Votre code de parrainage</div>
          <div className="text-2xl font-bold text-purple-700 font-mono">{referralCode}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-charcoal-900">{totalReferrals}</div>
            <div className="text-xs text-charcoal-600">Parrainages</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <Zap className="w-5 h-5 text-gold-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-charcoal-900">{pendingRewards}</div>
            <div className="text-xs text-charcoal-600">Récompenses</div>
          </div>
        </div>
        
        <button
          onClick={onShare}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          Partager le code
        </button>
      </CardContent>
    </Card>
  );
};
