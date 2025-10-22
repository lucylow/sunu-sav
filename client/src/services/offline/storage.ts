// client/src/services/offline/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import { OfflineAction, SyncStatus, CachedData } from './types';

// Initialize SQLite database
SQLite.enablePromise(true);

class OfflineStorage {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabase({
        name: 'sunusav_offline.db',
        location: 'default',
        createFromLocation: '~www/sunusav_offline.db',
      });

      await this.createTables();
      this.isInitialized = true;
      console.log('[OfflineStorage] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineStorage] Database initialization failed:', error);
      // Fallback to AsyncStorage only
      this.isInitialized = true;
    }
  }

  private async createTables() {
    if (!this.db) return;

    const createOfflineActionsTable = `
      CREATE TABLE IF NOT EXISTS offline_actions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_attempt INTEGER,
        data TEXT NOT NULL,
        error TEXT
      );
    `;

    const createCachedDataTable = `
      CREATE TABLE IF NOT EXISTS cached_data (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        version INTEGER DEFAULT 1
      );
    `;

    const createSyncMetadataTable = `
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        last_sync INTEGER NOT NULL,
        version INTEGER NOT NULL
      );
    `;

    await this.db.executeSql(createOfflineActionsTable);
    await this.db.executeSql(createCachedDataTable);
    await this.db.executeSql(createSyncMetadataTable);

    // Create indexes for better performance
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_offline_actions_status ON offline_actions(status);');
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_offline_actions_timestamp ON offline_actions(timestamp);');
  }

  // Queue offline action
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.init();
    
    const id = `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAction: OfflineAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    if (this.db) {
      // Use SQLite for better performance
      await this.db.executeSql(
        'INSERT INTO offline_actions (id, type, timestamp, status, retry_count, data) VALUES (?, ?, ?, ?, ?, ?)',
        [
          fullAction.id,
          fullAction.type,
          fullAction.timestamp,
          fullAction.status,
          fullAction.retryCount,
          JSON.stringify(fullAction.data),
        ]
      );
    } else {
      // Fallback to AsyncStorage
      const existingActions = await this.getPendingActionsFromAsyncStorage();
      existingActions.push(fullAction);
      await AsyncStorage.setItem('offline_actions', JSON.stringify(existingActions));
    }

    return id;
  }

  // Get all pending actions
  async getPendingActions(): Promise<OfflineAction[]> {
    await this.init();

    if (this.db) {
      const [results] = await this.db.executeSql(
        'SELECT * FROM offline_actions WHERE status = ? ORDER BY timestamp ASC',
        ['pending']
      );

      const actions: OfflineAction[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        actions.push({
          id: row.id,
          type: row.type,
          timestamp: row.timestamp,
          status: row.status,
          retryCount: row.retry_count,
          lastAttempt: row.last_attempt,
          data: JSON.parse(row.data),
          error: row.error,
        });
      }
      return actions;
    } else {
      return this.getPendingActionsFromAsyncStorage();
    }
  }

  private async getPendingActionsFromAsyncStorage(): Promise<OfflineAction[]> {
    const actionsJson = await AsyncStorage.getItem('offline_actions');
    if (!actionsJson) return [];
    
    const allActions: OfflineAction[] = JSON.parse(actionsJson);
    return allActions.filter(action => action.status === 'pending');
  }

  // Update action status
  async updateActionStatus(
    id: string, 
    status: SyncStatus, 
    error?: string
  ): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.executeSql(
        'UPDATE offline_actions SET status = ?, last_attempt = ?, error = ?, retry_count = retry_count + 1 WHERE id = ?',
        [status, Date.now(), error || null, id]
      );
    } else {
      // Fallback to AsyncStorage
      const actionsJson = await AsyncStorage.getItem('offline_actions');
      if (!actionsJson) return;
      
      const allActions: OfflineAction[] = JSON.parse(actionsJson);
      const actionIndex = allActions.findIndex(action => action.id === id);
      
      if (actionIndex !== -1) {
        allActions[actionIndex].status = status;
        allActions[actionIndex].lastAttempt = Date.now();
        if (error) allActions[actionIndex].error = error;
        if (status === 'failed') allActions[actionIndex].retryCount++;
        
        await AsyncStorage.setItem('offline_actions', JSON.stringify(allActions));
      }
    }
  }

  // Cache data for offline viewing
  async cacheData(key: string, data: any): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.executeSql(
        'INSERT OR REPLACE INTO cached_data (key, data, timestamp, version) VALUES (?, ?, ?, ?)',
        [key, JSON.stringify(data), Date.now(), 1]
      );
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`cached_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: 1,
      }));
    }
  }

  // Get cached data
  async getCachedData(key: string): Promise<any> {
    await this.init();

    if (this.db) {
      const [results] = await this.db.executeSql(
        'SELECT data FROM cached_data WHERE key = ?',
        [key]
      );

      if (results.rows.length > 0) {
        return JSON.parse(results.rows.item(0).data);
      }
      return null;
    } else {
      // Fallback to AsyncStorage
      const cachedJson = await AsyncStorage.getItem(`cached_${key}`);
      if (!cachedJson) return null;
      
      const cached = JSON.parse(cachedJson);
      return cached.data;
    }
  }

  // Update sync metadata
  async updateSyncMetadata(lastSync: number, version: number): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.executeSql(
        'INSERT OR REPLACE INTO sync_metadata (key, last_sync, version) VALUES (?, ?, ?)',
        ['main', lastSync, version]
      );
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem('sync_metadata', JSON.stringify({
        lastSync,
        version,
      }));
    }
  }

  // Get sync metadata
  async getSyncMetadata(): Promise<{ lastSync: number; version: number } | undefined> {
    await this.init();

    if (this.db) {
      const [results] = await this.db.executeSql(
        'SELECT last_sync, version FROM sync_metadata WHERE key = ?',
        ['main']
      );

      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          lastSync: row.last_sync,
          version: row.version,
        };
      }
      return undefined;
    } else {
      // Fallback to AsyncStorage
      const metadataJson = await AsyncStorage.getItem('sync_metadata');
      if (!metadataJson) return undefined;
      
      return JSON.parse(metadataJson);
    }
  }

  // Clear synced actions older than 7 days
  async cleanupOldActions(): Promise<void> {
    await this.init();

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    if (this.db) {
      await this.db.executeSql(
        'DELETE FROM offline_actions WHERE status = ? AND timestamp < ?',
        ['synced', sevenDaysAgo]
      );
    } else {
      // Fallback to AsyncStorage
      const actionsJson = await AsyncStorage.getItem('offline_actions');
      if (!actionsJson) return;
      
      const allActions: OfflineAction[] = JSON.parse(actionsJson);
      const filteredActions = allActions.filter(action => 
        !(action.status === 'synced' && action.timestamp < sevenDaysAgo)
      );
      
      await AsyncStorage.setItem('offline_actions', JSON.stringify(filteredActions));
    }
  }

  // Get all actions for debugging
  async getAllActions(): Promise<OfflineAction[]> {
    await this.init();

    if (this.db) {
      const [results] = await this.db.executeSql(
        'SELECT * FROM offline_actions ORDER BY timestamp DESC'
      );

      const actions: OfflineAction[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        actions.push({
          id: row.id,
          type: row.type,
          timestamp: row.timestamp,
          status: row.status,
          retryCount: row.retry_count,
          lastAttempt: row.last_attempt,
          data: JSON.parse(row.data),
          error: row.error,
        });
      }
      return actions;
    } else {
      // Fallback to AsyncStorage
      const actionsJson = await AsyncStorage.getItem('offline_actions');
      if (!actionsJson) return [];
      
      return JSON.parse(actionsJson);
    }
  }

  // Close database connection
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const offlineStorage = new OfflineStorage();
