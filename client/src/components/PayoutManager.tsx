import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { 
  Calendar, 
  Users, 
  Coins, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Trophy,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PayoutManagerProps {
  groupId: string;
}

export default function PayoutManager({ groupId }: PayoutManagerProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data: payoutHistory, refetch: refetchHistory } = trpc.payout.getHistory.useQuery(
    { groupId }
  );

  const { data: upcomingPayouts, refetch: refetchUpcoming } = trpc.payout.getUpcoming.useQuery();

  // Mutations
  const schedulePayoutMutation = trpc.payout.schedule.useMutation({
    onSuccess: () => {
      toast.success("Payout scheduled successfully!");
      refetchUpcoming();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to schedule payout");
    },
  });

  const selectWinnerMutation = trpc.payout.selectWinner.useMutation({
    onSuccess: (result) => {
      toast.success(`Winner selected: ${result.winnerId}`);
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to select winner");
    },
  });

  const processPayoutMutation = trpc.payout.process.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Payout processed successfully!");
        setIsProcessing(false);
        refetchHistory();
        refetchUpcoming();
      } else {
        toast.error(result.error || "Payout processing failed");
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process payout");
      setIsProcessing(false);
    },
  });

  const autoScheduleMutation = trpc.payout.autoSchedule.useMutation({
    onSuccess: () => {
      toast.success("Next payout auto-scheduled!");
      refetchUpcoming();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to auto-schedule payout");
    },
  });

  const handleSchedulePayout = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    schedulePayoutMutation.mutate({
      groupId,
      cycle: 1, // This would be dynamic in a real implementation
      scheduledDate: nextWeek.toISOString(),
    });
  };

  const handleSelectWinner = () => {
    selectWinnerMutation.mutate({
      groupId,
      cycle: 1, // This would be dynamic in a real implementation
    });
  };

  const handleProcessPayout = () => {
    if (!user) return;
    
    setIsProcessing(true);
    processPayoutMutation.mutate({
      groupId,
      cycle: 1, // This would be dynamic in a real implementation
      winnerId: user.id, // In real implementation, this would be the selected winner
    });
  };

  const handleAutoSchedule = () => {
    autoScheduleMutation.mutate({ groupId });
  };

  const formatAmount = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Payout Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Payout Management
          </CardTitle>
          <CardDescription>
            Manage automated payouts and winner selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleSchedulePayout}
              disabled={schedulePayoutMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {schedulePayoutMutation.isPending ? "Scheduling..." : "Schedule Payout"}
            </Button>

            <Button
              onClick={handleAutoSchedule}
              disabled={autoScheduleMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {autoScheduleMutation.isPending ? "Scheduling..." : "Auto-Schedule"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleSelectWinner}
              disabled={selectWinnerMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              {selectWinnerMutation.isPending ? "Selecting..." : "Select Winner"}
            </Button>

            <Button
              onClick={handleProcessPayout}
              disabled={isProcessing || processPayoutMutation.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4" />
              {isProcessing ? "Processing..." : "Process Payout"}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Automated Payout Process:</strong> The system automatically selects winners, 
              creates Lightning invoices, and processes payments through multi-signature wallets.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upcoming Payouts */}
      {upcomingPayouts && upcomingPayouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Payouts
            </CardTitle>
            <CardDescription>
              Scheduled payouts across all groups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPayouts.map((payout) => (
              <div key={payout.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">{formatAmount(payout.amount)}</div>
                    <div className="text-sm text-gray-600">Cycle {payout.cycle}</div>
                  </div>
                  <Badge className={getStatusColor(payout.status)}>
                    {payout.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Scheduled: {formatDate(payout.scheduledDate.toString())}
                </div>
                {payout.winnerId && (
                  <div className="text-sm text-green-600">
                    Winner: {payout.winnerId}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Payout History
          </CardTitle>
          <CardDescription>
            Completed payouts for this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutHistory && payoutHistory.length > 0 ? (
            <div className="space-y-4">
              {payoutHistory.map((payout) => (
                <div key={payout.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">{formatAmount(payout.amount)}</div>
                      <div className="text-sm text-gray-600">Cycle {payout.cycle}</div>
                    </div>
                    <Badge className={getStatusColor(payout.status)}>
                      {payout.status.toUpperCase()}
                    </Badge>
                  </div>

                  {payout.profiles && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Winner:</div>
                      <div className="font-semibold">{payout.profiles.name}</div>
                      <div className="text-xs text-gray-500">{payout.profiles.email}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Scheduled:</span>
                      <div>{formatDate(payout.scheduled_date)}</div>
                    </div>
                    {payout.completed_at && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <div>{formatDate(payout.completed_at)}</div>
                      </div>
                    )}
                  </div>

                  {payout.txid && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Transaction ID:</div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payout.txid}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payout history yet</p>
              <p className="text-sm">Payouts will appear here once processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> Payouts are simulated for demonstration purposes. 
            In production, this would integrate with real Lightning nodes and Bitcoin transactions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
