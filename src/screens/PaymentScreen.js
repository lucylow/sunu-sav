import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import I18n from '../i18n';
import HelpStep from '../components/HelpStep';

export default function PaymentScreen({ route, navigation }) {
  const { invoice, amount, tontineId } = route.params;
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.amount}>{amount} sats</Text>
        <Text style={styles.equivalent}>
          ≈ {Math.round(amount * 0.0003)} FCFA
        </Text>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>{I18n.t('time_remaining')}</Text>
        <Text style={[
          styles.timer,
          timeLeft < 60 && styles.timerWarning
        ]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <QRCode
          value={invoice}
          size={200}
          backgroundColor="#FFFFFF"
          color="#000000"
        />
      </View>

      {/* Invoice Details */}
      <View style={styles.invoiceContainer}>
        <Text style={styles.invoiceLabel}>{I18n.t('lightning_invoice')}</Text>
        <Text style={styles.invoiceText} selectable>
          {invoice}
        </Text>
      </View>

      {/* Action Buttons */}
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

      {/* Payment Status */}
      {paymentStatus === 'pending' && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {I18n.t('waiting_payment')}
          </Text>
          <Text style={styles.statusSubtext}>
            {I18n.t('scan_qr')}
          </Text>
        </View>
      )}

      {/* Help Section */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>{I18n.t('how_to_pay')}</Text>
        <HelpStep step="1" text={I18n.t('step_1')} />
        <HelpStep step="2" text={I18n.t('step_2')} />
        <HelpStep step="3" text={I18n.t('step_3')} />
        <HelpStep step="4" text={I18n.t('step_4')} />
      </View>
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
});
