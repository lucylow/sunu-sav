const knex = require('knex');
const { knexSnakeCaseMappers } = require('objection');
const { EventEmitter } = require('events');

class DatabaseManager extends EventEmitter {
  constructor() {
    super();
    this.db = null;
    this.isConnected = false;
    this.connectionPool = new Map();
  }

  initialize(config) {
    this.db = knex({
      client: 'pg',
      connection: {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
      ...knexSnakeCaseMappers(),
      log: {
        warn(message) {
          console.warn('Knex Warning:', message);
        },
        error(message) {
          console.error('Knex Error:', message);
        },
        deprecate(message) {
          console.warn('Knex Deprecation:', message);
        },
        debug(message) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Knex Debug:', message);
          }
        },
      },
    });

    // Test connection
    return this.testConnection();
  }

  async testConnection() {
    try {
      await this.db.raw('SELECT 1');
      this.isConnected = true;
      this.emit('connected');
      console.log('✅ Database connected successfully');
      
      // Start connection health monitor
      this.startHealthMonitor();
      
      return true;
    } catch (error) {
      this.isConnected = false;
      this.emit('connection_error', error);
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  startHealthMonitor() {
    setInterval(async () => {
      try {
        await this.db.raw('SELECT 1');
        if (!this.isConnected) {
          this.isConnected = true;
          this.emit('reconnected');
        }
      } catch (error) {
        this.isConnected = false;
        this.emit('connection_lost', error);
      }
    }, 30000); // Check every 30 seconds
  }

  getDb() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  async transaction() {
    return this.getDb().transaction();
  }

  async close() {
    try {
      await this.db.destroy();
      this.isConnected = false;
      this.emit('closed');
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      throw error;
    }
  }
}

// Singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;
