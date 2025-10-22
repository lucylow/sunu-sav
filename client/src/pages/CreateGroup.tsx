import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bitcoin, ArrowLeft, ArrowRight, Users, Calendar, Coins, 
  Shield, Zap, CheckCircle, AlertTriangle, UserPlus, Phone
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";

interface CreateGroupStep {
  step: number;
  title: string;
  description: string;
}

const STEPS: CreateGroupStep[] = [
  {
    step: 1,
    title: "Basic Information",
    description: "Set up your group name and rules"
  },
  {
    step: 2,
    title: "Add Members",
    description: "Invite people to join your group"
  },
  {
    step: 3,
    title: "Confirm & Create",
    description: "Review and launch your group"
  }
];

export default function CreateGroup() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    frequency: "weekly" as "weekly" | "monthly" | "quarterly",
    maxMembers: "",
    inviteLater: false,
    members: [] as string[],
    memberPhones: "",
  });

  const createMutation = trpc.tontine.create.useMutation({
    onSuccess: (data) => {
      toast.success("Group created successfully!");
      setLocation(`/groups/${data?.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const validateStep1 = () => {
    return formData.name.trim() && 
           formData.contributionAmount && 
           parseInt(formData.contributionAmount) > 0 &&
           formData.maxMembers && 
           parseInt(formData.maxMembers) >= 2;
  };

  const validateStep2 = () => {
    if (formData.inviteLater) return true;
    return formData.members.length > 0 || formData.memberPhones.trim();
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep1()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseInt(formData.contributionAmount);
    const members = parseInt(formData.maxMembers);

    if (amount <= 0 || members < 2 || members > 50) {
      toast.error("Please enter valid values");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      contributionAmount: amount,
      frequency: formData.frequency,
      maxMembers: members,
    });
  };

  const addMemberFromPhones = () => {
    const phones = formData.memberPhones
      .split(/[,\n]/)
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);
    
    const validPhones = phones.filter(phone => {
      // Basic phone validation (Senegal format)
      return /^(\+221|221)?[0-9]{9}$/.test(phone.replace(/\s/g, ''));
    });

    if (validPhones.length === 0) {
      toast.error("Please enter valid phone numbers");
      return;
    }

    setFormData(prev => ({
      ...prev,
      members: [...prev.members, ...validPhones],
      memberPhones: ""
    }));

    toast.success(`Added ${validPhones.length} members`);
  };

  const removeMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  const formatAmount = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return freq;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
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
              Please sign in to create a tontine group.
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

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-orange-900">Create Tontine Group</h2>
            <Badge variant="outline" className="text-lg px-4 py-1">
              Step {currentStep} of 3
            </Badge>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  currentStep >= step.step 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.step ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step.step}</span>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-gray-500">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Market Women Savings Circle"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this group..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Contribution Amount (satoshis) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="10000"
                      value={formData.contributionAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, contributionAmount: e.target.value }))}
                      min="1"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      {formData.contributionAmount ? formatAmount(parseInt(formData.contributionAmount) || 0) : "Amount each member contributes per cycle"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Payment Frequency *</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Maximum Members *</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    placeholder="10"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: e.target.value }))}
                    min="2"
                    max="50"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Between 2 and 50 members
                  </p>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security:</strong> Your group will use multi-signature Bitcoin wallets 
                    for secure fund management. All transactions require multiple approvals.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Step 2: Add Members */}
            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="inviteLater"
                      checked={formData.inviteLater}
                      onChange={(e) => setFormData(prev => ({ ...prev, inviteLater: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="inviteLater">Create group and invite members later</Label>
                  </div>

                  {!formData.inviteLater && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="memberPhones">Add Members by Phone Number</Label>
                        <Textarea
                          id="memberPhones"
                          placeholder="Enter phone numbers separated by commas or new lines&#10;e.g., +221701234567, +221709876543"
                          value={formData.memberPhones}
                          onChange={(e) => setFormData(prev => ({ ...prev, memberPhones: e.target.value }))}
                          rows={4}
                        />
                        <p className="text-sm text-gray-500">
                          Enter Senegal phone numbers (+221 format)
                        </p>
                        <Button 
                          onClick={addMemberFromPhones}
                          disabled={!formData.memberPhones.trim()}
                          variant="outline"
                          size="sm"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Members
                        </Button>
                      </div>

                      {formData.members.length > 0 && (
                        <div className="space-y-2">
                          <Label>Added Members ({formData.members.length})</Label>
                          <div className="space-y-2">
                            {formData.members.map((member, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span className="font-mono text-sm">{member}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMember(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> You can always invite more members after creating the group. 
                    Members will receive SMS invitations with a link to join.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Step 3: Confirm & Create */}
            {currentStep === 3 && (
              <>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg">Group Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <div className="font-semibold">{formData.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Frequency:</span>
                        <div className="font-semibold">{getFrequencyText(formData.frequency)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Contribution:</span>
                        <div className="font-semibold">{formatAmount(parseInt(formData.contributionAmount))}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Members:</span>
                        <div className="font-semibold">{formData.maxMembers}</div>
                      </div>
                    </div>
                    {formData.description && (
                      <div>
                        <span className="text-gray-600">Description:</span>
                        <div className="font-semibold">{formData.description}</div>
                      </div>
                    )}
                  </div>

                  {!formData.inviteLater && formData.members.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">Members to Invite</h3>
                      <div className="space-y-1">
                        {formData.members.map((member, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="font-mono">{member}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Lightning Integration:</strong> Your group will be set up with Bitcoin Lightning Network 
                      for instant, low-fee payments. A multi-signature wallet will be created for secure fund management.
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !validateStep1()) ||
                    (currentStep === 2 && !validateStep2())
                  }
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !validateStep1()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {createMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}