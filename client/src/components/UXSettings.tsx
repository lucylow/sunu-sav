// client/src/components/UXSettings.tsx
/**
 * UX Settings Component
 * Provides comprehensive user experience customization
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Palette, 
  Eye, 
  Volume2, 
  Bell, 
  Shield, 
  Download, 
  Upload,
  RotateCcw,
  Info,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Languages,
  DollarSign,
  Accessibility,
  Smartphone,
  Globe,
  BarChart3
} from 'lucide-react';
import { uxEnhancementService, UXPreferences, SmartSuggestion } from '@/lib/ux-enhancements';
import { toast } from 'sonner';

interface UXSettingsProps {
  onClose?: () => void;
}

export default function UXSettings({ onClose }: UXSettingsProps) {
  const [preferences, setPreferences] = useState<UXPreferences>(uxEnhancementService.getPreferences());
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('appearance');

  useEffect(() => {
    // Load smart suggestions
    const suggestions = uxEnhancementService.getSmartSuggestions();
    setSmartSuggestions(suggestions);

    // Load analytics
    const analyticsData = uxEnhancementService.getAnalyticsSummary();
    setAnalytics(analyticsData);
  }, []);

  const updatePreference = (key: keyof UXPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    uxEnhancementService.savePreferences({ [key]: value });
  };

  const updateNestedPreference = (parentKey: keyof UXPreferences, childKey: string, value: any) => {
    const newPreferences = {
      ...preferences,
      [parentKey]: {
        ...(preferences[parentKey] as any),
        [childKey]: value
      }
    };
    setPreferences(newPreferences);
    uxEnhancementService.savePreferences({ [parentKey]: newPreferences[parentKey] });
  };

  const handleExportData = () => {
    const data = uxEnhancementService.exportUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sunusav-user-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('User data exported successfully');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        const success = uxEnhancementService.importUserData(data);
        if (success) {
          setPreferences(uxEnhancementService.getPreferences());
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetPreferences = () => {
    uxEnhancementService.resetPreferences();
    setPreferences(uxEnhancementService.getPreferences());
    toast.success('Preferences reset to defaults');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              User Experience Settings
            </CardTitle>
            <CardDescription>
              Customize your SunuSàv experience with these advanced settings
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="data">Data & Analytics</TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme Mode</Label>
                    <Select 
                      value={preferences.theme} 
                      onValueChange={(value: any) => updatePreference('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="auto">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Auto
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={preferences.language} 
                      onValueChange={(value: any) => updatePreference('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Français
                          </div>
                        </SelectItem>
                        <SelectItem value="wo">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Wolof
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            English
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select 
                      value={preferences.currency} 
                      onValueChange={(value: any) => updatePreference('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            XOF (West African Franc)
                          </div>
                        </SelectItem>
                        <SelectItem value="BTC">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            BTC (Bitcoin)
                          </div>
                        </SelectItem>
                        <SelectItem value="USD">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            USD (US Dollar)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Display Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Display
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-contrast">High Contrast</Label>
                      <p className="text-sm text-gray-600">Improve visibility for better readability</p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={preferences.accessibility.highContrast}
                      onCheckedChange={(checked: boolean) => 
                        updateNestedPreference('accessibility', 'highContrast', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="large-text">Large Text</Label>
                      <p className="text-sm text-gray-600">Increase text size for better readability</p>
                    </div>
                    <Switch
                      id="large-text"
                      checked={preferences.accessibility.largeText}
                      onCheckedChange={(checked: boolean) => 
                        updateNestedPreference('accessibility', 'largeText', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reduced-motion">Reduced Motion</Label>
                      <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={preferences.accessibility.reducedMotion}
                      onCheckedChange={(checked: boolean) => 
                        updateNestedPreference('accessibility', 'reducedMotion', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment-notifications">Payment Reminders</Label>
                    <p className="text-sm text-gray-600">Get notified when payments are due</p>
                  </div>
                  <Switch
                    id="payment-notifications"
                    checked={preferences.notifications.payments}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('notifications', 'payments', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payout-notifications">Payout Notifications</Label>
                    <p className="text-sm text-gray-600">Get notified when you receive payouts</p>
                  </div>
                  <Switch
                    id="payout-notifications"
                    checked={preferences.notifications.payouts}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('notifications', 'payouts', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-notifications">Group Updates</Label>
                    <p className="text-sm text-gray-600">Get notified about group activities</p>
                  </div>
                  <Switch
                    id="group-notifications"
                    checked={preferences.notifications.groupUpdates}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('notifications', 'groupUpdates', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="security-notifications">Security Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified about security events</p>
                  </div>
                  <Switch
                    id="security-notifications"
                    checked={preferences.notifications.security}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('notifications', 'security', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4" />
                  Accessibility Features
                </CardTitle>
                <CardDescription>
                  Make SunuSàv more accessible for everyone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="screen-reader">Screen Reader Support</Label>
                    <p className="text-sm text-gray-600">Optimize for screen readers</p>
                  </div>
                  <Switch
                    id="screen-reader"
                    checked={preferences.accessibility.screenReader}
                      onCheckedChange={(checked: boolean) => 
                        updateNestedPreference('accessibility', 'screenReader', checked)
                    }
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Text Size</Label>
                  <div className="mt-2">
                    <Slider
                      value={[preferences.accessibility.largeText ? 1 : 0]}
                      onValueChange={([value]: number[]) => 
                        updateNestedPreference('accessibility', 'largeText', value === 1)
                      }
                      max={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Normal</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    These settings help make SunuSàv accessible to users with different needs. 
                    Changes are applied immediately.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-balances">Show Balances</Label>
                    <p className="text-sm text-gray-600">Display your balances in the interface</p>
                  </div>
                  <Switch
                    id="show-balances"
                    checked={preferences.privacy.showBalances}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('privacy', 'showBalances', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-analytics">Share Analytics</Label>
                    <p className="text-sm text-gray-600">Help improve SunuSàv by sharing usage data</p>
                  </div>
                  <Switch
                    id="share-analytics"
                    checked={preferences.privacy.shareAnalytics}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('privacy', 'shareAnalytics', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="biometric-auth">Biometric Authentication</Label>
                    <p className="text-sm text-gray-600">Use fingerprint or face ID for login</p>
                  </div>
                  <Switch
                    id="biometric-auth"
                    checked={preferences.privacy.biometricAuth}
                    onCheckedChange={(checked: boolean) => 
                      updateNestedPreference('privacy', 'biometricAuth', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Analytics Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Smart Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Smart Suggestions
                  </CardTitle>
                  <CardDescription>
                    Personalized recommendations based on your activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {smartSuggestions.length > 0 ? (
                    smartSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <Badge 
                                variant={suggestion.priority === 'high' ? 'destructive' : 
                                        suggestion.priority === 'medium' ? 'default' : 'secondary'}
                              >
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            {suggestion.action}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No suggestions available at the moment
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Analytics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Usage Analytics
                  </CardTitle>
                  <CardDescription>
                    Your activity summary (if analytics are enabled)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics && preferences.privacy.shareAnalytics ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Session Duration</p>
                          <p className="font-medium">{Math.round(analytics.sessionDuration / 1000 / 60)} min</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Pages Visited</p>
                          <p className="font-medium">{analytics.pagesVisited.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Actions Performed</p>
                          <p className="font-medium">{analytics.actionsPerformed.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Errors Encountered</p>
                          <p className="font-medium">{analytics.errorsEncountered.length}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Analytics are disabled in privacy settings
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export or import your user data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>

                  <Button onClick={handleResetPreferences} variant="outline" className="text-red-600">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
