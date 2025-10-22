# 🔒 SunuSàv Security Implementation Guide

This document outlines the comprehensive security framework implemented for SunuSàv, covering both frontend and backend security measures.

## 🏗️ Architecture Overview

The security framework is organized into several key components:

### Frontend Security (`client/src/lib/security/`)
- **Secure API Client**: TLS + certificate pinning with Axios
- **Secure Storage**: Keychain-based storage for sensitive data
- **Secure WebSocket**: Authenticated WebSocket connections

### Backend Security (`server/_core/security/`)
- **HTTPS Server**: Express with TLS/MTLS support
- **LND Client**: Secure gRPC client with macaroon authentication
- **Payment Routes**: Bolt11 validation and optimistic updates
- **Webhook Security**: HMAC signature verification
- **Crypto Helpers**: Lightning verification and multisig support
- **HSM Integration**: Pluggable key management abstraction
- **Audit Logging**: Signed audit trail

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Security dependencies are already added to package.json
npm install --legacy-peer-deps
```

### 2. Environment Configuration

Copy the security template and configure:

```bash
cp security.env.template .env
# Edit .env with your actual values
```

### 3. Certificate Setup

```bash
# Generate TLS certificates (development)
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes

# Set proper permissions
chmod 600 certs/server.key certs/server.crt
```

### 4. LND Configuration

Ensure your LND node is running and accessible:

```bash
# Set LND paths in .env
LND_TLS_CERT=/path/to/lnd/tls.cert
LND_MACAROON_PATH=/path/to/lnd/admin.macaroon
LND_GRPC_HOST=127.0.0.1:10009
```

## 📱 Frontend Security Implementation

### Secure API Client

```typescript
import secureApi from '@/lib/security/secureApi';

// Use the secure API client for all requests
const response = await secureApi.post('/api/payments/pay', {
  invoice: 'lnbc...',
  metadata: { groupId: '123' }
});
```

### Secure Storage

```typescript
import { saveMacaroon, getMacaroon, saveApiToken } from '@/lib/security/secureStore';

// Store sensitive data securely
await saveMacaroon(macaroonHex);
await saveApiToken(jwtToken);

// Retrieve when needed
const macaroon = await getMacaroon();
```

### Secure WebSocket

```typescript
import { createSecureSocket } from '@/lib/security/secureSocket';

const socket = await createSecureSocket('wss://api.sunu-sav.example/ws');
```

## 🖥️ Backend Security Implementation

### HTTPS Server Setup

```typescript
import app from './security/server';

// Server automatically starts with HTTPS
// Configure TLS certificates in .env
```

### Payment Processing

```typescript
import { paymentRouter } from './security/routes/payments';

// Mount the secure payment router
app.use('/api/payments', paymentRouter);
```

### Webhook Verification

```typescript
import { verifyWebhookSignature } from './security/webhooks';

app.post('/webhook/payment', (req, res) => {
  const signature = req.headers['x-sunu-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
});
```

### Lightning Network Integration

```typescript
import { lndClient } from './security/lndClient';
import { verifyBolt11, verifyPreimage } from './security/lnHelpers';

// Create LND client
const client = lndClient();

// Verify invoice
const decoded = verifyBolt11(invoice);

// Verify payment preimage
const isValid = verifyPreimage(preimageHex, rHashHex);
```

### Multisig Verification

```typescript
import { countValidMultiSigs } from './security/crypto/multisigCheck';

const validSignatures = countValidMultiSigs(signatures, pubkeys, messageHash);
const requiredSignatures = 2; // 2-of-3 multisig

if (validSignatures >= requiredSignatures) {
  // Multisig transaction is valid
}
```

### HSM/Key Management

```typescript
import { KeyManager } from './security/crypto/keyManager';

const keyManager = new KeyManager({
  backend: 'aws-kms', // or 'software' for development
});

// Sign a message
const signature = await keyManager.signMessage(messageHash);

// Get public key
const publicKey = await keyManager.getPubKey();
```

### Audit Logging

```typescript
import { appendAuditEntry } from './security/audit/auditLog';

// Log security events
appendAuditEntry({
  action: 'payment_processed',
  userId: 'user123',
  amount: 1000,
  invoice: 'lnbc...',
  timestamp: new Date().toISOString()
});
```

## 🔐 Security Best Practices

### 1. Certificate Management

- **Production**: Use Let's Encrypt or commercial certificates
- **Development**: Generate self-signed certificates
- **Rotation**: Implement certificate rotation procedures
- **Pinning**: Use certificate pinning on mobile clients

### 2. Secret Management

- **Environment Variables**: Use for configuration, not secrets
- **Secret Stores**: Use AWS Secrets Manager, HashiCorp Vault, or similar
- **Rotation**: Rotate secrets regularly
- **Access Control**: Limit access to secrets

### 3. Macaroon Security

- **Least Privilege**: Use minimal required permissions
- **Rotation**: Rotate macaroons periodically
- **Storage**: Store in secure keychain/HSM
- **Transport**: Use secure channels for macaroon exchange

### 4. Database Security

- **Encryption**: Encrypt sensitive data at rest
- **Access Control**: Use least privilege database users
- **Audit**: Log all database access
- **Backups**: Secure backup storage

### 5. Network Security

- **TLS**: Enforce TLS 1.3 everywhere
- **MTLS**: Use mutual TLS for service-to-service communication
- **Firewall**: Implement network segmentation
- **Monitoring**: Monitor network traffic for anomalies

## 🧪 Testing Security

### 1. Unit Tests

```bash
# Run security-related tests
npm test -- --testPathPattern=security
```

### 2. Integration Tests

```bash
# Test with real LND node (testnet)
npm run test:integration
```

### 3. Security Scanning

```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🚨 Incident Response

### 1. Security Monitoring

- Monitor audit logs for suspicious activity
- Set up alerts for failed authentication attempts
- Track unusual payment patterns
- Monitor certificate expiration

### 2. Incident Procedures

1. **Detection**: Identify security incidents
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze the incident
4. **Recovery**: Restore normal operations
5. **Lessons Learned**: Update security measures

### 3. Emergency Contacts

- Security Team: security@sunu-sav.com
- Development Team: dev@sunu-sav.com
- Operations Team: ops@sunu-sav.com

## 📋 Deployment Checklist

### Pre-deployment

- [ ] All secrets configured in secure stores
- [ ] TLS certificates valid and properly configured
- [ ] LND node accessible and authenticated
- [ ] Database security configured
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Security tests passing

### Post-deployment

- [ ] Monitor security logs
- [ ] Verify HTTPS enforcement
- [ ] Test webhook signatures
- [ ] Validate payment flows
- [ ] Check certificate pinning
- [ ] Verify audit trail

## 🔧 Troubleshooting

### Common Issues

1. **Certificate Errors**
   - Check certificate paths in .env
   - Verify certificate validity
   - Ensure proper file permissions

2. **LND Connection Issues**
   - Verify LND node is running
   - Check macaroon permissions
   - Validate TLS certificate

3. **Webhook Signature Failures**
   - Verify WEBHOOK_SECRET matches
   - Check signature header format
   - Validate payload structure

4. **Storage Issues**
   - Check keychain permissions
   - Verify storage service availability
   - Validate data format

## 📚 Additional Resources

- [Lightning Network Security](https://docs.lightning.engineering/lightning-network-tools/lnd/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Native Security](https://reactnative.dev/docs/security)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security-testing-guide/)

## 🤝 Contributing

When contributing to security-related code:

1. Follow security best practices
2. Add comprehensive tests
3. Update documentation
4. Review with security team
5. Test in staging environment

---

**⚠️ Security Notice**: This implementation provides a solid foundation, but security is an ongoing process. Regular audits, updates, and monitoring are essential for maintaining security posture.
