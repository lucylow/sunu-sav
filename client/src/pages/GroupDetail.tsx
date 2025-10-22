import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, Calendar, Coins, ArrowLeft, Bitcoin, 
  CheckCircle, Clock, TrendingUp, Zap, Shield, QrCode,
  AlertTriangle, Trophy, Send, MoreVertical, UserPlus
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";
import PaymentFlow from "@/components/PaymentFlow";
import MultiSigWallet from "@/components/MultiSigWallet";
import PayoutManager from "@/components/PayoutManager";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function GroupDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/groups/:id");
  const groupId = params?.id || "";
  
  const { data, isLoading, refetch } = trpc.tontine.getGroup.useQuery(
    { id: groupId }
  );

  const joinMutation = trpc.tontine.join.useMutation({
    onSuccess: () => {
      toast.success("Successfully joined the group!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to join group");
    },
  });

  // Calculate group statistics
  const groupStats = useMemo(() => {
    if (!data) return null;
    
    const { group, members, contributions, payouts } = data;
    const isMember = members.some((m: any) => m.userId === user?.id);
    const totalContributed = contributions
      .filter((c: any) => c.status === "confirmed")
      .reduce((sum: number, c: any) => sum + c.amount, 0);
    
    const paidThisCycle = contributions.filter((c: any) => 
      c.status === "confirmed" && c.cycle === group.currentCycle
    ).length;
    
    const paymentProgress = members.length > 0 ? (paidThisCycle / members.length) * 100 : 0;
    
    return {
      isMember,
      totalContributed,
      paidThisCycle,
      paymentProgress,
      membersCount: members.length,
      overdueCount: members.length - paidThisCycle,
    };
  }, [data, user?.id]);

  // Calculate next due date and urgency
  const dueDateInfo = useMemo(() => {
    if (!data?.group?.nextPayoutDate) return null;
    
    const now = new Date();
    const nextDue = new Date(data.group.nextPayoutDate);
    const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let statusText = '';
    
    if (daysUntilDue < 0) {
      urgency = 'high';
      statusText = `${Math.abs(daysUntilDue)} days overdue`;
    } else if (daysUntilDue <= 3) {
      urgency = 'medium';
      statusText = `Due in ${daysUntilDue} days`;
    } else {
      urgency = 'low';
      statusText = `Due in ${daysUntilDue} days`;
    }
    
    return { daysUntilDue, urgency, statusText };
  }, [data?.group?.nextPayoutDate]);

  const handleJoin = () => {
    joinMutation.mutate({ groupId });
  };

  const handlePay = () => {
    toast.success("Opening payment flow...");
  };

  const handleInvite = () => {
    toast.info("Invite functionality coming soon!");
  };

  const handleManage = () => {
    toast.info("Group management coming soon!");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view group details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Group Not Found</CardTitle>
            <CardDescription>
              The group you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/groups">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Browse Groups
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { group, members, contributions, payouts } = data;
  const stats = groupStats!;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Bitcoin className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/groups">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Group Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-orange-900 mb-2">{group.name}</h2>
              <p className="text-gray-600 mb-3">{group.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {group.frequency} contributions
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats.membersCount} members
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Random winner selection
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={group.status === "active" ? "default" : "secondary"}
                className={`${group.status === "active" ? "bg-green-600" : ""} text-lg px-4 py-1`}
              >
                {group.status}
              </Badge>
              {stats.isMember && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleInvite}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleManage}>
                      Manage Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Urgency Banner */}
        {dueDateInfo && (
          <Alert className={`mb-6 ${
            dueDateInfo.urgency === 'high' ? 'border-red-200 bg-red-50' :
            dueDateInfo.urgency === 'medium' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-semibold">
              {dueDateInfo.statusText} • {stats.overdueCount} members still need to contribute
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Contribution
                  </CardDescription>
                  <CardTitle className="text-2xl text-orange-900">
                    {group.contributionAmount.toLocaleString()} sats
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </CardDescription>
                  <CardTitle className="text-2xl text-orange-900">
                    {stats.membersCount}/{group.maxMembers}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Pool
                  </CardDescription>
                  <CardTitle className="text-2xl text-orange-900">
                    {stats.totalContributed.toLocaleString()} sats
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Payment Progress */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Payment Progress - Cycle {group.currentCycle}
                </CardTitle>
                <CardDescription>
                  {stats.paidThisCycle} of {stats.membersCount} members have contributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={stats.paymentProgress} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {stats.paidThisCycle} paid
                    </span>
                    <span className="text-gray-600">
                      {stats.overdueCount} remaining
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Lightning Integration Info */}
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      Lightning Network Integration
                    </CardTitle>
                    <CardDescription>
                      This group uses Bitcoin Lightning for instant, low-fee transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Multi-Sig Address:</span>
                      <code className="bg-white px-2 py-1 rounded text-xs">
                        {group.multiSigAddress || "Pending setup..."}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Cycle:</span>
                      <span className="font-semibold">Cycle {group.currentCycle}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Next Payout:</span>
                      <span className="font-semibold">
                        {group.nextPayoutDate 
                          ? new Date(group.nextPayoutDate).toLocaleDateString()
                          : "TBD"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-semibold capitalize">{group.frequency}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Multi-Signature Wallet */}
                <MultiSigWallet groupId={groupId} />

                {/* Payout Management */}
                <PayoutManager groupId={groupId} />
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Group Members</CardTitle>
                    <CardDescription>
                      Members sorted by payment status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {members.map((member: any, index: number) => {
                        const hasPaid = contributions.some((c: any) => 
                          c.userId === member.userId && 
                          c.status === "confirmed" && 
                          c.cycle === group.currentCycle
                        );
                        
                        return (
                          <div 
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-orange-100 text-orange-600">
                                  {index + 1}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">
                                  {member.userId === user?.id ? "You" : `Member ${index + 1}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {member.userId === user?.id ? "Admin" : "Member"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasPaid ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Paid
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Due
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Contributions</CardTitle>
                    <CardDescription>
                      Latest payments to this tontine group
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contributions.length > 0 ? (
                      <div className="space-y-3">
                        {contributions.slice(0, 10).map((contribution: any) => (
                          <div 
                            key={contribution.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                contribution.status === "confirmed" 
                                  ? "bg-green-100" 
                                  : "bg-yellow-100"
                              }`}>
                                {contribution.status === "confirmed" ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {contribution.amount.toLocaleString()} sats
                                </div>
                                <div className="text-xs text-gray-500">
                                  Cycle {contribution.cycle}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="text-gray-600">
                                {new Date(contribution.createdAt!).toLocaleDateString()}
                              </div>
                              {contribution.txHash && (
                                <div className="text-xs text-gray-400 font-mono">
                                  {contribution.txHash.slice(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No contributions yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>
                      Previous cycles and winners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payouts.length > 0 ? (
                      <div className="space-y-3">
                        {payouts.map((payout: any) => (
                          <div 
                            key={payout.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Trophy className="h-8 w-8 text-yellow-500" />
                              <div>
                                <div className="font-semibold">
                                  Cycle {payout.cycle} Winner
                                </div>
                                <div className="text-sm text-gray-500">
                                  {payout.amount.toLocaleString()} sats
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="text-gray-600">
                                {new Date(payout.createdAt!).toLocaleDateString()}
                              </div>
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Completed
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No payout history yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join or Contribute */}
            {!stats.isMember ? (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle>Join This Group</CardTitle>
                  <CardDescription>
                    Become a member and start saving together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleJoin}
                    disabled={joinMutation.isPending || group.currentMembers >= group.maxMembers}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {joinMutation.isPending ? "Joining..." : "Join Group"}
                  </Button>
                  {group.currentMembers >= group.maxMembers && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      Group is full
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Lightning Payment
                  </CardTitle>
                  <CardDescription>
                    Pay via Lightning Network with QR code scanning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentFlow
                    groupId={groupId}
                    amount={group.contributionAmount}
                    memo={`Tontine contribution - ${group.name}`}
                    onPaymentComplete={(invoice) => {
                      toast.success("Payment completed!");
                      refetch();
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleInvite}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Members
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleManage}>
                  <MoreVertical className="mr-2 h-4 w-4" />
                  Manage Group
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Send className="mr-2 h-4 w-4" />
                  Share Group
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}