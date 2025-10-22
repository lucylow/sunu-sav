import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { NetworkAware, ConnectionIndicator } from '@/components/ui/network-aware';
import { SkeletonLoader, TontineCardSkeleton, ListSkeleton, ProfileSkeleton, TableSkeleton } from '@/components/ui/skeleton-loader';
import { UserFriendlyError, PaymentError, NetworkError, TimeoutError } from '@/components/ui/user-friendly-error';
import { ProgressiveImage, ProgressiveAvatar, ProgressiveImageGallery, ResponsiveImage } from '@/components/ui/progressive-image';
import { PaymentFlow } from '@/components/ui/payment-flow';
import { AccessibleInput, PasswordInput, PhoneInput, SearchInput, CurrencyInput, OTPInput } from '@/components/ui/accessible-input';
import { Bitcoin, Smartphone, Wifi, AlertTriangle } from 'lucide-react';

export default function UXComponentsShowcase() {
  const [phoneValue, setPhoneValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [currencyValue, setCurrencyValue] = useState(0);
  const [otpValue, setOtpValue] = useState('');
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const mockImages = [
    { src: '/api/placeholder/300/200', alt: 'Tontine 1', caption: 'Groupe familial' },
    { src: '/api/placeholder/300/200', alt: 'Tontine 2', caption: 'Groupe professionnel' },
    { src: '/api/placeholder/300/200', alt: 'Tontine 3', caption: 'Groupe communautaire' },
    { src: '/api/placeholder/300/200', alt: 'Tontine 4', caption: 'Groupe d\'amis' },
  ];

  return (
    <NetworkAware className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Composants UX/UI Optimisés
          </h1>
          <p className="text-gray-600">
            Composants spécialement conçus pour les connexions lentes et les téléphones de gamme moyenne au Sénégal
          </p>
          <div className="mt-4">
            <ConnectionIndicator />
          </div>
        </div>

        <Tabs defaultValue="skeleton" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="skeleton">Skeleton</TabsTrigger>
            <TabsTrigger value="network">Réseau</TabsTrigger>
            <TabsTrigger value="errors">Erreurs</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="payment">Paiement</TabsTrigger>
            <TabsTrigger value="inputs">Formulaires</TabsTrigger>
          </TabsList>

          {/* Skeleton Loaders */}
          <TabsContent value="skeleton" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loaders</CardTitle>
                <p className="text-gray-600">
                  Chargement progressif pour améliorer la perception des performances
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Skeleton de base</h4>
                  <div className="space-y-2">
                    <SkeletonLoader width="100%" height="20px" />
                    <SkeletonLoader width="80%" height="16px" />
                    <SkeletonLoader width="60%" height="16px" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Skeleton de carte tontine</h4>
                  <TontineCardSkeleton />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Skeleton de profil</h4>
                  <ProfileSkeleton />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Skeleton de liste</h4>
                  <ListSkeleton count={3} />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Skeleton de tableau</h4>
                  <TableSkeleton rows={4} cols={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Awareness */}
          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Composants de Réseau</CardTitle>
                <p className="text-gray-600">
                  Détection automatique de la qualité de connexion et gestion hors ligne
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Indicateur de connexion</h4>
                  <div className="flex space-x-4">
                    <ConnectionIndicator />
                    <Badge variant="outline">Connexion normale</Badge>
                    <Badge variant="outline" className="text-yellow-600">Connexion lente</Badge>
                    <Badge variant="outline" className="text-red-600">Hors ligne</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Bannière hors ligne</h4>
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Mode hors ligne - Lecture seule</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Handling */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion d'Erreurs</CardTitle>
                <p className="text-gray-600">
                  Messages d'erreur conviviaux avec options de récupération
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Erreur générale</h4>
                  <UserFriendlyError
                    error="NETWORK_ERROR"
                    onRetry={() => console.log('Retry')}
                    title="Problème de connexion"
                    retryText="Réessayer"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Erreur de paiement</h4>
                  <PaymentError
                    error="PAYMENT_FAILED"
                    onRetry={() => console.log('Retry payment')}
                    onCancel={() => console.log('Cancel')}
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Erreur réseau</h4>
                  <NetworkError onRetry={() => console.log('Retry network')} />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Erreur de timeout</h4>
                  <TimeoutError onRetry={() => console.log('Retry timeout')} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progressive Images */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images Progressives</CardTitle>
                <p className="text-gray-600">
                  Chargement optimisé avec lazy loading et gestion d'erreurs
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Image progressive</h4>
                  <ProgressiveImage
                    src="/api/placeholder/400/300"
                    alt="Image de démonstration"
                    className="w-full h-48 rounded-lg"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Avatar progressif</h4>
                  <div className="flex space-x-4">
                    <ProgressiveAvatar
                      src="/api/placeholder/100/100"
                      alt="Utilisateur"
                      size="sm"
                      fallbackText="John Doe"
                    />
                    <ProgressiveAvatar
                      src="/api/placeholder/100/100"
                      alt="Utilisateur"
                      size="md"
                      fallbackText="Jane Smith"
                    />
                    <ProgressiveAvatar
                      src="/api/placeholder/100/100"
                      alt="Utilisateur"
                      size="lg"
                      fallbackText="Bob Wilson"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Galerie d'images</h4>
                  <ProgressiveImageGallery images={mockImages} columns={2} />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Image responsive</h4>
                  <ResponsiveImage
                    src="/api/placeholder/600/400"
                    alt="Image responsive"
                    aspectRatio="video"
                    className="max-w-md"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Flow */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flux de Paiement</CardTitle>
                <p className="text-gray-600">
                  Processus de paiement étape par étape avec indicateurs de progression
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Flux de paiement Lightning</h4>
                  <Button onClick={() => setShowPaymentFlow(true)}>
                    Ouvrir le flux de paiement
                  </Button>
                  
                  {showPaymentFlow && (
                    <div className="mt-4">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Inputs */}
          <TabsContent value="inputs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulaires Accessibles</CardTitle>
                <p className="text-gray-600">
                  Champs de saisie optimisés avec validation et formatage automatique
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Champ accessible</h4>
                    <AccessibleInput
                      label="Nom complet"
                      placeholder="Entrez votre nom"
                      helperText="Votre nom complet sera affiché"
                      required
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Mot de passe</h4>
                    <PasswordInput
                      label="Mot de passe"
                      placeholder="Entrez votre mot de passe"
                      helperText="Minimum 8 caractères"
                      required
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Numéro de téléphone</h4>
                    <PhoneInput
                      value={phoneValue}
                      onChange={setPhoneValue}
                      helperText="Format sénégalais: 77 123 45 67"
                      required
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Recherche</h4>
                    <SearchInput
                      value={searchValue}
                      onChange={setSearchValue}
                      placeholder="Rechercher..."
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Montant en FCFA</h4>
                    <CurrencyInput
                      value={currencyValue}
                      onChange={setCurrencyValue}
                      label="Montant"
                      currency="FCFA"
                      helperText="Montant en francs CFA"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Code OTP</h4>
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
        </Tabs>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques Clés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Optimisé pour les connexions lentes</h4>
                  <p className="text-sm text-gray-600">Détection automatique et adaptation</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Interface mobile-first</h4>
                  <p className="text-sm text-gray-600">Conçu pour les téléphones de gamme moyenne</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bitcoin className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Intégration Lightning</h4>
                  <p className="text-sm text-gray-600">Paiements instantanés et sécurisés</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Gestion d'erreurs intelligente</h4>
                  <p className="text-sm text-gray-600">Messages clairs et options de récupération</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-indigo-600 rounded"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Chargement progressif</h4>
                  <p className="text-sm text-gray-600">Skeleton screens et lazy loading</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-pink-600 rounded"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Accessibilité</h4>
                  <p className="text-sm text-gray-600">Contraste élevé et navigation clavier</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </NetworkAware>
  );
}
