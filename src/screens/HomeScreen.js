import React, { useEffect, useState } from 'react';
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
        data={tontines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TontineCard 
            tontine={item}
            onPress={() => navigation.navigate('TontineDetail', { tontine: item })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000000']}
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
