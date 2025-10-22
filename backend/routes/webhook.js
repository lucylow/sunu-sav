// backend/routes/webhook.js
const express = require('express');
const router = express.Router();

// Mock in-memory storage (shared with tontine routes)
let contributions = [];

router.post('/lightning', async (req, res) => {
  try {
    const { payment_hash, status, amount, settled_at } = req.body;
    
    if (!payment_hash) {
      return res.status(400).json({ error: 'Payment hash is required' });
    }

    // Find the contribution by payment hash
    const contribution = contributions.find(c => c.payment_hash === payment_hash);
    if (!contribution) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    if (status === 'settled') {
      contribution.status = 'paid';
      contribution.paid_at = settled_at || new Date().toISOString();
      
      console.log(`✅ Payment received: ${amount} sats for contribution ${contribution.id}`);
    }

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      contribution_id: contribution.id
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;
