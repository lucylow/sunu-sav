// server/_core/security/server.ts
import fs from 'fs';
import https from 'https';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { lndClient } from './lndClient.js';
import { verifyWebhookSignature, signWebhookPayload } from './webhooks.js';
import { verifyBolt11 } from './lnHelpers.js';
import { paymentRouter } from './routes/payments.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(helmet());
app.use(bodyParser.json({ limit: '100kb' }));
app.use(morgan('combined'));

// Rate limiting on sensitive endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
});
app.use(limiter);

// Mount routes
app.use('/api/payments', paymentRouter);

// Example webhook receiver (signed)
app.post('/api/webhook/payment', async (req, res) => {
  const signature = req.headers['x-sunu-signature'] as string;
  const ok = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET!);
  if (!ok) return res.status(401).json({ error: 'invalid signature' });

  // process event...
  res.json({ ok: true });
});

// HTTPS server
const serverOptions = {
  key: fs.readFileSync(process.env.TLS_KEY_PATH || './certs/server.key'),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH || './certs/server.crt'),
  // optional mTLS:
  ca: process.env.MTLS_ENABLED === 'true' ? fs.readFileSync(process.env.MTLS_CA_PATH!) : undefined,
  requestCert: process.env.MTLS_ENABLED === 'true',
  rejectUnauthorized: process.env.MTLS_ENABLED === 'true',
};

const port = parseInt(process.env.PORT || '443');
https.createServer(serverOptions, app).listen(port, () => {
  console.log(`Secure API listening on ${port}`);
});

export default app;
