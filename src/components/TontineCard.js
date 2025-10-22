import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import I18n from '../i18n';

export default function TontineCard({ tontine, onPress, onPay }) {
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

  // Calculate payment urgency
  const getPaymentUrgency = () => {
    const now = new Date();
    const nextDue = tontine.nextPayoutDate ? new Date(tontine.nextPayoutDate) : null;
    if (!nextDue) return { urgency: 'neutral', text: 'No due date' };
    
    const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return { urgency: 'high', text: `${Math.abs(daysUntilDue)} overdue` };
    if (daysUntilDue <= 3) return { urgency: 'medium', text: `${daysUntilDue}d` };
    return { urgency: 'low', text: `${daysUntilDue}d` };
  };

  const paymentUrgency = getPaymentUrgency();
  const progress = calculateProgress();
  const userHasPaid = tontine.userHasPaid || false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Compact header with key info */}
      <View style={styles.cardHeader}>
        <View style={styles.titleSection}>
          <Text style={styles.name} numberOfLines={1}>{tontine.name}</Text>
          <Text style={styles.description} numberOfLines={1}>
            {tontine.description || I18n.t('community_savings_circle')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[
            styles.urgencyBadge,
            { backgroundColor: paymentUrgency.urgency === 'high' ? '#D9534F' : 
                              paymentUrgency.urgency === 'medium' ? '#FF9500' : '#34C759' }
          ]}>
            <Text style={styles.urgencyText}>{paymentUrgency.text}</Text>
          </View>
        </View>
      </View>

      {/* Key metrics in compact layout */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{tontine.contributionAmount?.toLocaleString() || 0}</Text>
          <Text style={styles.metricLabel}>sats</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {tontine.members.filter(m => m.hasPaid).length}/{tontine.members.length}
          </Text>
          <Text style={styles.metricLabel}>paid</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{tontine.currentCycle || 1}</Text>
          <Text style={styles.metricLabel}>cycle</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% {I18n.t('complete')}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.viewButton} onPress={onPress}>
          <Text style={styles.viewButtonText}>{I18n.t('view')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.payButton,
            (tontine.status !== 'active' || userHasPaid) && styles.payButtonDisabled
          ]}
          onPress={() => onPay && onPay(tontine)}
          disabled={tontine.status !== 'active' || userHasPaid}
        >
          <Text style={[
            styles.payButtonText,
            (tontine.status !== 'active' || userHasPaid) && styles.payButtonTextDisabled
          ]}>
            {userHasPaid ? I18n.t('paid') : I18n.t('pay_now')}
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#666666',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#666666',
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  payButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  payButtonTextDisabled: {
    color: '#999999',
  },
});
