// backend/routes/status.js
const express = require('express');
const router = express.Router();

// Mock database for demo
let mockData = {
  users: 0,
  groups: 0,
  contributions: 0,
  totalVolume: 0
};

router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        lightning: 'mock_mode',
        api: 'running'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    res.json({
      system: {
        users: mockData.users,
        groups: mockData.groups,
        active_contributions: mockData.contributions,
        total_volume_sats: mockData.totalVolume
      },
      blockchain: {
        network: 'testnet',
        node_status: 'mock_mode',
        sync_status: 'ready'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Demo reset endpoint (for testing)
router.post('/demo/reset', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Demo reset only available in development' });
  }

  try {
    mockData = {
      users: 0,
      groups: 0,
      contributions: 0,
      totalVolume: 0
    };
    
    res.json({ message: 'Demo data reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

module.exports = router;
