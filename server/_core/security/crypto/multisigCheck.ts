// server/_core/security/crypto/multisigCheck.ts
// Minimal example for verifying ECDSA signatures against pubkeys using secp256k1.
// Note: verifying multisig on a real Bitcoin tx requires building the sighash for the input
// and verifying each signature against that sighash. This example shows verifying a message hash.

import secp256k1 from 'secp256k1';
import crypto from 'crypto';
import bs58check from 'bs58check';
import { ECPair } from 'bitcoinjs-lib'; // for pubkey handling if needed

/**
 * verifySignatureAgainstPubkey
 * signature: Buffer (DER) or Uint8Array
 * msg: Buffer (32 bytes, the hash)
 * pubKey: Buffer (compressed/uncompressed)
 *
 * returns boolean
 */
export function verifySignatureAgainstPubkey(signatureDER: Buffer, msg32: Buffer, pubKey: Buffer): boolean {
  // convert DER signature to 64-byte R+S by using secp256k1.signatureImport
  const sig64 = secp256k1.signatureImport(signatureDER); // returns 64-byte Buffer
  return secp256k1.ecdsaVerify(sig64, msg32, pubKey);
}

/**
 * countValidMultiSigs
 * - signatures: array of DER signatures
 * - pubkeys: array of pubkey Buffers
 * - msg32: Buffer 32 (sighash)
 * returns number of valid signatures
 */
export function countValidMultiSigs(signaturesDER: Buffer[], pubkeys: Buffer[], msg32: Buffer): number {
  let valid = 0;
  for (const sig of signaturesDER) {
    for (const pk of pubkeys) {
      try {
        if (verifySignatureAgainstPubkey(sig, msg32, pk)) {
          valid += 1;
          break; // signature matched one pubkey
        }
      } catch (e) {
        continue;
      }
    }
  }
  return valid;
}
