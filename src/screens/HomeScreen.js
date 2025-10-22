import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import I18n from '../i18n';
import { useStore } from '../store/useStore';
import TontineCard from '../components/TontineCard';
import QuickAction from '../components/QuickAction';

export default function HomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const user = useStore((state) => state.user);
  const tontines = useStore((state) => state.tontines);
  const fetchTontines = useStore((state) => state.fetchTontines);

  useEffect(() => {
    loadTontines();
  }, []);

  const loadTontines = async () => {
    try {
      await fetchTontines(user.id);
    } catch (error) {
      console.error('Failed to load tontines:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTontines();
    setRefreshing(false);
  };

  // Sort tontines by urgency (overdue first, then due soon)
  const sortedTontines = useMemo(() => {
    if (!tontines) return [];
    
    return [...tontines].sort((a, b) => {
      const now = new Date();
      const aDue = a.nextPayoutDate ? new Date(a.nextPayoutDate) : new Date(0);
      const bDue = b.nextPayoutDate ? new Date(b.nextPayoutDate) : new Date(0);
      
      const aDaysUntilDue = Math.ceil((aDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const bDaysUntilDue = Math.ceil((bDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Overdue items first
      if (aDaysUntilDue < 0 && bDaysUntilDue >= 0) return -1;
      if (bDaysUntilDue < 0 && aDaysUntilDue >= 0) return 1;
      
      // Then by days until due (ascending)
      return aDaysUntilDue - bDaysUntilDue;
    });
  }, [tontines]);

  // Memoized render item for FlatList optimization
  const renderTontineItem = useCallback(({ item }) => (
    <TontineCard 
      tontine={item}
      onPress={() => navigation.navigate('TontineDetail', { tontine: item })}
      onPay={handlePayTontine}
    />
  ), [navigation]);

  // Memoized key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Handle payment with optimistic UI
  const handlePayTontine = useCallback((tontine) => {
    Alert.alert(
      I18n.t('confirm_contribution'),
      `${I18n.t('contribute')} ${tontine.contributionAmount} sats?`,
      [
        { text: I18n.t('cancel'), style: 'cancel' },
        { 
          text: I18n.t('pay_now'), 
          onPress: () => {
            // Navigate to payment screen with optimistic state
            navigation.navigate('Payment', { 
              tontine,
              optimistic: true 
            });
          }
        }
      ]
    );
  }, [navigation]);

  const quickActions = [
    {
      id: 'create',
      title: I18n.t('create_tontine'),
      icon: '➕',
      color: '#000000',
      onPress: () => navigation.navigate('CreateTontine')
    },
    {
      id: 'join',
      title: I18n.t('join_tontine'),
      icon: '👥',
      color: '#007AFF',
      onPress: () => Alert.alert('Rejoindre', 'Fonctionnalité à venir')
    },
    {
      id: 'wallet',
      title: I18n.t('balance'),
      icon: '💰',
      color: '#34C759',
      onPress: () => navigation.navigate('Wallet')
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {I18n.t('hello')}, {user?.phoneNumber}
        </Text>
        <Text style={styles.subtitle}>
          {I18n.t('your_tontines')}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <QuickAction
            key={action.id}
            icon={action.icon}
            title={action.title}
            color={action.color}
            onPress={action.onPress}
          />
        ))}
      </View>

      {/* Tontines List */}
      <FlatList
        data={sortedTontines}
        keyExtractor={keyExtractor}
        renderItem={renderTontineItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#34C759']}
            tintColor="#34C759"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {I18n.t('no_active_tontines')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {I18n.t('create_or_join')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 180, // Approximate height of TontineCard
          offset: 180 * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
