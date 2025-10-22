const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const dbManager = require('./database');
const { setupRawBody, verifyWebhookSecret } = require('./middleware/webhookVerification');
const { enqueueWebhookProcessingJob } = require('./jobs/payoutProducer');
const workerManager = require('./workers/workerManager');

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

      // Start background workers
      await workerManager.start({
        payoutConcurrency: parseInt(process.env.PAYOUT_WORKER_CONCURRENCY) || 2,
        webhookConcurrency: parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY) || 5
      });

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

    // Setup raw body capture for webhook verification
    setupRawBody(this.app);

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
        
        // Get worker health status
        const workerHealth = await workerManager.healthCheck();
        
        res.json({
          status: 'healthy',
          services: {
            database: 'connected',
            api: 'running',
            workers: workerHealth.healthy ? 'running' : 'unhealthy'
          },
          workers: workerHealth,
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

    // Worker statistics endpoint
    this.app.get('/health/workers', async (req, res) => {
      try {
        const stats = await workerManager.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get worker stats',
          message: error.message
        });
      }
    });

    // API routes
    const TontineController = require('./controllers/TontineController');
    const tontineController = new TontineController();
    
    const router = express.Router();
    tontineController.initializeRoutes(router);
    
    this.app.use('/api/tontine', router);

    // Webhook endpoints with HMAC verification and background processing
    this.app.post('/webhook/lightning', 
      verifyWebhookSecret({ 
        headerName: 'x-sunu-signature', 
        secretEnv: 'WEBHOOK_HMAC_SECRET' 
      }), 
      async (req, res) => {
        try {
          const { payment_hash, status } = req.body;
          
          console.log(`Received Lightning webhook for payment ${payment_hash}, status: ${status}`);
          
          // Enqueue webhook for background processing
          const job = await enqueueWebhookProcessingJob({
            payment_hash,
            status,
            metadata: {
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              timestamp: new Date().toISOString()
            }
          });
          
          console.log(`Enqueued webhook job ${job.id} for payment ${payment_hash}`);
          
          // Respond immediately to webhook sender
          res.json({ 
            received: true, 
            job_id: job.id,
            timestamp: new Date().toISOString() 
          });
        } catch (error) {
          console.error('Webhook processing error:', error);
          res.status(500).json({ 
            error: 'Webhook processing failed',
            error_code: 'WEBHOOK_PROCESSING_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      }
    );

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
            // Stop background workers
            await workerManager.stop();
            console.log('👷 Background workers stopped');
            
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
