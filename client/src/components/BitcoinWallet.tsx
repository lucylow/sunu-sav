// client/src/components/BitcoinWallet.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Keystore, WalletData } from '../services/wallet/keystore';
import { walletService, BalanceInfo, WalletService } from '../services/wallet/walletService';
import { useNetworkQuality } from '../services/offline/networkMonitor';
import { OfflineIndicator } from './OfflineIndicator';

interface BitcoinWalletProps {
  onWalletCreated?: (address: string) => void;
  onWalletRestored?: (address: string) => void;
}

export function BitcoinWallet({ onWalletCreated, onWalletRestored }: BitcoinWalletProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState<BalanceInfo>({ confirmed: 0, unconfirmed: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showMnemonicModal, setShowMnemonicModal] = useState(false);
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const { isOnline } = useNetworkQuality();

  useEffect(() => {
    checkExistingWallet();
  }, []);

  useEffect(() => {
    if (wallet) {
      loadBalance();
      const interval = setInterval(loadBalance, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [wallet]);

  const checkExistingWallet = async () => {
    try {
      const hasWallet = await Keystore.hasStoredWallet();
      if (hasWallet) {
        // Wallet exists, but we need password to unlock
        setShowRestoreModal(true);
      }
    } catch (error) {
      console.error('[BitcoinWallet] Error checking existing wallet:', error);
    }
  };

  const loadBalance = async () => {
    if (!wallet) return;

    try {
      const balanceInfo = await walletService.getBalance(wallet.address);
      setBalance(balanceInfo);
    } catch (error) {
      console.error('[BitcoinWallet] Error loading balance:', error);
    }
  };

  const handleCreateWallet = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await Keystore.createAndStoreWallet(password);
      const walletData = Keystore.restoreWallet(result.mnemonic);
      setWallet(walletData);
      setMnemonicWords(result.mnemonic.split(' '));
      setShowCreateModal(false);
      setShowMnemonicModal(true);
      setPassword('');
      onWalletCreated?.(result.address);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreWallet = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const walletData = await Keystore.unlockWallet(password);
      setWallet(walletData);
      setShowRestoreModal(false);
      setPassword('');
      onWalletRestored?.(walletData.address);
    } catch (error: any) {
      Alert.alert('Error', 'Invalid password or corrupted wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromMnemonic = async () => {
    if (!mnemonic.trim()) {
      Alert.alert('Error', 'Please enter your recovery phrase');
      return;
    }

    if (!Keystore.validateMnemonic(mnemonic)) {
      Alert.alert('Error', 'Invalid recovery phrase');
      return;
    }

    setLoading(true);
    try {
      const walletData = Keystore.restoreWallet(mnemonic);
      setWallet(walletData);
      setShowRestoreModal(false);
      setMnemonic('');
      onWalletRestored?.(walletData.address);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to restore wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBitcoin = async () => {
    if (!wallet) return;

    const amount = parseInt(sendAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!Keystore.validateAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    if (amount > balance.total) {
      Alert.alert('Error', 'Insufficient funds');
      return;
    }

    setLoading(true);
    try {
      const result = await walletService.sendBitcoin(wallet, recipientAddress, amount);
      
      Alert.alert(
        'Transaction Sent!',
        `Transaction ID: ${result.txid}\nFee: ${WalletService.formatAmount(result.fee)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowSendModal(false);
              setRecipientAddress('');
              setSendAmount('');
              loadBalance(); // Refresh balance
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need your password to access your wallet again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setWallet(null);
            setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
          }
        }
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    // In a real app, you would use Clipboard from @react-native-clipboard/clipboard
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <OfflineIndicator />
        <ScrollView contentContainerStyle={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>SunuSàv Bitcoin Wallet</Text>
          <Text style={styles.welcomeSubtitle}>
            Secure, non-custodial Bitcoin wallet for Senegal
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.primaryButtonText}>Create New Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowRestoreModal(true)}
            >
              <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Features:</Text>
            <Text style={styles.infoText}>🔐 Secure key management</Text>
            <Text style={styles.infoText}>⚡ Lightning Network ready</Text>
            <Text style={styles.infoText}>📱 Offline-first design</Text>
            <Text style={styles.infoText}>🌍 Built for Senegal</Text>
          </View>
        </ScrollView>

        {/* Create Wallet Modal */}
        <Modal visible={showCreateModal} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Choose a strong password to encrypt your wallet
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter password (min 8 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={handleCreateWallet}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create Wallet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Restore Wallet Modal */}
        <Modal visible={showRestoreModal} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Restore Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Enter your password or recovery phrase
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.orText}>OR</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter 12-word recovery phrase"
              value={mnemonic}
              onChangeText={setMnemonic}
              multiline
              numberOfLines={3}
              autoCapitalize="none"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRestoreModal(false);
                  setPassword('');
                  setMnemonic('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={mnemonic.trim() ? handleRestoreFromMnemonic : handleRestoreWallet}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Restore</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Show Mnemonic Modal */}
        <Modal visible={showMnemonicModal} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Backup Your Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Write down these 12 words in order. Store them safely offline.
            </Text>

            <View style={styles.mnemonicContainer}>
              {mnemonicWords.map((word, index) => (
                <View key={index} style={styles.mnemonicWord}>
                  <Text style={styles.mnemonicNumber}>{index + 1}</Text>
                  <Text style={styles.mnemonicText}>{word}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowMnemonicModal(false)}
            >
              <Text style={styles.confirmButtonText}>I've Backed It Up</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <ScrollView contentContainerStyle={styles.walletContainer}>
        {/* Wallet Header */}
        <View style={styles.walletHeader}>
          <Text style={styles.walletTitle}>Bitcoin Wallet</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {WalletService.formatAmount(balance.total)}
          </Text>
          <Text style={styles.balanceSubtext}>
            Confirmed: {WalletService.formatAmount(balance.confirmed)}
          </Text>
          {balance.unconfirmed > 0 && (
            <Text style={styles.balanceSubtext}>
              Pending: {WalletService.formatAmount(balance.unconfirmed)}
            </Text>
          )}
        </View>

        {/* Address Card */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Receive Address</Text>
          <Text style={styles.addressText}>{wallet.address}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(wallet.address)}
          >
            <Text style={styles.copyButtonText}>Copy Address</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowSendModal(true)}
            disabled={balance.total === 0}
          >
            <Text style={styles.actionButtonText}>Send Bitcoin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={loadBalance}
            disabled={!isOnline}
          >
            <Text style={styles.actionButtonText}>Refresh Balance</Text>
          </TouchableOpacity>
        </View>

        {/* Network Status */}
        {!isOnline && (
          <View style={styles.offlineNotice}>
            <Text style={styles.offlineText}>
              📱 Offline mode - Balance may not be current
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Send Bitcoin Modal */}
      <Modal visible={showSendModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Send Bitcoin</Text>

          <TextInput
            style={styles.input}
            placeholder="Recipient address"
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Amount (satoshis)"
            value={sendAmount}
            onChangeText={setSendAmount}
            keyboardType="numeric"
          />

          <Text style={styles.availableText}>
            Available: {WalletService.formatAmount(balance.total)}
          </Text>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowSendModal(false);
                setRecipientAddress('');
                setSendAmount('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={handleSendBitcoin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F97316',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F97316',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  walletContainer: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  addressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineNotice: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  offlineText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    padding: 16,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  orText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  mnemonicWord: {
    width: '48%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mnemonicNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
    minWidth: 20,
  },
  mnemonicText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  availableText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
});
