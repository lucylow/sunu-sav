import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Globe, Users, Coins, Calendar } from 'lucide-react';

export function I18nDemo() {
  const { t, currentLanguage } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription>
                {t('settings.choose_language')} - {t('app.name')}
              </CardDescription>
            </div>
            <LanguageSelector />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            {t('app.tagline')} • {t('community.community')}
          </div>
          <div className="text-lg font-semibold">
            {t('app.welcome', { name: 'Aissatou' })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('tontine.members')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">{t('tontine.create')}</h4>
              <p className="text-sm text-gray-600">{t('tontine.name_label')}</p>
            </div>
            <div>
              <h4 className="font-medium">{t('tontine.join')}</h4>
              <p className="text-sm text-gray-600">{t('tontine.description_label')}</p>
            </div>
            <Button className="w-full">
              {t('tontine.contribute', { amount: '10,000' })}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              {t('wallet.balance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold text-orange-600">
              {t('wallet.balance', { balance: '50,000' })}
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                {t('wallet.send')}
              </Button>
              <Button variant="outline" className="w-full">
                {t('wallet.receive')}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {t('wallet.lightning_network')} • {t('wallet.secure')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('notifications.contribution_success')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                {t('notifications.payout_received', { amount: '25,000' })}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">
                {t('notifications.sync_complete')}
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm font-medium text-yellow-800">
                {t('notifications.offline_queue')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('ussd.main_menu')}</CardTitle>
          <CardDescription>{t('sms.contribution')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm bg-gray-100 p-3 rounded">
            {t('ussd.main_menu')}
          </div>
          <div className="mt-3 text-sm">
            {t('ussd.confirm_contrib', { amount: '5,000' })}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        {t('app.name')} • {t('community.traditional_tontines')} • {t('community.financial_inclusion')}
      </div>
    </div>
  );
}
