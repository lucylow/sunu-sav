// server/_core/security/crypto/keyManager.ts
// Pluggable interface: software fallback + AWS KMS stub + PKCS#11 stub

import crypto from 'crypto';
import AWS from 'aws-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

export class KeyManager {
  private backend: string;
  private kms?: AWS.KMS;
  private kmsKeyId?: string;
  private softwareKeyPath?: string;

  constructor(opts: { backend?: string; softwareKeyPath?: string } = {}) {
    this.backend = opts.backend || process.env.KEY_BACKEND || 'software';
    if (this.backend === 'aws-kms') {
      this.kms = new AWS.KMS({ region: process.env.AWS_REGION });
      this.kmsKeyId = process.env.AWS_KMS_KEYID;
    }
    // for PKCS#11 integrate with pkcs11js (not shown)
    // software private key for testing (DON'T use in production)
    this.softwareKeyPath = opts.softwareKeyPath || process.env.SOFTWARE_KEY_PATH;
  }

  async signMessage(hashBuffer: Buffer): Promise<Buffer> {
    if (this.backend === 'aws-kms') {
      // KMS sign - returns DER
      const params = {
        KeyId: this.kmsKeyId!,
        Message: hashBuffer,
        MessageType: 'DIGEST' as AWS.KMS.MessageType,
        SigningAlgorithm: 'ECDSA_SHA_256' // KMS supports this if key is secp256k1
      };
      const resp = await this.kms!.sign(params).promise();
      return Buffer.from(resp.Signature!, 'base64'); // DER
    } else {
      // software fallback (for dev)
      const pk = fs.readFileSync(this.softwareKeyPath!);
      const sign = crypto.createSign('sha256');
      sign.update(hashBuffer);
      sign.end();
      return sign.sign(pk); // DER
    }
  }

  async getPubKey(): Promise<Buffer> {
    // implement retrieval of public key corresponding to HSM/KMS key
    if (this.backend === 'aws-kms') {
      const resp = await this.kms!.getPublicKey({ KeyId: this.kmsKeyId! }).promise();
      return Buffer.from(resp.PublicKey!);
    } else {
      const pk = fs.readFileSync(this.softwareKeyPath!);
      const pub = crypto.createPublicKey(pk).export({ type: 'spki', format: 'der' }) as Buffer;
      return pub;
    }
  }
}
