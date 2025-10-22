// backend/src/routes/lightningRoutes.ts
import express from 'express';
import { createInvoice, checkInvoiceStatus, verifyWebhookSignature } from '../services/lightningService';
import { appendAuditEntry } from '../utils/audit';
const router = express.Router();

/**
 * POST /api/lightning/create-invoice
 * body: { groupId, userId (from auth), amountSats?, memo? }
 */
router.post('/create-invoice', async (req, res, next) => {
  try {
    const { amountSats, memo } = req.body;
    if (!amountSats || isNaN(amountSats)) return res.status(400).json({ error: 'invalid_amount' });
    const invoice = await createInvoice(Number(amountSats), memo || 'SunuSàv contribution');
    // audit
    await appendAuditEntry({
      action: 'CREATE_INVOICE',
      resource_type: 'CONTRIBUTION',
      metadata: { amountSats, payment_hash: invoice.payment_hash, userId: req.user?.id }
    });
    res.json({ ok: true, invoice });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/lightning/invoice/:payment_hash
 */
router.get('/invoice/:payment_hash', async (req, res, next) => {
  try {
    const { payment_hash } = req.params;
    const status = await checkInvoiceStatus(payment_hash);
    res.json({ ok: true, status });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /webhook/lightning - incoming from your LND watcher / broker
 * Must verify HMAC signature computed against raw request body.
 *
 * The app.js JSON parser stores raw body in req.rawBody (see app.js snippet earlier)
 */
router.post('/webhook/lightning', async (req, res) => {
  try {
    const signature = req.headers['x-sunu-signature'] as string | undefined;
    const webhookSecret = process.env.WEBHOOK_SECRET || '';
    const ok = verifyWebhookSignature((req as any).rawBody, signature, webhookSecret);
    if (!ok) return res.status(401).json({ error: 'invalid_signature' });

    const { payment_hash, settled, amt } = req.body;
    // enqueue or process payment: ideally push to a queue (Bull) for worker processing
    // For now, respond quickly and emit event
    // Example: await processPayment(payment_hash);
    res.json({ ok: true });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).json({ error: 'webhook_processing_failed' });
  }
});

export default router;
