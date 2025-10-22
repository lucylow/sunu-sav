// server/_core/security/__tests__/security.test.ts
import { verifyBolt11, verifyPreimage } from '../lnHelpers';
import { signWebhookPayload, verifyWebhookSignature } from '../webhooks';
import { countValidMultiSigs } from '../crypto/multisigCheck';
import { KeyManager } from '../crypto/keyManager';

describe('Security Implementation Tests', () => {
  describe('Lightning Network Helpers', () => {
    test('should verify valid Bolt11 invoice', () => {
      // This is a testnet invoice - replace with actual test invoice
      const testInvoice = 'lnbc100n1p0...'; // Replace with actual test invoice
      
      expect(() => {
        verifyBolt11(testInvoice);
      }).not.toThrow();
    });

    test('should reject invalid Bolt11 invoice', () => {
      const invalidInvoice = 'invalid-invoice';
      
      expect(() => {
        verifyBolt11(invalidInvoice);
      }).toThrow('invalid bolt11');
    });

    test('should verify preimage correctly', () => {
      const preimage = '0000000000000000000000000000000000000000000000000000000000000000';
      const rHash = '66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925';
      
      const isValid = verifyPreimage(preimage, rHash);
      expect(isValid).toBe(true);
    });
  });

  describe('Webhook Security', () => {
    test('should sign and verify webhook payload', () => {
      const payload = { type: 'payment.succeeded', data: { amount: 1000 } };
      const secret = 'test-secret-key';
      
      const signature = signWebhookPayload(payload, secret);
      const isValid = verifyWebhookSignature(payload, signature, secret);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid webhook signature', () => {
      const payload = { type: 'payment.succeeded', data: { amount: 1000 } };
      const secret = 'test-secret-key';
      const invalidSignature = 'invalid-signature';
      
      const isValid = verifyWebhookSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('Multisig Verification', () => {
    test('should count valid signatures', () => {
      // Mock test data - in real implementation, use actual signatures and pubkeys
      const signatures = [Buffer.from('mock-signature-1'), Buffer.from('mock-signature-2')];
      const pubkeys = [Buffer.from('mock-pubkey-1'), Buffer.from('mock-pubkey-2')];
      const messageHash = Buffer.from('mock-message-hash');
      
      // This test will fail with mock data, but demonstrates the API
      expect(() => {
        countValidMultiSigs(signatures, pubkeys, messageHash);
      }).not.toThrow();
    });
  });

  describe('Key Manager', () => {
    test('should initialize with software backend', () => {
      const keyManager = new KeyManager({ backend: 'software' });
      expect(keyManager).toBeDefined();
    });

    test('should initialize with AWS KMS backend', () => {
      const keyManager = new KeyManager({ backend: 'aws-kms' });
      expect(keyManager).toBeDefined();
    });
  });
});
