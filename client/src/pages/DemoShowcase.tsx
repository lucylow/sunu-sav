// client/src/pages/DemoShowcase.tsx
/**
 * Demo Showcase Page for SunuSàv Hackathon
 * Displays Senegalese market vendor data with security features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  MapPin, 
  Clock, 
  DollarSign,
  Smartphone,
  Globe,
  CheckCircle,
  AlertCircle,
  Play,
  BarChart3,
  User,
  Building
} from 'lucide-react';
import { demoService, DemoUser, DemoGroup } from '@/lib/demo-service';
import { securityIntegration } from '@/lib/security/integration';
import UXTesting from '@/components/UXTesting';
import { toast } from 'sonner';

export default function DemoShowcase() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [groups, setGroups] = useState<DemoGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      await demoService.initializeDemo();
      const demoUsers = demoService.getUsers();
      const demoGroups = demoService.getGroups();
      
      setUsers(demoUsers);
      setGroups(demoGroups);
      setIsInitialized(true);
      
      toast.success('Demo initialized with Senegalese market data');
    } catch (error) {
      console.error('Failed to initialize demo:', error);
      toast.error('Failed to initialize demo');
    }
  };

  const selectUser = (user: DemoUser) => {
    demoService.setCurrentUser(user);
    setCurrentUser(user);
    toast.success(`Selected ${user.profile.name} - ${user.profile.occupation}`);
  };

  const simulatePayment = async (groupId: string, amountSats: number) => {
    if (!currentUser) {
      toast.error('Please select a user first');
      return;
    }

    const result = await demoService.simulatePayment(groupId, amountSats);
    if (result.success) {
      toast.success(`Payment successful! Transaction: ${result.transactionId}`);
    } else {
      toast.error(`Payment failed: ${result.error}`);
    }
  };

  const getUserGroups = () => {
    if (!currentUser) return [];
    return demoService.getUserGroups(currentUser.id);
  };

  const getUserStats = () => {
    if (!currentUser) return null;
    return demoService.getUserStats(currentUser.id);
  };

  const getGroupStats = (groupId: string) => {
    return demoService.getGroupStats(groupId);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Initializing demo with Senegalese market data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-orange-900">SunuSàv Demo</h1>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Secure Bitcoin Tontines
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                Dakar Markets
              </Badge>
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Enterprise Security
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Market Vendors</TabsTrigger>
            <TabsTrigger value="groups">Tontine Groups</TabsTrigger>
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="testing">UX Testing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active Groups</p>
                      <p className="text-2xl font-bold">{groups.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Volume</p>
                      <p className="text-2xl font-bold">{demoService.satsToXof(90000)} XOF</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Security Level</p>
                      <p className="text-2xl font-bold">Enterprise</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dakar Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {Object.entries(demoService.getMarketData().dakarMarkets).map(([key, market]) => (
                    <div key={key} className="space-y-2">
                      <h3 className="font-semibold">{market.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Vendors: {market.vendorsCount.toLocaleString()}</p>
                        <p>Female Vendors: {Math.round(market.femaleVendorsRatio * 100)}%</p>
                        <p>Daily Customers: {market.dailyCustomers.toLocaleString()}</p>
                        <p>Main Products: {market.mainProducts.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Enterprise Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'RBAC', icon: Users, status: 'Active' },
                    { name: 'Field Encryption', icon: Shield, status: 'Active' },
                    { name: 'HMAC Receipts', icon: CheckCircle, status: 'Active' },
                    { name: 'PII Scrubbing', icon: AlertCircle, status: 'Active' },
                    { name: 'Rate Limiting', icon: Clock, status: 'Active' },
                    { name: 'Audit Logging', icon: BarChart3, status: 'Active' },
                    { name: 'TLS 1.3', icon: Globe, status: 'Active' },
                    { name: 'Certificate Pinning', icon: Shield, status: 'Active' }
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <feature.icon className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-green-600">{feature.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <Card 
                  key={user.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    currentUser?.id === user.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => selectUser(user)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {user.profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.profile.name}</h3>
                        <p className="text-sm text-gray-600">{user.profile.occupation}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{user.profile.market}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span>{user.profile.weeklyIncome.toLocaleString()} XOF/week</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3 w-3 text-gray-400" />
                        <span>{user.profile.preferredPayment}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{user.profile.tontineExperience} years experience</span>
                      </div>
                    </div>

                    {currentUser?.id === user.id && (
                      <Badge className="mt-3 bg-orange-100 text-orange-800">
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const stats = getGroupStats(group.id);
                const members = demoService.getGroupMembers(group.id);
                
                return (
                  <Card key={group.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-gray-600">{group.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Contribution</p>
                          <p className="font-semibold">{demoService.satsToXof(group.contributionAmount)} XOF</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Members</p>
                          <p className="font-semibold">{group.currentMembers}/{group.maxMembers}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cycle</p>
                          <p className="font-semibold">{group.currentCycle}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Frequency</p>
                          <p className="font-semibold capitalize">{group.frequency}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round((group.currentMembers / group.maxMembers) * 100)}%</span>
                        </div>
                        <Progress value={(group.currentMembers / group.maxMembers) * 100} />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{group.rules.meetingDay} at {group.rules.meetingTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{group.rules.location}</span>
                        </div>
                      </div>

                      {stats && (
                        <div className="pt-4 border-t space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Contributed:</span>
                            <span className="font-semibold">{stats.totalContributedXof} XOF</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completed Cycles:</span>
                            <span className="font-semibold">{stats.completedCycles}</span>
                          </div>
                        </div>
                      )}

                      {currentUser && (
                        <Button 
                          className="w-full" 
                          onClick={() => simulatePayment(group.id, group.contributionAmount)}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Simulate Payment
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Live Demo Tab */}
          <TabsContent value="demo" className="space-y-6">
            {!currentUser ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a User First</h3>
                  <p className="text-gray-600 mb-4">
                    Choose a market vendor from the Users tab to start the demo
                  </p>
                  <Button onClick={() => setActiveTab('users')}>
                    Go to Users
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Current User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Current Demo User
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-lg">
                          {currentUser.profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{currentUser.profile.name}</h3>
                        <p className="text-gray-600">{currentUser.profile.occupation}</p>
                        <p className="text-sm text-gray-500">{currentUser.profile.market}</p>
                      </div>
                      <Button variant="outline" onClick={() => setCurrentUser(null)}>
                        Change User
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* User Stats */}
                {getUserStats() && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        User Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {getUserStats()?.totalReceivedXof} XOF
                          </p>
                          <p className="text-sm text-gray-600">Total Received</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {getUserStats()?.totalContributedXof} XOF
                          </p>
                          <p className="text-sm text-gray-600">Total Contributed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {getUserStats()?.wins}
                          </p>
                          <p className="text-sm text-gray-600">Tontine Wins</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {getUserStats()?.activeGroups}
                          </p>
                          <p className="text-sm text-gray-600">Active Groups</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* User Groups */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      My Tontine Groups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getUserGroups().map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{group.name}</h4>
                            <p className="text-sm text-gray-600">{group.description}</p>
                            <p className="text-sm text-gray-500">
                              {demoService.satsToXof(group.contributionAmount)} XOF • {group.frequency}
                            </p>
                          </div>
                          <Button 
                            onClick={() => simulatePayment(group.id, group.contributionAmount)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* UX Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <UXTesting />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
