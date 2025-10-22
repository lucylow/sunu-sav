import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { 
  Shield, 
  Users, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface MultiSigWalletProps {
  groupId: string;
  walletId?: string;
}

export default function MultiSigWallet({ groupId, walletId }: MultiSigWalletProps) {
  const { user } = useAuth();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    toAddress: '',
    amount: 0,
  });

  // Queries
  const { data: wallet, refetch: refetchWallet } = trpc.multisig.getWallet.useQuery(
    { walletId: walletId || '' }
  );

  const { data: balance, refetch: refetchBalance } = trpc.multisig.getBalance.useQuery(
    { walletId: walletId || '' }
  );

  const { data: pendingTransactions, refetch: refetchTransactions } = trpc.multisig.getPendingTransactions.useQuery(
    { walletId: walletId || '' }
  );

  // Mutations
  const createWalletMutation = trpc.multisig.createWallet.useMutation({
    onSuccess: () => {
      toast.success("Multi-signature wallet created!");
      refetchWallet();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create wallet");
    },
  });

  const initiateTransactionMutation = trpc.multisig.initiateTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transaction initiated! Waiting for signatures.");
      setNewTransaction({ toAddress: '', amount: 0 });
      refetchTransactions();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate transaction");
    },
  });

  const signTransactionMutation = trpc.multisig.signTransaction.useMutation({
    onSuccess: (result) => {
      if (result.transactionComplete) {
        toast.success("Transaction completed!");
      } else {
        toast.success("Signature added! Waiting for more signatures.");
      }
      refetchTransactions();
      refetchBalance();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sign transaction");
    },
  });

  const handleCreateWallet = () => {
    if (!user) {
      toast.error("Please sign in to create a wallet");
      return;
    }

    // For demo, we'll use the current user and some mock member IDs
    const memberIds = [user.id, 'mock-user-1', 'mock-user-2'];
    
    createWalletMutation.mutate({
      groupId,
      memberIds,
      requiredSignatures: 2,
    });
  };

  const handleInitiateTransaction = () => {
    if (!walletId || !newTransaction.toAddress || !newTransaction.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    initiateTransactionMutation.mutate({
      walletId,
      toAddress: newTransaction.toAddress,
      amount: newTransaction.amount,
    });
  };

  const handleSignTransaction = (transactionId: string) => {
    // In a real implementation, this would generate a proper signature
    const mockSignature = `sig_${Date.now()}_${Math.random().toString(36)}`;
    
    signTransactionMutation.mutate({
      transactionId,
      signature: mockSignature,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatAmount = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Signature Wallet
          </CardTitle>
          <CardDescription>
            Create a secure multi-signature wallet for your tontine group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Multi-signature wallets require multiple approvals for transactions, 
                providing enhanced security for group funds.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Configuration</Label>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Required Signatures:</span>
                  <span className="font-semibold">2 of 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Group Members:</span>
                  <span className="font-semibold">3</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateWallet}
              disabled={createWalletMutation.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {createWalletMutation.isPending ? "Creating..." : "Create Multi-Sig Wallet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Signature Wallet
          </CardTitle>
          <CardDescription>
            Secure wallet requiring {wallet.requiredSignatures} of {wallet.publicKeys.length} signatures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Balance</Label>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(balance || 0)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Signatures Required</Label>
              <div className="text-2xl font-bold text-blue-600">
                {wallet.requiredSignatures}/{wallet.publicKeys.length}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                value={wallet.address}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(wallet.address)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Public Keys</Label>
            <div className="space-y-2">
              {wallet.publicKeys.map((key, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={key}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Transaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Initiate Transaction
          </CardTitle>
          <CardDescription>
            Create a new transaction that requires group approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toAddress">Recipient Address</Label>
            <Input
              id="toAddress"
              value={newTransaction.toAddress}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, toAddress: e.target.value }))}
              placeholder="bc1q..."
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (satoshis)</Label>
            <Input
              id="amount"
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="10000"
              min="1"
            />
            <p className="text-sm text-gray-500">
              {formatAmount(newTransaction.amount)}
            </p>
          </div>

          <Button
            onClick={handleInitiateTransaction}
            disabled={initiateTransactionMutation.isPending || !newTransaction.toAddress || !newTransaction.amount}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {initiateTransactionMutation.isPending ? "Initiating..." : "Initiate Transaction"}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Transactions */}
      {pendingTransactions && pendingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Transactions
            </CardTitle>
            <CardDescription>
              Transactions waiting for signatures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTransactions.map((tx) => (
              <div key={tx.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">{formatAmount(tx.amount)}</div>
                    <div className="text-sm text-gray-600 font-mono">{tx.to_address}</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    {tx.signatures_received}/{tx.signatures_needed} signatures
                  </Badge>
                </div>

                <div className="text-sm text-gray-500">
                  Created: {formatDate(tx.created_at)}
                </div>

                {tx.transaction_signatures && (
                  <div className="space-y-2">
                    <Label className="text-sm">Signatures</Label>
                    <div className="space-y-1">
                      {tx.transaction_signatures.map((sig: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-mono text-xs">{sig.signature.substring(0, 20)}...</span>
                          <span className="text-gray-500">{formatDate(sig.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleSignTransaction(tx.id)}
                  disabled={signTransactionMutation.isPending}
                  size="sm"
                  className="w-full"
                >
                  {signTransactionMutation.isPending ? "Signing..." : "Sign Transaction"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Multi-signature wallets provide enhanced security 
          by requiring multiple approvals for transactions. Keep your private keys secure 
          and never share them with others.
        </AlertDescription>
      </Alert>
    </div>
  );
}
