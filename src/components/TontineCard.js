import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import I18n from '../i18n';

export default function TontineCard({ tontine, onPress }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'pending': return '#FF9500';
      case 'completed': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const calculateProgress = () => {
    const paidMembers = tontine.members.filter(m => m.hasPaid).length;
    return paidMembers / tontine.members.length;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return I18n.t('active');
      case 'pending': return I18n.t('pending');
      case 'completed': return I18n.t('completed');
      default: return status;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{tontine.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(tontine.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(tontine.status)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{I18n.t('contribution')}</Text>
          <Text style={styles.detailValue}>{tontine.contributionAmount} sats</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{I18n.t('cycle')}</Text>
          <Text style={styles.detailValue}>{tontine.currentCycle}/{tontine.totalCycles}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{I18n.t('members')}</Text>
          <Text style={styles.detailValue}>
            {tontine.members.filter(m => m.hasPaid).length}/{tontine.members.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { width: `${calculateProgress() * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(calculateProgress() * 100)}% complété
        </Text>
      </View>

      {tontine.status === 'active' && !tontine.userHasPaid && (
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>{I18n.t('pay_now')}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
  },
  payButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
