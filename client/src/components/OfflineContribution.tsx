// client/src/components/OfflineContribution.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView 
} from 'react-native';
import { offlineApi } from '../services/offline/offlineApi';
import { OfflineIndicator } from './OfflineIndicator';
import { useNetworkQuality } from '../services/offline/networkMonitor';

interface OfflineContributionProps {
  groupId: string;
  groupName: string;
  suggestedAmount?: number;
  onSuccess?: () => void;
}

export function OfflineContribution({ 
  groupId, 
  groupName, 
  suggestedAmount = 10000,
  onSuccess 
}: OfflineContributionProps) {
  const [amount, setAmount] = useState(suggestedAmount.toString());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isOnline, quality } = useNetworkQuality();

  const handleSubmit = async () => {
    const amountNumber = parseInt(amount);
    
    if (!amountNumber || amountNumber <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);

    try {
      const result = await offlineApi.contribute(
        groupId,
        amountNumber,
        note || undefined
      );

      if (result.pending) {
        Alert.alert(
          '✅ Contribution Queued!',
          'Your contribution will be submitted when you have internet connection.',
          [
            {
              text: 'OK',
              onPress: () => {
                setAmount(suggestedAmount.toString());
                setNote('');
                onSuccess?.();
              }
            }
          ]
        );
      } else {
        Alert.alert('✅ Contribution Successful!', 'Your contribution has been recorded.');
        setAmount(suggestedAmount.toString());
        setNote('');
        onSuccess?.();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (submitting) return 'Processing...';
    if (!isOnline) return 'Queue Contribution';
    if (quality === 'poor') return 'Contribute (Slow Connection)';
    return 'Contribute Now';
  };

  const getButtonColor = () => {
    if (!isOnline || quality === 'poor') return '#F59E0B'; // yellow
    return '#F97316'; // orange
  };

  return (
    <ScrollView style={styles.container}>
      <OfflineIndicator />
      
      <View style={styles.header}>
        <Text style={styles.title}>Make Contribution</Text>
        <Text style={styles.subtitle}>{groupName}</Text>
      </View>

      {!isOnline && (
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineText}>
            📱 You're offline. Your contribution will be queued and submitted when connection returns.
          </Text>
        </View>
      )}

      {quality === 'poor' && (
        <View style={styles.poorConnectionNotice}>
          <Text style={styles.poorConnectionText}>
            ⚠️ Slow connection detected. Contribution will be queued for reliable sync.
          </Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (satoshis)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="10000"
            editable={!submitting}
          />
          <Text style={styles.hint}>
            Suggested: {suggestedAmount.toLocaleString()} sats
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Weekly contribution"
            multiline
            numberOfLines={3}
            editable={!submitting}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: getButtonColor() }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • Your contribution is securely stored locally
        </Text>
        <Text style={styles.infoText}>
          • It will sync automatically when online
        </Text>
        <Text style={styles.infoText}>
          • You'll receive confirmation when synced
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  offlineNotice: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  offlineText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  poorConnectionNotice: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  poorConnectionText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});
