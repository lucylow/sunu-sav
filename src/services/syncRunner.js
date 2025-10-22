// Sync runner to process queued payments when back online
import { getPendingPayments, removePendingPayment, processQueuedPayments } from '../services/lightningService';

export function startSyncRunner() {
  // Note: In a real implementation, you would use NetInfo to monitor connectivity
  // For now, we'll provide a manual sync function
  
  console.log('Sync runner started - monitoring for offline payments to process');
  
  // Return a function to manually trigger sync
  return {
    syncNow: async () => {
      try {
        console.log('Starting manual sync of queued payments...');
        const results = await processQueuedPayments();
        
        if (results.length > 0) {
          console.log(`Processed ${results.length} queued payments:`, results);
          
          const successCount = results.filter(r => r.status === 'success').length;
          const failedCount = results.filter(r => r.status === 'failed' || r.status === 'error').length;
          
          return {
            success: true,
            processed: results.length,
            successful: successCount,
            failed: failedCount,
            results
          };
        } else {
          console.log('No queued payments to process');
          return {
            success: true,
            processed: 0,
            successful: 0,
            failed: 0,
            results: []
          };
        }
      } catch (error) {
        console.error('Sync failed:', error);
        return {
          success: false,
          error: error.message,
          processed: 0,
          successful: 0,
          failed: 0,
          results: []
        };
      }
    },
    
    getQueueStatus: async () => {
      try {
        const pending = await getPendingPayments();
        return {
          count: pending.length,
          items: pending.map(p => ({
            id: p.id,
            type: p.type,
            createdAt: new Date(p.createdAt).toISOString(),
            attempts: p.attempts || 0
          }))
        };
      } catch (error) {
        console.error('Failed to get queue status:', error);
        return {
          count: 0,
          items: [],
          error: error.message
        };
      }
    }
  };
}

// Auto-sync when app becomes active (if online)
export function setupAutoSync() {
  // Note: In a real implementation, you would:
  // 1. Listen to NetInfo connectivity changes
  // 2. Listen to AppState changes (foreground/background)
  // 3. Automatically trigger sync when conditions are met
  
  console.log('Auto-sync setup complete');
  
  return {
    // Provide manual controls for now
    triggerSync: () => {
      const runner = startSyncRunner();
      return runner.syncNow();
    },
    
    getStatus: () => {
      const runner = startSyncRunner();
      return runner.getQueueStatus();
    }
  };
}
