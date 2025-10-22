import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import I18n from '../i18n';
import HelpStep from '../components/HelpStep';
import { useStore } from '../store/useStore';

export default function PaymentScreen({ route, navigation }) {
  const { invoice, amount, tontineId, tontine, optimistic } = route.params;
  const [paymentStatus, setPaymentStatus] = useState(optimistic ? 'processing' : 'pending');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);
  
  const updateTontinePayment = useStore((state) => state.updateTontinePayment);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (paymentStatus === 'pending') {
            setPaymentStatus('expired');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus]);

  // Handle optimistic payment processing
  useEffect(() => {
    if (optimistic && paymentStatus === 'processing') {
      processPayment();
    }
  }, [optimistic]);

  const processPayment = useCallback(async () => {
    try {
      // Simulate payment processing with optimistic update
      setPaymentStatus('processing');
      
      // Update local state optimistically
      if (tontine) {
        updateTontinePayment(tontine.id, { 
          status: 'paid', 
          paymentDate: new Date().toISOString(),
          optimistic: true 
        });
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure (in real app, this would be actual API response)
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        setPaymentStatus('success');
        // Animate success
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0.3, duration: 200 }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200 })
        ]).start();
        
        // Navigate back after success
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      setPaymentStatus('failed');
      setError(err.message);
      
      // Revert optimistic update
      if (tontine) {
        updateTontinePayment(tontine.id, { 
          status: 'pending', 
          optimistic: false 
        });
      }
    }
  }, [tontine, updateTontinePayment, navigation]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setError(null);
    
    try {
      await processPayment();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRetrying(false);
    }
  }, [processPayment]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShareInvoice = async () => {
    try {
      await Share.share({
        message: `Invoice Lightning: ${invoice}`,
        title: 'Invoice Tontine Bitcoin'
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
  };

  const handleCopyInvoice = () => {
    // Implementation for copying to clipboard
    Alert.alert('Succès', 'Facture copiée dans le presse-papier');
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#34C759" />
            <Text style={styles.statusText}>
              {I18n.t('processing_payment')}
            </Text>
            <Text style={styles.statusSubtext}>
              {I18n.t('please_wait')}
            </Text>
          </View>
        );
      
      case 'success':
        return (
          <Animated.View style={[styles.statusContainer, { opacity: fadeAnim }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>
              {I18n.t('payment_success')}
            </Text>
            <Text style={styles.statusSubtext}>
              {I18n.t('returning_to_home')}
            </Text>
          </Animated.View>
        );
      
      case 'failed':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>
              {I18n.t('payment_failed')}
            </Text>
            {error && (
              <Text style={styles.errorSubtext}>
                {error}
              </Text>
            )}
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.retryButtonText}>
                  {I18n.t('retry')} ({retryCount}/3)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      
      case 'expired':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.errorIcon}>⏰</Text>
            <Text style={styles.errorText}>
              {I18n.t('invoice_expired')}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>
                {I18n.t('back')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      
      default: // pending
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {I18n.t('waiting_payment')}
            </Text>
            <Text style={styles.statusSubtext}>
              {I18n.t('scan_qr')}
            </Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.amount}>{amount} sats</Text>
        <Text style={styles.equivalent}>
          ≈ {Math.round(amount * 0.0003)} FCFA
        </Text>
      </View>

      {/* Timer - only show for pending payments */}
      {paymentStatus === 'pending' && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>{I18n.t('time_remaining')}</Text>
          <Text style={[
            styles.timer,
            timeLeft < 60 && styles.timerWarning
          ]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      )}

      {/* QR Code - hide during processing/success */}
      {paymentStatus === 'pending' && (
        <View style={styles.qrContainer}>
          <QRCode
            value={invoice}
            size={200}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
        </View>
      )}

      {/* Invoice Details - hide during processing/success */}
      {paymentStatus === 'pending' && (
        <View style={styles.invoiceContainer}>
          <Text style={styles.invoiceLabel}>{I18n.t('lightning_invoice')}</Text>
          <Text style={styles.invoiceText} selectable>
            {invoice}
          </Text>
        </View>
      )}

      {/* Action Buttons - only for pending */}
      {paymentStatus === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCopyInvoice}
          >
            <Text style={styles.secondaryButtonText}>{I18n.t('copy')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleShareInvoice}
          >
            <Text style={styles.secondaryButtonText}>{I18n.t('share')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Status */}
      {renderPaymentStatus()}

      {/* Help Section - only for pending */}
      {paymentStatus === 'pending' && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>{I18n.t('how_to_pay')}</Text>
          <HelpStep step="1" text={I18n.t('step_1')} />
          <HelpStep step="2" text={I18n.t('step_2')} />
          <HelpStep step="3" text={I18n.t('step_3')} />
          <HelpStep step="4" text={I18n.t('step_4')} />
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  equivalent: {
    fontSize: 16,
    color: '#666666',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  timerLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  timer: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  timerWarning: {
    color: '#FF3B30',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  invoiceContainer: {
    padding: 20,
    backgroundColor: '#F8F8F8',
    margin: 20,
    borderRadius: 12,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  invoiceText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  helpContainer: {
    padding: 20,
    marginTop: 20,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
