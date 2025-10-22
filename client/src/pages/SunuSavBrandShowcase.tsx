import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button, LightningButton, CommunityButton, ContributionButton, JoinGroupButton } from '@/components/ui/brand-button';
import { CommunityCard, ActiveTontineCard, CompletedTontineCard, PendingTontineCard } from '@/components/ui/community-card';
import { GamificationPanel, AchievementBadge, ReferralCard } from '@/components/ui/gamification';
import { EducationalPanel, GuidanceTooltip, QuickTips, OnboardingProgress } from '@/components/ui/educational';
import { NetworkAware, ConnectionIndicator } from '@/components/ui/network-aware';
import { SkeletonLoader, TontineCardSkeleton } from '@/components/ui/skeleton-loader';
import { UserFriendlyError } from '@/components/ui/user-friendly-error';
import { ProgressiveImage, ProgressiveAvatar } from '@/components/ui/progressive-image';
import { PaymentFlow } from '@/components/ui/payment-flow';
import { PhoneInput, CurrencyInput, OTPInput } from '@/components/ui/accessible-input';
import { 
  Bitcoin, 
  Zap, 
  Users, 
  Trophy, 
  Star, 
  Crown, 
  Target,
  TrendingUp,
  Award,
  Gift,
  HelpCircle,
  BookOpen,
  Play,
  CheckCircle,
  Lightbulb,
  Shield,
  Calendar,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function SunuSavBrandShowcase() {
  const [phoneValue, setPhoneValue] = useState('');
  const [currencyValue, setCurrencyValue] = useState(0);
  const [otpValue, setOtpValue] = useState('');
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  // Mock data for demonstrations
  const mockTontines = [
    {
      id: '1',
      title: 'Tontine Famille Diouf',
      description: 'Épargne familiale pour les études des enfants et les projets familiaux',
      memberCount: 8,
      totalAmount: 240000,
      contributionAmount: 30000,
      status: 'active' as const,
      progress: 75,
      nextContributionDate: '2024-01-15',
      members: [
        { id: '1', name: 'Aminata Diouf', avatar: '/api/placeholder/100/100' },
        { id: '2', name: 'Moussa Diouf', avatar: '/api/placeholder/100/100' },
        { id: '3', name: 'Fatou Diouf', avatar: '/api/placeholder/100/100' },
        { id: '4', name: 'Ibrahima Diouf', avatar: '/api/placeholder/100/100' },
        { id: '5', name: 'Mariama Diouf', avatar: '/api/placeholder/100/100' },
      ]
    },
    {
      id: '2',
      title: 'Tontine Professionnelle',
      description: 'Épargne entre collègues pour les projets personnels et professionnels',
      memberCount: 12,
      totalAmount: 180000,
      contributionAmount: 15000,
      status: 'pending' as const,
      progress: 60,
      nextContributionDate: '2024-01-20',
      members: [
        { id: '1', name: 'Saliou Ndiaye', avatar: '/api/placeholder/100/100' },
        { id: '2', name: 'Aïcha Fall', avatar: '/api/placeholder/100/100' },
        { id: '3', name: 'Cheikh Ba', avatar: '/api/placeholder/100/100' },
      ]
    },
    {
      id: '3',
      title: 'Tontine Quartier',
      description: 'Épargne communautaire pour les événements et améliorations du quartier',
      memberCount: 15,
      totalAmount: 300000,
      contributionAmount: 20000,
      status: 'completed' as const,
      progress: 100,
      nextContributionDate: '2024-01-10',
      members: [
        { id: '1', name: 'Modou Sarr', avatar: '/api/placeholder/100/100' },
        { id: '2', name: 'Khadija Mbaye', avatar: '/api/placeholder/100/100' },
        { id: '3', name: 'Papa Ndiaye', avatar: '/api/placeholder/100/100' },
        { id: '4', name: 'Awa Diallo', avatar: '/api/placeholder/100/100' },
        { id: '5', name: 'Mamadou Faye', avatar: '/api/placeholder/100/100' },
        { id: '6', name: 'Ndeye Fall', avatar: '/api/placeholder/100/100' },
      ]
    }
  ];

  const mockAchievements = [
    {
      id: '1',
      title: 'Premier pas',
      description: 'Effectuez votre première contribution',
      icon: Target,
      category: 'contribution' as const,
      points: 100,
      unlocked: true,
      unlockedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Épargnant régulier',
      description: 'Contribuez pendant 4 semaines consécutives',
      icon: Calendar,
      category: 'consistency' as const,
      points: 250,
      unlocked: false,
      progress: 3,
      maxProgress: 4,
    },
    {
      id: '3',
      title: 'Leader communautaire',
      description: 'Créez votre premier groupe de tontine',
      icon: Crown,
      category: 'leadership' as const,
      points: 500,
      unlocked: true,
      unlockedAt: new Date('2024-01-05'),
    },
    {
      id: '4',
      title: 'Ambassadeur',
      description: 'Parrainez 5 nouveaux membres',
      icon: Users,
      category: 'community' as const,
      points: 300,
      unlocked: false,
      progress: 2,
      maxProgress: 5,
    }
  ];

  const mockUserStats = {
    totalContributions: 24,
    consistentWeeks: 6,
    groupsJoined: 3,
    referralsMade: 2,
    level: 'intermediate',
    points: 1250,
    nextLevelPoints: 2000,
  };

  const mockEducationalContent = [
    {
      id: '1',
      title: 'Qu\'est-ce qu\'une tontine?',
      description: 'Découvrez les bases des groupes d\'épargne communautaires',
      type: 'video' as const,
      duration: '5 min',
      completed: true,
      language: 'fr' as const,
    },
    {
      id: '2',
      title: 'Comment fonctionne Bitcoin Lightning?',
      description: 'Comprenez les paiements instantanés avec Bitcoin',
      type: 'interactive' as const,
      duration: '10 min',
      completed: false,
      language: 'fr' as const,
    },
    {
      id: '3',
      title: 'Sécurité et protection des fonds',
      description: 'Apprenez à protéger vos économies',
      type: 'text' as const,
      duration: '3 min',
      completed: false,
      language: 'fr' as const,
    }
  ];

  const mockTips = [
    {
      id: '1',
      title: 'Contribuez régulièrement',
      description: 'Les contributions régulières vous permettent de gagner des points et d\'accéder à des récompenses.',
      icon: Calendar,
      category: 'saving' as const,
    },
    {
      id: '2',
      title: 'Protégez votre portefeuille',
      description: 'Ne partagez jamais vos clés privées et utilisez toujours l\'authentification à deux facteurs.',
      icon: Shield,
      category: 'security' as const,
    },
    {
      id: '3',
      title: 'Rejoignez des groupes de confiance',
      description: 'Choisissez des groupes avec des membres que vous connaissez et en qui vous avez confiance.',
      icon: Users,
      category: 'community' as const,
    },
    {
      id: '4',
      title: 'Utilisez Lightning pour des frais bas',
      description: 'Les paiements Lightning sont instantanés et ont des frais très bas.',
      icon: Zap,
      category: 'lightning' as const,
    }
  ];

  const mockOnboardingSteps = [
    { id: '1', title: 'Créer un compte', completed: true, current: false },
    { id: '2', title: 'Vérifier votre téléphone', completed: true, current: false },
    { id: '3', title: 'Configurer votre portefeuille', completed: false, current: true },
    { id: '4', title: 'Rejoindre votre premier groupe', completed: false, current: false },
    { id: '5', title: 'Effectuer votre première contribution', completed: false, current: false },
  ];

  return (
    <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-gold-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-gold-500 rounded-2xl shadow-lg">
              <Bitcoin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-charcoal-900">SunuSàv</h1>
          </div>
          <p className="text-xl text-charcoal-600 mb-4">
            Composants UX/UI alignés avec l'identité de marque
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Interface optimisée pour les connexions lentes et les téléphones de gamme moyenne au Sénégal, 
            avec des couleurs chaudes, des éléments communautaires et une approche culturellement adaptée.
          </p>
          <div className="mt-4">
            <ConnectionIndicator />
          </div>
        </div>

        <Tabs defaultValue="brand" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="brand">Marque</TabsTrigger>
            <TabsTrigger value="community">Communauté</TabsTrigger>
            <TabsTrigger value="gamification">Gamification</TabsTrigger>
            <TabsTrigger value="education">Éducation</TabsTrigger>
            <TabsTrigger value="forms">Formulaires</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          {/* Brand Elements */}
          <TabsContent value="brand" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Éléments de marque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color Palette */}
                <div>
                  <h4 className="font-semibold mb-4">Palette de couleurs</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-500 rounded-xl mx-auto mb-2 shadow-md"></div>
                      <div className="text-sm font-medium">Orange principal</div>
                      <div className="text-xs text-gray-500">#f97316</div>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gold-500 rounded-xl mx-auto mb-2 shadow-md"></div>
                      <div className="text-sm font-medium">Or secondaire</div>
                      <div className="text-xs text-gray-500">#f59e0b</div>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal-700 rounded-xl mx-auto mb-2 shadow-md"></div>
                      <div className="text-sm font-medium">Charbon</div>
                      <div className="text-xs text-gray-500">#4f4f4f</div>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-earth-200 rounded-xl mx-auto mb-2 shadow-md"></div>
                      <div className="text-sm font-medium">Terre</div>
                      <div className="text-xs text-gray-500">#e7e5e4</div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div>
                  <h4 className="font-semibold mb-4">Boutons de marque</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button>Bouton principal</Button>
                    <Button variant="secondary">Secondaire</Button>
                    <LightningButton>Lightning</LightningButton>
                    <CommunityButton>Communauté</CommunityButton>
                    <ContributionButton />
                    <JoinGroupButton />
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h4 className="font-semibold mb-4">Typographie</h4>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-charcoal-900">Titre principal</h1>
                    <h2 className="text-2xl font-semibold text-charcoal-800">Titre secondaire</h2>
                    <h3 className="text-xl font-medium text-charcoal-700">Titre de section</h3>
                    <p className="text-base text-charcoal-600">Paragraphe de texte normal avec une bonne lisibilité.</p>
                    <p className="text-sm text-gray-500">Texte secondaire pour les descriptions et métadonnées.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community Elements */}
          <TabsContent value="community" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Éléments communautaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {mockTontines.map((tontine) => (
                    <CommunityCard
                      key={tontine.id}
                      {...tontine}
                      onJoin={() => console.log('Join group')}
                      onContribute={() => console.log('Contribute')}
                      onViewDetails={() => console.log('View details')}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gamification */}
          <TabsContent value="gamification" className="space-y-8">
            <GamificationPanel
              achievements={mockAchievements}
              userStats={mockUserStats}
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-gold-600" />
                    Badges de réalisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {mockAchievements.map((achievement) => (
                      <div key={achievement.id} className="text-center">
                        <AchievementBadge achievement={achievement} size="lg" showProgress />
                        <div className="text-xs mt-2 font-medium">{achievement.title}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ReferralCard
                referralCode="SUNU123"
                totalReferrals={5}
                pendingRewards={250}
                onShare={() => console.log('Share referral')}
              />
            </div>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <EducationalPanel
                content={mockEducationalContent}
                onContentComplete={(id) => console.log('Complete content:', id)}
              />
              
              <div className="space-y-6">
                <QuickTips tips={mockTips} />
                <OnboardingProgress steps={mockOnboardingSteps} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-orange-600" />
                  Tooltips d'aide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <GuidanceTooltip
                    content={{
                      id: '1',
                      title: 'Contribution Lightning',
                      description: 'Les paiements Lightning sont instantanés et ont des frais très bas.',
                      position: 'top'
                    }}
                  >
                    <Button variant="outline">Payer avec Lightning</Button>
                  </GuidanceTooltip>
                  
                  <GuidanceTooltip
                    content={{
                      id: '2',
                      title: 'Sécurité des fonds',
                      description: 'Vos fonds sont protégés par la technologie Bitcoin multi-signature.',
                      position: 'bottom'
                    }}
                  >
                    <Button variant="outline">Portefeuille sécurisé</Button>
                  </GuidanceTooltip>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms */}
          <TabsContent value="forms" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  Formulaires localisés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <PhoneInput
                    value={phoneValue}
                    onChange={setPhoneValue}
                    helperText="Format sénégalais: 77 123 45 67"
                    required
                  />
                  
                  <CurrencyInput
                    value={currencyValue}
                    onChange={setCurrencyValue}
                    label="Montant en FCFA"
                    currency="FCFA"
                    helperText="Montant en francs CFA"
                  />
                  
                  <div className="md:col-span-2">
                    <OTPInput
                      value={otpValue}
                      onChange={setOtpValue}
                      length={6}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactions */}
          <TabsContent value="interactions" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    Flux de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowPaymentFlow(true)} className="w-full">
                    Ouvrir le flux de paiement
                  </Button>
                  
                  {showPaymentFlow && (
                    <div className="mt-6">
                      <PaymentFlow
                        onComplete={(data) => {
                          console.log('Payment completed:', data);
                          setShowPaymentFlow(false);
                        }}
                        onCancel={() => setShowPaymentFlow(false)}
                        initialAmount={5000}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-orange-600" />
                    États de chargement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TontineCardSkeleton />
                  <div className="flex space-x-4">
                    <SkeletonLoader width="60px" height="60px" className="rounded-full" />
                    <div className="space-y-2 flex-1">
                      <SkeletonLoader width="80%" height="16px" />
                      <SkeletonLoader width="60%" height="14px" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Gestion d'erreurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <UserFriendlyError
                    error="NETWORK_ERROR"
                    onRetry={() => console.log('Retry')}
                    title="Problème de connexion"
                    retryText="Réessayer"
                  />
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Messages d'erreur localisés</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <strong>Erreur réseau:</strong> Problème de connexion. Vérifiez votre internet.
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <strong>Fonds insuffisants:</strong> Fonds insuffisants pour cette transaction.
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <strong>Facture expirée:</strong> La facture a expiré. Générez-en une nouvelle.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-12" />

        {/* Feature Highlights */}
        <Card className="bg-gradient-to-r from-orange-50 to-gold-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Caractéristiques clés de SunuSàv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Paiements Lightning</h3>
                <p className="text-sm text-gray-600">Paiements instantanés avec des frais très bas</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Communauté</h3>
                <p className="text-sm text-gray-600">Groupes d'épargne basés sur la confiance</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Sécurité</h3>
                <p className="text-sm text-gray-600">Protection multi-signature des fonds</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Gamification</h3>
                <p className="text-sm text-gray-600">Points, badges et récompenses</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Éducation</h3>
                <p className="text-sm text-gray-600">Apprentissage en français et wolof</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Croissance</h3>
                <p className="text-sm text-gray-600">Épargne régulière et objectifs financiers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </NetworkAware>
  );
}
