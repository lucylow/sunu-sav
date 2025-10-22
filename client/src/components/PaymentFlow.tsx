import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bitcoin, 
  Zap, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Copy,
  QrCode,
  Smartphone,
  CreditCard,
  Globe,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface PaymentFlowProps {
  group: {
    id: string;
    name: string;
    contributionAmount: number;
    currentMembers: number;
    maxMembers: number;
    currentCycle: number;
    nextPayoutDate?: string;
  };
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function PaymentFlow({ group, onComplete, onCancel }: PaymentFlowProps) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'lightning' | 'mobile_money' | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  const steps = [
    { id: 1, title: "Payment Method", description: "Choose how to pay" },
    { id: 2, title: "Generate Invoice", description: "Create payment request" },
    { id: 3, title: "Make Payment", description: "Complete your contribution" },
    { id: 4, title: "Confirmation", description: "Payment verified" }
  ];

  const paymentMethods = [
    {
      id: 'lightning',
      name: 'Lightning Network',
      description: 'Fast Bitcoin payments',
      icon: Zap,
      color: 'orange',
      features: ['Instant', 'Low fees', 'Secure']
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'Wave, Orange Money, MTN',
      icon: Smartphone,
      color: 'blue',
      features: ['Local', 'Convenient', 'Cash-out']
    }
  ];

  const mockInvoice = "lnbc500u1p3alice123...";
  const mockQRCode = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==";

  const handlePaymentMethodSelect = (method: 'lightning' | 'mobile_money') => {
    setPaymentMethod(method);
    setStep(2);
  };

  const handleGenerateInvoice = () => {
    setShowInvoice(true);
    setStep(3);
  };

  const handlePaymentComplete = () => {
    setPaymentStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('completed');
      setStep(4);
      toast.success("Payment completed successfully!");
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStepColor = (stepId: number) => {
    if (stepId < step) return 'bg-emerald-500';
    if (stepId === step) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full w-fit">
            <Bitcoin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Make Payment</h1>
          <p className="text-gray-600">Complete your contribution to {group.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getStepColor(stepItem.id)}`}>
                    {stepItem.id < step ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      stepItem.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">{stepItem.title}</p>
                    <p className="text-xs text-gray-500">{stepItem.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div className={`h-full transition-all duration-300 ${stepItem.id < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-orange-50/30">
          <CardContent className="p-8">
            {/* Step 1: Payment Method Selection */}
            {step === 1 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">Choose Payment Method</CardTitle>
                  <CardDescription className="text-gray-600">
                    Select how you'd like to make your contribution
                  </CardDescription>
                </CardHeader>
                
                <div className="space-y-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const colorClasses = {
                      orange: 'from-orange-500 to-amber-500',
                      blue: 'from-blue-500 to-indigo-500'
                    };
                    
                    return (
                      <Card 
                        key={method.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-orange-200"
                        onClick={() => handlePaymentMethodSelect(method.id as 'lightning' | 'mobile_money')}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[method.color as keyof typeof colorClasses]} shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">{method.name}</h3>
                              <p className="text-gray-600 mb-2">{method.description}</p>
                              <div className="flex gap-2">
                                {method.features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Generate Invoice */}
            {step === 2 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">Generate Payment Invoice</CardTitle>
                  <CardDescription className="text-gray-600">
                    Create a secure payment request for your contribution
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  {/* Payment Summary */}
                  <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Group:</span>
                          <span className="font-semibold">{group.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cycle:</span>
                          <span className="font-semibold">{group.currentCycle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contribution:</span>
                          <span className="font-semibold">{group.contributionAmount.toLocaleString()} sats</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-semibold capitalize">{paymentMethod?.replace('_', ' ')}</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-orange-600">{group.contributionAmount.toLocaleString()} sats</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handleGenerateInvoice}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Invoice
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Make Payment */}
            {step === 3 && (
              <div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">Complete Payment</CardTitle>
                  <CardDescription className="text-gray-600">
                    Scan QR code or copy the payment request
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-xl shadow-lg border">
                      <img src={mockQRCode} alt="Payment QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Scan with your Lightning wallet</p>
                  </div>

                  {/* Payment Request */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Payment Request</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(mockInvoice)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-white p-3 rounded-lg border font-mono text-sm break-all">
                        {mockInvoice}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Info */}
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <div>
                          <h4 className="font-semibold text-emerald-900">Secure Payment</h4>
                          <p className="text-sm text-emerald-700">
                            Your payment is protected by Lightning Network security
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handlePaymentComplete}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    I've Made the Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="text-center">
                <CardHeader className="pb-6">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full w-fit">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Payment Successful!</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your contribution has been processed successfully
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
                  {/* Success Details */}
                  <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-bold text-emerald-600">{group.contributionAmount.toLocaleString()} sats</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Group:</span>
                          <span className="font-semibold">{group.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cycle:</span>
                          <span className="font-semibold">{group.currentCycle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Next Steps */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
                      <p className="text-sm text-blue-700">
                        Your payment has been recorded. You'll be notified when the cycle completes and the winner is selected.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={onCancel}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button 
                      onClick={onComplete}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      View Group
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}