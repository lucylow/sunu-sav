import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import I18n from '../i18n';

export default function InvoiceConfirmModal({ 
  visible, 
  invoice, 
  amountSats, 
  memo, 
  onClose, 
  onConfirm, 
  isLoading = false 
}) {
  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {I18n.t('confirm_payment')}
          </Text>
          
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {amountSats ? `${amountSats.toLocaleString()} sats` : I18n.t('amount_unknown')}
            </Text>
            {amountSats && (
              <Text style={styles.equivalent}>
                ≈ {Math.round(amountSats * 0.0003)} FCFA
              </Text>
            )}
          </View>
          
          {memo && (
            <View style={styles.memoContainer}>
              <Text style={styles.memoLabel}>{I18n.t('memo')}</Text>
              <Text style={styles.memo}>{memo}</Text>
            </View>
          )}
          
          <View style={styles.invoiceContainer}>
            <Text style={styles.invoiceLabel}>
              {I18n.t('lightning_invoice')}
            </Text>
            <Text style={styles.invoiceText} numberOfLines={2}>
              {invoice.slice(0, 60)}...
            </Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>
                {I18n.t('cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {I18n.t('pay_now')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333333',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 4,
  },
  equivalent: {
    fontSize: 16,
    color: '#666666',
  },
  memoContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  memoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  memo: {
    fontSize: 14,
    color: '#666666',
  },
  invoiceContainer: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  invoiceText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
