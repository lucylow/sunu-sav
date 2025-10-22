// backend/src/services/lightningService.ts
import axios from 'axios';
import crypto from 'crypto';
import bolt11 from 'bolt11';
import debugFactory from 'debug';
const debug = debugFactory('sunu:lightning');

/**
 * LightningService (LND REST)
 * - Uses LND REST API with macaroon hex authentication
 * - env:
 *    LND_REST_URL (e.g. https://127.0.0.1:8080)
 *    LND_MACAROON_HEX
 *    LND_CERT_PATH (optional if using HTTPS with self-signed cert)
 *
 * NOTE: For production use gRPC with macaroon TLS; this REST wrapper is easiest for hack demos.
 */

const LND_REST_URL = process.env.LND_REST_URL;
const MACAROON = process.env.LND_MACAROON_HEX || '';

if (!LND_REST_URL) {
  console.warn('LND_REST_URL not set — lightningService will throw on use.');
}

function axiosInstance() {
  const headers: Record<string,string> = {};
  if (MACAROON) headers['Grpc-Metadata-macaroon'] = MACAROON;
  return axios.create({
    baseURL: LND_REST_URL,
    timeout: 30000,
    headers,
    // If you use a self-signed cert in dev, you may need to allow it at process env / node opts.
  });
}

export async function createInvoice(amountSats: number, memo = '') {
  if (!LND_REST_URL) throw new Error('LND not configured');
  const client = axiosInstance();

  // LND REST create invoice v2: POST /v2/invoices or /v1/invoices (older)
  // We'll call /v2/invoices (which expects value in satoshis)
  try {
    const body = {
      value: amountSats.toString(),
      memo,
      expiry: 3600, // seconds
    };
    const resp = await client.post('/v2/invoices', body);
    // v2 response typically contains { payment_request, r_hash: base64, add_index, ... }
    const data = resp.data;
    // compute payment_hash hex
    const rHashBase64 = data.r_hash || data.r_hash_base64 || data.r_hash_hex;
    let rHashHex = data.r_hash;
    if (rHashBase64 && typeof rHashBase64 === 'string' && rHashBase64.match(/^[A-Za-z0-9+/=]+$/)) {
      rHashHex = Buffer.from(rHashBase64, 'base64').toString('hex');
    } else if (data.r_hash_hex) {
      rHashHex = data.r_hash_hex;
    }
    return {
      payment_request: data.payment_request || data.paymentRequest || data.pay_req,
      payment_hash: rHashHex,
      raw: data
    };
  } catch (err: any) {
    debug('createInvoice error', err?.response?.data || err.message);
    throw err;
  }
}

export async function checkInvoiceStatus(paymentHashHex: string) {
  if (!LND_REST_URL) throw new Error('LND not configured');
  const client = axiosInstance();
  // LND REST: GET /v1/invoice/{r_hash_hex}
  // Some LND versions expect base64; try hex endpoint
  try {
    const resp = await client.get(`/v1/invoice/${paymentHashHex}`);
    return resp.data; // examine settled flag
  } catch (err: any) {
    debug('checkInvoiceStatus GET /v1/invoice fallback attempt', err?.response?.status);
    // fallback: use lookupinvoice by r_hash_str (v2)
    try {
      const rHashBase64 = Buffer.from(paymentHashHex, 'hex').toString('base64');
      const resp2 = await client.get(`/v2/invoices/${rHashBase64}`);
      return resp2.data;
    } catch (err2: any) {
      debug('checkInvoiceStatus failed', err2?.response?.data || err2.message);
      throw err2;
    }
  }
}

/**
 * payInvoice - attempts to pay a bolt11 invoice using LND router RPC via REST (/v2/router/send)
 * Note: This endpoint may not be available depending on LND version; if not available, recommend calling gRPC or letting client pay.
 */
export async function payInvoice(bolt11Invoice: string, timeoutMs = 30000) {
  if (!LND_REST_URL) throw new Error('LND not configured');
  const client = axiosInstance();

  try {
    // This is router RPC style: POST /v2/router/send with { payment_request }
    const resp = await client.post('/v2/router/send', { payment_request: bolt11Invoice }, { timeout: timeoutMs });
    // Response may be streaming; LND REST returns a top-level payment result object for sync call
    return resp.data;
  } catch (err: any) {
    debug('payInvoice error', err?.response?.data || err.message);
    throw err;
  }
}

/** decodeBolt11 helper */
export function decodeBolt11(inv: string) {
  try {
    const decoded = bolt11.decode(inv);
    return decoded;
  } catch (err) {
    throw new Error('Invalid bolt11 invoice');
  }
}

/** verifyWebhookHMAC - verify raw body signature header */
export function verifyWebhookSignature(rawBody: Buffer, signatureHex: string | undefined, secret: string) {
  if (!signatureHex || !secret) return false;
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  // constant-time compare
  try {
    const result = crypto.timingSafeEqual(Buffer.from(expectedHex,'hex'), Buffer.from(signatureHex,'hex'));
    return result;
  } catch (e) {
    return false;
  }
}
