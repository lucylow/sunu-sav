const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SenegalTontineService = require('../services/SenegalTontineService');
const WaveMobileMoneyService = require('../services/WaveMobileMoneyService');
const USSDService = require('../services/USSDService');

// Initialize services
const senegalService = new SenegalTontineService();
const waveService = new WaveMobileMoneyService();
const ussdService = new USSDService();

// Wave Mobile Money endpoints
router.post('/wave/cashout', async (req, res) => {
  try {
    const { phone_number, amount_xof, amount_sats, reference } = req.body;
    
    if (!phone_number || !amount_xof || !amount_sats) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate Senegal phone number
    if (!waveService.validateSenegalPhoneNumber(phone_number)) {
      return res.status(400).json({ error: 'Invalid Senegal phone number' });
    }

    // Process Wave cash-out
    const result = await waveService.cashOutToWave(
      phone_number,
      amount_xof,
      reference || `SunuSav_${Date.now()}`
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Wave cash-out failed:', error);
    res.status(500).json({ 
      error: 'Cash-out failed', 
      details: error.message 
    });
  }
});

router.get('/wave/balance', async (req, res) => {
  try {
    const balance = await waveService.getWaveBalance();
    res.json(balance);
  } catch (error) {
    console.error('Failed to get Wave balance:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

router.get('/wave/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const status = await waveService.getTransactionStatus(transactionId);
    res.json(status);
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
});

// USSD endpoints
router.post('/ussd', async (req, res) => {
  try {
    const { phone_number, user_input, session_id } = req.body;
    
    if (!phone_number || !session_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await ussdService.handleUSSDRequest(
      phone_number,
      user_input || '',
      session_id
    );

    res.json({
      response: response,
      session_id: session_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('USSD request failed:', error);
    res.status(500).json({ 
      error: 'USSD request failed', 
      details: error.message 
    });
  }
});

router.get('/ussd/stats', async (req, res) => {
  try {
    const stats = ussdService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get USSD stats:', error);
    res.status(500).json({ error: 'Failed to get USSD stats' });
  }
});

// Senegal-specific tontine endpoints
router.post('/tontine/payout', async (req, res) => {
  try {
    const { group_id, cycle_number, winner_user_id, amount_sats } = req.body;
    
    if (!group_id || !cycle_number || !winner_user_id || !amount_sats) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create payout object
    const payout = {
      id: uuidv4(),
      group_id,
      cycle_number,
      winner_user_id,
      amount_sats,
      status: 'pending',
      created_at: new Date()
    };

    // Process payout with Senegal-specific logic
    const result = await senegalService.processPayout(payout, null);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Senegal payout failed:', error);
    res.status(500).json({ 
      error: 'Payout failed', 
      details: error.message 
    });
  }
});

router.post('/tontine/schedule-payout', async (req, res) => {
  try {
    const { group_id, cycle_number } = req.body;
    
    if (!group_id || !cycle_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await senegalService.schedulePayout(group_id, cycle_number);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Failed to schedule payout:', error);
    res.status(500).json({ 
      error: 'Failed to schedule payout', 
      details: error.message 
    });
  }
});

router.get('/tontine/senegal-stats', async (req, res) => {
  try {
    const stats = await senegalService.getSenegalStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get Senegal stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Exchange rate endpoints
router.get('/exchange-rate', async (req, res) => {
  try {
    const rate = await waveService.getBitcoinToXofRate();
    res.json({
      btc_xof_rate: rate * 100000000, // Convert sats rate to BTC rate
      sats_xof_rate: rate,
      timestamp: new Date().toISOString(),
      source: 'wave_service'
    });
  } catch (error) {
    console.error('Failed to get exchange rate:', error);
    res.status(500).json({ error: 'Failed to get exchange rate' });
  }
});

// Holiday awareness endpoints
router.get('/holidays', async (req, res) => {
  try {
    const holidays = senegalService.getSenegalHolidays();
    res.json(holidays);
  } catch (error) {
    console.error('Failed to get holidays:', error);
    res.status(500).json({ error: 'Failed to get holidays' });
  }
});

router.get('/holidays/upcoming', async (req, res) => {
  try {
    const upcoming = senegalService.getUpcomingHolidays();
    res.json(upcoming);
  } catch (error) {
    console.error('Failed to get upcoming holidays:', error);
    res.status(500).json({ error: 'Failed to get upcoming holidays' });
  }
});

router.post('/holidays/is-business-day', async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const isBusinessDay = senegalService.isBusinessDayInSenegal(new Date(date));
    
    res.json({
      date: date,
      is_business_day: isBusinessDay,
      is_weekend: new Date(date).getDay() === 0 || new Date(date).getDay() === 6,
      is_holiday: !isBusinessDay && !(new Date(date).getDay() === 0 || new Date(date).getDay() === 6)
    });

  } catch (error) {
    console.error('Failed to check business day:', error);
    res.status(500).json({ error: 'Failed to check business day' });
  }
});

// Language support endpoints
router.get('/languages/supported', async (req, res) => {
  res.json({
    supported_languages: ['fr', 'wo', 'en'],
    default_language: 'fr',
    descriptions: {
      fr: 'Français (Sénégal)',
      wo: 'Wolof',
      en: 'English'
    }
  });
});

// Monetization integration endpoints
router.get('/monetization/status', async (req, res) => {
  try {
    const monetizationUrl = process.env.MONETIZATION_API_URL || 'http://localhost:8001';
    const response = await fetch(`${monetizationUrl}/monetization/health`);
    
    if (response.ok) {
      const status = await response.json();
      res.json({
        monetization_service: 'connected',
        ...status
      });
    } else {
      res.json({
        monetization_service: 'disconnected',
        error: 'Monetization service unavailable'
      });
    }
  } catch (error) {
    res.json({
      monetization_service: 'disconnected',
      error: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Senegal service error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
