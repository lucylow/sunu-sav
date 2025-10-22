#!/usr/bin/env node

const TontineApp = require('./app');
const cron = require('node-cron');

async function startServer() {
  try {
    console.log('🚀 Starting SunuSàv Tontine Bitcoin Platform...');
    
    // Initialize application
    const app = new TontineApp();
    await app.initialize();
    
    // Start server
    const port = process.env.PORT || 3000;
    await app.start(port);
    
    // Setup scheduled tasks
    setupScheduledTasks();
    
    console.log('✅ Server started successfully');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔗 API docs: http://localhost:${port}/api`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

function setupScheduledTasks() {
  console.log('⏰ Setting up scheduled tasks...');
  
  // Run reminder checks every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('📅 Running hourly reminder checks...');
      const NotificationService = require('./NotificationService');
      const notificationService = new NotificationService();
      await notificationService.scheduleReminders();
    } catch (error) {
      console.error('❌ Reminder check failed:', error);
    }
  });
  
  // Run cycle completion checks every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🔄 Running cycle completion checks...');
      const TontineService = require('./TontineService');
      const tontineService = new TontineService();
      
      // Check for groups with expired cycles
      const db = require('./database').getDb();
      const expiredGroups = await db('tontine_groups')
        .where('status', 'active')
        .where('cycle_ends_at', '<=', new Date())
        .select('id', 'name', 'current_cycle');
      
      for (const group of expiredGroups) {
        console.log(`⏰ Processing expired cycle for group ${group.name}`);
        // In a real implementation, you might want to handle expired cycles differently
        // For now, we'll just log them
      }
    } catch (error) {
      console.error('❌ Cycle completion check failed:', error);
    }
  });
  
  // Clean up old audit logs daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Cleaning up old audit logs...');
      const db = require('./database').getDb();
      
      // Delete audit logs older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const deletedCount = await db('audit_logs')
        .where('created_at', '<', cutoffDate)
        .del();
      
      if (deletedCount > 0) {
        console.log(`🗑️ Deleted ${deletedCount} old audit logs`);
      }
    } catch (error) {
      console.error('❌ Audit log cleanup failed:', error);
    }
  });
  
  console.log('✅ Scheduled tasks configured');
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
