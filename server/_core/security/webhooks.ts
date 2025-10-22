// server/_core/security/webhooks.ts
import crypto from 'crypto';

export function signWebhookPayload(payload: any, secret: string): string {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = signWebhookPayload(payload, secret);
  // Use constant-time compare
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
