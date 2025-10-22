// backend/src/utils/webhooks.ts
import crypto from 'crypto';

export function signWebhookPayload(payload: any, secret: string) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyWebhookSignature(rawBody: Buffer, signatureHex: string | undefined, secret: string) {
  if (!signatureHex || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHex, 'hex'));
  } catch (e) {
    return false;
  }
}
