// server/_core/security/integration.ts
// Backend integration example showing how to use the security framework

import { lndClient } from './lndClient';
import { verifyBolt11, verifyPreimage } from './lnHelpers';
import { signWebhookPayload, verifyWebhookSignature } from './webhooks';
import { countValidMultiSigs } from './crypto/multisigCheck';
import { KeyManager } from './crypto/keyManager';
import { validateContribution } from './verify/paymentProof';
import { appendAuditEntry } from './audit/auditLog';

export class SecurityIntegration {
  private static instance: SecurityIntegration;
  private keyManager: KeyManager;

  constructor() {
    this.keyManager = new KeyManager();
  }

  static getInstance(): SecurityIntegration {
    if (!SecurityIntegration.instance) {
      SecurityIntegration.instance = new SecurityIntegration();
    }
    return SecurityIntegration.instance;
  }

  /**
   * Process a Lightning payment securely
   */
  async processPayment(invoice: string, metadata: any): Promise<any> {
    try {
      // Verify the invoice
      const decoded = verifyBolt11(invoice);
      
      // Log the payment attempt
      appendAuditEntry({
        action: 'payment_attempt',
        invoice: invoice,
        amount: decoded.satoshis || decoded.millisatoshis / 1000,
        metadata: metadata,
        timestamp: new Date().toISOString()
      });

      // Create LND client and process payment
      const client = lndClient();
      
      return new Promise((resolve, reject) => {
        client.sendPaymentSync({ payment_request: invoice }, async (err: any, response: any) => {
          if (err || response.payment_error) {
            // Log failed payment
            appendAuditEntry({
              action: 'payment_failed',
              invoice: invoice,
              error: response?.payment_error || err?.message,
              timestamp: new Date().toISOString()
            });
            
            reject(new Error(response?.payment_error || err?.message));
            return;
          }

          // Log successful payment
          appendAuditEntry({
            action: 'payment_succeeded',
            invoice: invoice,
            paymentHash: response.payment_hash,
            preimage: response.payment_preimage,
            fee: response.payment_route?.total_fees || 0,
            timestamp: new Date().toISOString()
          });

          resolve({
            paymentHash: response.payment_hash,
            preimage: response.payment_preimage,
            fee: response.payment_route?.total_fees || 0,
            route: response.payment_route
          });
        });
      });
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Verify a payment preimage
   */
  async verifyPayment(preimageHex: string, rHashHex: string): Promise<boolean> {
    try {
      const isValid = verifyPreimage(preimageHex, rHashHex);
      
      appendAuditEntry({
        action: 'payment_verification',
        preimage: preimageHex,
        rHash: rHashHex,
        isValid: isValid,
        timestamp: new Date().toISOString()
      });

      return isValid;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Validate a contribution with preimage
   */
  async validateContribution(preimageHex: string, expectedRHash: string): Promise<boolean> {
    try {
      const isValid = await validateContribution({ preimageHex, expectedRHash });
      
      appendAuditEntry({
        action: 'contribution_validation',
        preimage: preimageHex,
        expectedRHash: expectedRHash,
        isValid: isValid,
        timestamp: new Date().toISOString()
      });

      return isValid;
    } catch (error) {
      console.error('Contribution validation failed:', error);
      throw error;
    }
  }

  /**
   * Verify multisig signatures
   */
  async verifyMultisig(signatures: Buffer[], pubkeys: Buffer[], messageHash: Buffer, requiredSignatures: number): Promise<boolean> {
    try {
      const validSignatures = countValidMultiSigs(signatures, pubkeys, messageHash);
      const isValid = validSignatures >= requiredSignatures;
      
      appendAuditEntry({
        action: 'multisig_verification',
        validSignatures: validSignatures,
        requiredSignatures: requiredSignatures,
        isValid: isValid,
        timestamp: new Date().toISOString()
      });

      return isValid;
    } catch (error) {
      console.error('Multisig verification failed:', error);
      throw error;
    }
  }

  /**
   * Sign a message with HSM/KMS
   */
  async signMessage(messageHash: Buffer): Promise<Buffer> {
    try {
      const signature = await this.keyManager.signMessage(messageHash);
      
      appendAuditEntry({
        action: 'message_signed',
        messageHash: messageHash.toString('hex'),
        signature: signature.toString('hex'),
        timestamp: new Date().toISOString()
      });

      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  /**
   * Get public key from HSM/KMS
   */
  async getPublicKey(): Promise<Buffer> {
    try {
      const publicKey = await this.keyManager.getPubKey();
      return publicKey;
    } catch (error) {
      console.error('Failed to get public key:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: any, signature: string, secret: string): boolean {
    try {
      const isValid = verifyWebhookSignature(payload, signature, secret);
      
      appendAuditEntry({
        action: 'webhook_verification',
        signature: signature,
        isValid: isValid,
        timestamp: new Date().toISOString()
      });

      return isValid;
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Sign webhook payload
   */
  signWebhook(payload: any, secret: string): string {
    try {
      const signature = signWebhookPayload(payload, secret);
      return signature;
    } catch (error) {
      console.error('Webhook signing failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const securityIntegration = SecurityIntegration.getInstance();
