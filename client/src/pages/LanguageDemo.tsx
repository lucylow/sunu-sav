import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';
import { I18nDemo } from '@/components/I18nDemo';
import { Globe, Users, Coins, Calendar, Smartphone, MessageSquare } from 'lucide-react';

export default function LanguageDemo() {
  const { t, currentLanguage } = useTranslation();

  const languageInfo = {
    fr: { name: 'Français', flag: '🇫🇷', description: 'Langue principale du Sénégal' },
    wo: { name: 'Wolof', flag: '🇸🇳', description: 'Langue locale du Sénégal' },
    en: { name: 'English', flag: '🇺🇸', description: 'Support international' }
  };

  const currentLang = languageInfo[currentLanguage as keyof typeof languageInfo] || languageInfo.fr;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-orange-900">{t('settings.language')}</h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">{t('app.tagline')}</p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <LanguageSelector />
            <Badge variant="outline" className="text-lg px-4 py-2">
              {currentLang.flag} {currentLang.name}
            </Badge>
          </div>
          
          <p className="text-gray-500">{currentLang.description}</p>
        </div>

        {/* Language Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('community.community')}
              </CardTitle>
              <CardDescription>{t('community.traditional_tontines')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>{t('tontine.create')}:</strong> {t('tontine.name_label')}
                </div>
                <div className="text-sm">
                  <strong>{t('tontine.join')}:</strong> {t('tontine.description_label')}
                </div>
                <div className="text-sm">
                  <strong>{t('tontine.contribute')}:</strong> {t('tontine.amount_label')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                {t('wallet.lightning_network')}
              </CardTitle>
              <CardDescription>{t('wallet.instant_payments')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>{t('wallet.send')}:</strong> {t('wallet.scan_qr')}
                </div>
                <div className="text-sm">
                  <strong>{t('wallet.receive')}:</strong> {t('wallet.copy_invoice')}
                </div>
                <div className="text-sm">
                  <strong>{t('wallet.secure')}:</strong> {t('wallet.private_keys')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('ussd.main_menu')}
              </CardTitle>
              <CardDescription>USSD & SMS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-gray-100 p-3 rounded mb-3">
                {t('ussd.main_menu')}
              </div>
              <div className="text-sm">
                <strong>{t('sms.contribution')}</strong>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Demo */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('notifications.contribution_success')}
            </CardTitle>
            <CardDescription>{t('notifications.sync_complete')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800">
                  ✅ {t('notifications.payout_received', { amount: '25,000' })}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">
                  📱 {t('notifications.offline_queue')}
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">
                  ⚠️ {t('notifications.low_balance')}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-800">
                  🎉 {t('notifications.group_completed')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t('app.welcome', { name: 'Aissatou' })}</CardTitle>
            <CardDescription>{t('community.financial_inclusion')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">{t('tontine.create')}</Button>
                <Button variant="outline">{t('tontine.join')}</Button>
                <Button variant="outline">{t('wallet.send')}</Button>
                <Button variant="outline">{t('wallet.receive')}</Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>{t('frequency.weekly')}:</strong> {t('tontine.contribute', { amount: '5,000' })}</p>
                <p><strong>{t('frequency.monthly')}:</strong> {t('tontine.contribute', { amount: '20,000' })}</p>
                <p><strong>{t('status.active')}:</strong> {t('tontine.members')} - {t('tontine.pool_balance')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Demo Component */}
        <div className="mt-12">
          <I18nDemo />
        </div>
      </div>
    </div>
  );
}
