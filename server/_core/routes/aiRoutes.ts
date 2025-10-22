// server/routes/aiRoutes.ts
import express from 'express';
import dbManager from '../database';
import { getQueueStats } from '../jobs/aiJobManager';
import { enqueueCreditCheck, enqueueNotification } from '../jobs/aiJobManager';
const router = express.Router();

/**
 * GET /api/ai/dashboard - Get AI system overview
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const db = dbManager.getDb();
    
    // Get AI metrics summary
    const metrics = await db('ai_metrics')
      .select('metric_key')
      .count('* as count')
      .groupBy('metric_key');

    // Get recent alerts
    const recentAlerts = await db('ai_alerts')
      .select('alert_type', 'severity', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    // Get queue statistics
    const queueStats = await getQueueStats();

    // Get user credit score distribution
    const creditScores = await db('users')
      .whereNotNull('credit_score')
      .select('credit_score')
      .orderBy('credit_score', 'desc');

    const scoreDistribution = {
      excellent: creditScores.filter(u => u.credit_score >= 0.8).length,
      good: creditScores.filter(u => u.credit_score >= 0.6 && u.credit_score < 0.8).length,
      fair: creditScores.filter(u => u.credit_score >= 0.4 && u.credit_score < 0.6).length,
      poor: creditScores.filter(u => u.credit_score < 0.4).length
    };

    res.json({
      success: true,
      data: {
        metrics: metrics.reduce((acc, m) => ({ ...acc, [m.metric_key]: m.count }), {}),
        recentAlerts,
        queueStats,
        creditScoreDistribution: scoreDistribution,
        totalUsers: creditScores.length,
        avgCreditScore: creditScores.length > 0 ? 
          creditScores.reduce((sum, u) => sum + u.credit_score, 0) / creditScores.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/user/:userId/profile - Get AI profile for a user
 */
router.get('/user/:userId/profile', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const db = dbManager.getDb();

    // Get user's credit score and risk profile
    const user = await db('users')
      .where('id', userId)
      .select('credit_score', 'credit_score_updated_at', 'risk_profile')
      .first();

    // Get recent AI metrics
    const recentMetrics = await db('ai_metrics')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(20);

    // Get recent alerts
    const recentAlerts = await db('ai_alerts')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: {
        user: {
          creditScore: user?.credit_score,
          creditScoreUpdatedAt: user?.credit_score_updated_at,
          riskProfile: user?.risk_profile ? JSON.parse(user.risk_profile) : null
        },
        recentMetrics,
        recentAlerts
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/user/:userId/credit-check - Trigger credit score check
 */
router.post('/user/:userId/credit-check', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { priority = 'normal' } = req.body;

    const jobId = await enqueueCreditCheck(userId, priority);

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Credit check enqueued successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/user/:userId/notify - Send AI-powered notification
 */
router.post('/user/:userId/notify', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, groupId, data } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Notification type is required'
      });
    }

    const jobId = await enqueueNotification(userId, type, groupId, data);

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Notification enqueued successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/alerts - Get AI alerts with filtering
 */
router.get('/alerts', async (req, res, next) => {
  try {
    const { type, severity, status = 'active', limit = 50 } = req.query;
    const db = dbManager.getDb();

    let query = db('ai_alerts')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit as string));

    if (type) {
      query = query.where('alert_type', type);
    }
    if (severity) {
      query = query.where('severity', severity);
    }
    if (status) {
      query = query.where('status', status);
    }

    const alerts = await query;

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/ai/alerts/:alertId/resolve - Resolve an AI alert
 */
router.put('/alerts/:alertId/resolve', async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { reason, resolvedBy } = req.body;
    const db = dbManager.getDb();

    await db('ai_alerts')
      .where('id', alertId)
      .update({
        status: 'resolved',
        resolved_at: db.fn.now(),
        resolved_by: resolvedBy,
        resolved_reason: reason
      });

    res.json({
      success: true,
      data: {
        message: 'Alert resolved successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
