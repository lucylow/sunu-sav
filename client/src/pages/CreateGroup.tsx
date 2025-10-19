import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Bitcoin, ArrowLeft } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function CreateGroup() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [maxMembers, setMaxMembers] = useState("");

  const createMutation = trpc.tontine.create.useMutation({
    onSuccess: (data) => {
      toast.success("Group created successfully!");
      setLocation(`/groups/${data?.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !contributionAmount || !maxMembers) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseInt(contributionAmount);
    const members = parseInt(maxMembers);

    if (amount <= 0 || members < 2 || members > 50) {
      toast.error("Please enter valid values");
      return;
    }

    createMutation.mutate({
      name,
      description,
      contributionAmount: amount,
      frequency,
      maxMembers: members,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to create a tontine group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Sign In
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create Tontine Group</CardTitle>
            <CardDescription>
              Set up a new community savings circle with Bitcoin Lightning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Market Women Savings Circle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this group..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Contribution Amount (satoshis) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 10000"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  min="1"
                  required
                />
                <p className="text-sm text-gray-500">
                  Amount each member contributes per cycle
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Payment Frequency *</Label>
                <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members *</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="e.g., 10"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  min="2"
                  max="50"
                  required
                />
                <p className="text-sm text-gray-500">
                  Between 2 and 50 members
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">How It Works</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Members contribute the set amount each cycle</li>
                  <li>• One member receives the full pot each cycle</li>
                  <li>• Rotation continues until everyone has received a payout</li>
                  <li>• Funds are secured with multi-signature Bitcoin wallets</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

