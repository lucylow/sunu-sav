import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import I18n from '../i18n';
import { useStore } from '../store/useStore';

export default function WalletScreen({ navigation }) {
  const walletBalance = useStore((state) => state.walletBalance);
  const setWalletBalance = useStore((state) => state.setWalletBalance);
  const clearStore = useStore((state) => state.clearStore);

  useEffect(() => {
    // Simulate loading wallet balance
    setWalletBalance(50000); // 50,000 sats
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => {
            clearStore();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const formatBalance = (sats) => {
    return sats.toLocaleString();
  };

  const convertToFCFA = (sats) => {
    return Math.round(sats * 0.0003);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde Bitcoin</Text>
        <Text style={styles.balanceAmount}>{formatBalance(walletBalance)} sats</Text>
        <Text style={styles.balanceEquivalent}>
          ≈ {formatBalance(convertToFCFA(walletBalance))} FCFA
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Envoyer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionText}>Recevoir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Échanger</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historique Récent</Text>
        
        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <Text style={styles.transactionIconText}>📤</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>Paiement Tontine</Text>
            <Text style={styles.transactionDate}>Aujourd'hui, 14:30</Text>
          </View>
          <Text style={styles.transactionAmount}>-10,000 sats</Text>
        </View>

        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <Text style={styles.transactionIconText}>📥</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>Réception Tontine</Text>
            <Text style={styles.transactionDate}>Hier, 16:45</Text>
          </View>
          <Text style={[styles.transactionAmount, styles.positiveAmount]}>+30,000 sats</Text>
        </View>

        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <Text style={styles.transactionIconText}>⚡</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>Paiement Lightning</Text>
            <Text style={styles.transactionDate}>Il y a 2 jours</Text>
          </View>
          <Text style={styles.transactionAmount}>-5,000 sats</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{I18n.t('language')}</Text>
          <Text style={styles.settingValue}>Français</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{I18n.t('notifications')}</Text>
          <Text style={styles.settingValue}>Activées</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{I18n.t('security')}</Text>
          <Text style={styles.settingValue}>Biométrique</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{I18n.t('logout')}</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>
          Tontine Bitcoin v1.0.0{'\n'}
          Réseau Lightning Bitcoin
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: '#000000',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceEquivalent: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  actionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  historySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  positiveAmount: {
    color: '#34C759',
  },
  settingsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    color: '#666666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
