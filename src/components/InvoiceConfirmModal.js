import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import I18n from '../i18n';

type Props = {
  visible: boolean;
  invoice?: string;
  amountSats?: number;
  memo?: string;
  lnurlMeta?: any; // { callback, minSendable, maxSendable, metadata }
  onConfirm: (amountMsat?: number) => void;
  onClose: () => void;
};

export default function InvoiceConfirmModal({ 
  visible, 
  invoice, 
  amountSats, 
  memo, 
  lnurlMeta, 
  onConfirm, 
  onClose 
}: Props) {
  const [amountMsatInput, setAmountMsatInput] = useState('');

  const renderBolt11 = () => (
    <>
      <Text style={styles.title}>{I18n.t('wallet.confirm_payment')}</Text>
      <Text style={styles.amount}>
        {amountSats ? `${amountSats} sats` : I18n.t('wallet.amount_unknown')}
      </Text>
      {memo ? (
        <Text style={styles.memo}>
          {I18n.t('wallet.memo')}: {memo}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
          <Text style={styles.cancelText}>{I18n.t('app.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={() => onConfirm()}>
          <Text style={styles.confirmText}>{I18n.t('wallet.send')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderLnurl = () => {
    const min = lnurlMeta?.minSendable ? Math.ceil(lnurlMeta.minSendable/1000) : undefined;
    const max = lnurlMeta?.maxSendable ? Math.floor(lnurlMeta.maxSendable/1000) : undefined;
    
    return (
      <>
        <Text style={styles.title}>{I18n.t('wallet.lnurl_pay')}</Text>
        <Text style={styles.memo}>{lnurlMeta?.metadata || I18n.t('wallet.pay_using_lnurl')}</Text>
        <Text style={styles.rangeText}>
          {I18n.t('wallet.amount_range')}: {min ?? '-'} - {max ?? '-'} sats
        </Text>
        <TextInput
          placeholder={I18n.t('wallet.enter_amount_sats')}
          keyboardType="numeric"
          value={amountMsatInput}
          onChangeText={setAmountMsatInput}
          style={styles.amountInput}
        />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>{I18n.t('app.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={() => {
            const sats = Number(amountMsatInput);
            // convert to msat for callback (msat = sats*1000)
            onConfirm(sats ? sats * 1000 : undefined);
          }}>
            <Text style={styles.confirmText}>{I18n.t('wallet.request_invoice')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {invoice ? renderBolt11() : lnurlMeta ? renderLnurl() : (
            <Text style={styles.errorText}>{I18n.t('wallet.no_data')}</Text>
          )}
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
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    color: '#F7931A',
  },
  memo: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  rangeText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginTop: 12,
    width: '80%',
    borderRadius: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  btn: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: '#f0f0f0',
  },
  confirm: {
    backgroundColor: '#F7931A',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
  },
});