const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const dbManager = require('./database');

class TontineApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Initialize database
      await dbManager.initialize({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true'
      });

      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('✅ Tontine application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
    }));

    // Rate limiting
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit auth endpoints to 5 requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.'
      }
    });

    this.app.use('/api/', apiLimiter);
    this.app.use('/api/auth/', authLimiter);

    // Compression
    this.app.use(compression());

    // Body parsing with limits
    this.app.use(express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    
    this.app.use(express.urlencoded({
      extended: true,
      limit: '10mb'
    }));

    // Logging with PII scrubbing
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => {
          // Scrub PII from logs
          const scrubbed = this.scrubPIIFromLogs(message);
          console.log(scrubbed);
        }
      }
    }));

    // Request ID and timing
    this.app.use((req, res, next) => {
      req.id = require('crypto').randomUUID();
      req.startTime = Date.now();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Simple authentication middleware (for demo - replace with proper auth)
    this.app.use((req, res, next) => {
      const userId = req.headers['x-user-id'];
      
      if (userId) {
        req.user = { id: userId };
      } else {
        // For demo purposes, create a mock user
        req.user = { id: 'demo-user-id' };
      }
      
      next();
    });
  }

  setupRoutes() {
    // Health checks
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbManager.isConnected ? 'connected' : 'disconnected'
      });
    });

    this.app.get('/health/detailed', async (req, res) => {
      try {
        const db = dbManager.getDb();
        await db.raw('SELECT 1');
        
        res.json({
          status: 'healthy',
          services: {
            database: 'connected',
            api: 'running'
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            load: process.cpuUsage()
          }
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // API routes
    const TontineController = require('./controllers/TontineController');
    const tontineController = new TontineController();
    
    const router = express.Router();
    tontineController.initializeRoutes(router);
    
    this.app.use('/api/tontine', router);

    // Webhook endpoints
    this.app.post('/webhook/lightning', async (req, res) => {
      try {
        const { payment_hash, status } = req.body;
        
        if (status === 'settled') {
          const TontineService = require('./services/TontineService');
          const tontineService = new TontineService();
          
          await tontineService.processPayment(payment_hash, req.ip);
        }
        
        res.json({ received: true });
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      const errorId = req.id || 'unknown';
      
      console.error('Unhandled error:', {
        errorId,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      // Don't leak error details in production
      const isProduction = process.env.NODE_ENV === 'production';
      
      res.status(error.status || 500).json({
        success: false,
        error: isProduction ? 'Internal server error' : error.message,
        errorId: errorId,
        ...(isProduction ? {} : { stack: error.stack })
      });
    });
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      this.isShuttingDown = true;
      
      // Stop accepting new connections
      if (this.server) {
        this.server.close(async () => {
          console.log('📡 HTTP server closed');
          
          try {
            // Close database connections
            await dbManager.close();
            console.log('🗄️ Database connections closed');
            
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });
        
        // Force close after 30 seconds
        setTimeout(() => {
          console.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  scrubPIIFromLogs(message) {
    // Remove phone numbers, emails, and other PII from logs
    return message
      .replace(/\+?[1-9]\d{1,14}/g, '[PHONE]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/[A-Za-z0-9]{64}/g, '[HASH]'); // Bitcoin/Lightning hashes
  }

  async start(port = process.env.PORT || 3000) {
    try {
      this.server = this.app.listen(port, () => {
        console.log(`🚀 Tontine API server running on port ${port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
      });
      
      return this.server;
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }
}

module.exports = TontineApp;
