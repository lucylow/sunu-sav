import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView
} from 'react-native';
import { parseLightningPayload } from '../utils/lightning';
import { payBolt11, queuePendingPayment } from '../services/lightningService';
import I18n from '../i18n';
// Note: NetInfo would be imported here for network monitoring
// For now, we'll assume online status

export default function QrScannerScreen({ navigation }) {
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    // Note: In a real implementation, you would monitor network connectivity here
    // For now, we'll assume the device is online
    setIsOnline(true);
  }, []);

  const provideFeedback = useCallback(() => {
    // Haptic feedback and vibration
    if (Platform.OS === 'ios') {
      Vibration.vibrate(100);
    } else {
      Vibration.vibrate(120);
    }
  }, []);

  const handleManualInput = useCallback(async () => {
    if (!manualInput.trim() || isProcessing) return;
    
    setScanned(true);
    provideFeedback();

    try {
      // Parse the input data
      const parsed = parseLightningPayload(manualInput.trim());
      
      if (parsed.type === 'bolt11') {
        // Handle BOLT11 invoice
        await handleBolt11Payment(parsed);
      } else if (parsed.type === 'lnurl') {
        // Handle LNURL (simplified - would need more complex flow)
        Alert.alert(
          I18n.t('lnurl_detected'),
          I18n.t('lnurl_not_supported_yet'),
          [{ text: I18n.t('ok'), onPress: () => setScanned(false) }]
        );
      } else {
        // Unknown format
        Alert.alert(
          I18n.t('invalid_qr'),
          I18n.t('please_scan_lightning_invoice'),
          [{ text: I18n.t('ok'), onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Input processing error:', error);
      Alert.alert(
        I18n.t('scan_error'),
        error.message || I18n.t('unknown_error'),
        [{ text: I18n.t('ok'), onPress: () => setScanned(false) }]
      );
    }
  }, [manualInput, isProcessing]);

  const handleBolt11Payment = async (parsed) => {
    setIsProcessing(true);
    
    try {
      if (!isOnline) {
        // Queue payment for when back online
        const paymentId = await queuePendingPayment({
          type: 'bolt11',
          invoice: parsed.invoice,
          amount: parsed.amountSats
        });
        
        Alert.alert(
          I18n.t('offline_mode'),
          I18n.t('payment_queued_offline'),
          [
            { 
              text: I18n.t('ok'), 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        // Process payment immediately
        const result = await payBolt11(parsed.invoice);
        
        if (result.success) {
          Alert.alert(
            I18n.t('payment_success'),
            I18n.t('payment_completed_successfully'),
            [
              { 
                text: I18n.t('ok'), 
                onPress: () => navigation.goBack() 
              }
            ]
          );
        } else {
          throw new Error(result.error || I18n.t('payment_failed'));
        }
      }
    } catch (error) {
      Alert.alert(
        I18n.t('payment_error'),
        error.message || I18n.t('payment_failed'),
        [
          { 
            text: I18n.t('retry'), 
            onPress: () => setScanned(false) 
          },
          { 
            text: I18n.t('cancel'), 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
    setManualInput('');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{I18n.t('lightning_payment')}</Text>
        <Text style={styles.subtitle}>{I18n.t('enter_lightning_invoice')}</Text>
      </View>

      {/* Manual Input Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{I18n.t('lightning_invoice')}</Text>
        <TextInput
          style={styles.input}
          placeholder={I18n.t('paste_invoice_here')}
          value={manualInput}
          onChangeText={setManualInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isProcessing}
        />
        
        <TouchableOpacity
          style={[
            styles.processButton,
            (!manualInput.trim() || isProcessing) && styles.processButtonDisabled
          ]}
          onPress={handleManualInput}
          disabled={!manualInput.trim() || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.processButtonText}>
              {I18n.t('process_payment')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>{I18n.t('how_to_pay')}</Text>
        <Text style={styles.instructionText}>
          • {I18n.t('copy_lightning_invoice')}
        </Text>
        <Text style={styles.instructionText}>
          • {I18n.t('paste_invoice_above')}
        </Text>
        <Text style={styles.instructionText}>
          • {I18n.t('tap_process_payment')}
        </Text>
        <Text style={styles.instructionText}>
          • {I18n.t('confirm_payment_details')}
        </Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={resetScanner}
          disabled={isProcessing}
        >
          <Text style={styles.controlButtonText}>
            {I18n.t('reset')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.controlButtonText}>
            {I18n.t('cancel')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            {I18n.t('offline_mode')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    backgroundColor: '#F8F8F8',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  processButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  processButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  controlButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  controlButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineIndicator: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
