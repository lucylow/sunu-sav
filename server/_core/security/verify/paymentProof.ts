// server/_core/security/verify/paymentProof.ts
import { verifyPreimage } from '../lnHelpers.js';

/**
 * validateContribution — example server side validation for a contribution event
 * params:
 *   - txHashOrInvoice: string
 *   - preimageHex: string (if present)
 *   - expectedRHash: string (from invoice)
 */
export async function validateContribution({ preimageHex, expectedRHash }: { 
  preimageHex: string; 
  expectedRHash: string; 
}): Promise<boolean> {
  if (!verifyPreimage(preimageHex, expectedRHash)) {
    throw new Error('Invalid LN preimage for claimed r_hash');
  }
  // further checks: verify DB payment record, check amount, confirm onchain if fallback, etc.
  return true;
}
