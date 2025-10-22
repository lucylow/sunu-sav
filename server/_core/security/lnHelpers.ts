// server/_core/security/lnHelpers.ts
import bolt11 from 'bolt11';
import crypto from 'crypto';

/**
 * verifyBolt11
 * - throws if invalid
 * - returns decoded invoice object
 */
export function verifyBolt11(bolt: string) {
  try {
    const decoded = bolt11.decode(bolt);
    // optional: check expiry, amount, fallback address, payee node id
    if (!decoded.tags) throw new Error('invalid invoice tags');
    return decoded;
  } catch (err: any) {
    throw new Error(`invalid bolt11: ${err.message}`);
  }
}

/**
 * decodeBolt11
 * - decode bolt11 invoice without validation
 */
export function decodeBolt11(bolt: string) {
  return bolt11.decode(bolt);
}

/**
 * verifyPreimage
 * - verify preimage matches provided payment_hash (r_hash)
 */
export function verifyPreimage(preimageHex: string, rHashHex: string): boolean {
  const pre = Buffer.from(preimageHex, 'hex');
  const h = crypto.createHash('sha256').update(pre).digest('hex');
  // bolt11 uses big-endian hex; ensure format matches
  return h === rHashHex.toLowerCase();
}
