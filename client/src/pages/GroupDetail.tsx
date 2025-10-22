import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, Calendar, Coins, ArrowLeft, Bitcoin, 
  CheckCircle, Clock, TrendingUp, Zap 
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";

export default function GroupDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/groups/:id");
  const groupId = params?.id || "";
  
  const [contributionAmount, setContributionAmount] = useState("");
  
  const { data, isLoading, refetch } = trpc.tontine.getGroup.useQuery(
    { id: groupId },
    { enabled: !!groupId }
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

  const contributeMutation = trpc.tontine.contribute.useMutation({
    onSuccess: () => {
      toast.success("Contribution successful!");
      setContributionAmount("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to contribute");
    },
  });

  const handleJoin = () => {
    joinMutation.mutate({ groupId });
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(contributionAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    contributeMutation.mutate({
      groupId,
      amount,
    });
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
  const isMember = members.some((m: any) => m.userId === user?.id);
  const totalContributed = contributions
    .filter((c: any) => c.status === "confirmed")
    .reduce((sum: number, c: any) => sum + c.amount, 0);

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
            <div>
              <h2 className="text-4xl font-bold text-orange-900 mb-2">{group.name}</h2>
              <p className="text-gray-600">{group.description}</p>
            </div>
            <Badge 
              variant={group.status === "active" ? "default" : "secondary"}
              className={`${group.status === "active" ? "bg-green-600" : ""} text-lg px-4 py-1`}
            >
              {group.status}
            </Badge>
          </div>
        </div>

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
                    {group.currentMembers}/{group.maxMembers}
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
                    {totalContributed.toLocaleString()} sats
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Blockchain Info */}
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

            {/* Recent Contributions */}
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
                    {contributions.slice(0, 5).map((contribution: any) => (
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join or Contribute */}
            {!isMember ? (
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
                  <CardTitle>Make Contribution</CardTitle>
                  <CardDescription>
                    Pay via Lightning Network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContribute} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (satoshis)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder={group.contributionAmount.toString()}
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        min="1"
                      />
                      <p className="text-xs text-gray-500">
                        Suggested: {group.contributionAmount.toLocaleString()} sats
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={contributeMutation.isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {contributeMutation.isPending ? "Processing..." : "Pay with Lightning"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map((member: any, index: number) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm">
                          {member.userId === user?.id ? "You" : `Member ${index + 1}`}
                        </span>
                      </div>
                      {member.hasReceivedPayout && (
                        <Badge variant="secondary" className="text-xs">
                          Paid
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

