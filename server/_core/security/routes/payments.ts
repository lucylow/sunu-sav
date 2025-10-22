// server/_core/security/routes/payments.ts
import express from 'express';
import { lndClient } from '../lndClient.js';
import { verifyBolt11, decodeBolt11 } from '../lnHelpers.js';
import { signWebhookPayload } from '../webhooks.js';
import { db } from '../storage/db.js'; // your DB layer (Postgres/Redis)
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

export const paymentRouter = express.Router();

const payLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
paymentRouter.use(payLimiter);

/**
 * POST /api/payments/pay
 * body: { invoice: '<bolt11>' , source: 'mobile|server', metadata: {...} }
 */
paymentRouter.post('/pay', async (req, res) => {
  const { invoice, metadata } = req.body;
  if (!invoice) return res.status(400).json({ error: 'missing invoice' });

  // validate invoice client-side
  try {
    const decoded = verifyBolt11(invoice); // throws if invalid
    // optimistic DB record
    const optimistic = {
      id: `local-${Date.now()}`,
      invoice,
      amount: decoded.satoshis || decoded.millisatoshis / 1000,
      status: 'pending',
      created_at: new Date().toISOString(),
      metadata,
    };
    await db.insert('payments', optimistic);

    // Kick off payment via LND gRPC
    const client = lndClient();
    client.sendPaymentSync({ payment_request: invoice }, async (err: any, response: any) => {
      // response contains payment_error || payment_preimage etc.
      if (err || response.payment_error) {
        // mark failed
        await db.update('payments', optimistic.id, { status: 'failed', error: (response?.payment_error || err?.message) });
        return res.status(502).json({ error: 'payment_failed', details: response?.payment_error || err?.message });
      }

      // success: compute payment record
      const payRecord = {
        ...optimistic,
        id: response.payment_hash || `server-${Date.now()}`,
        status: 'succeeded',
        fee: response.payment_route?.total_fees || 0,
        preimage: response.payment_preimage,
        confirmed_at: new Date().toISOString(),
      };
      await db.update('payments', optimistic.id, payRecord);

      // emit webhook to internal processing queue (signed)
      const payload = { type: 'payment.succeeded', data: payRecord };
      const signature = signWebhookPayload(payload, process.env.WEBHOOK_SECRET!);
      // e.g., publish to internal queue or call processing endpoint
      // await publishToQueue('payments', payload, signature);

      return res.json({ ok: true, payment: payRecord });
    });

  } catch (err: any) {
    return res.status(400).json({ error: 'invalid_invoice', details: err.message });
  }
});
