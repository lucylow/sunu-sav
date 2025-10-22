# SunuSàv — Threat Model (Enterprise Security)

## Purpose
Document key assets, entry points, threats, and mitigations for the SunuSàv Bitcoin tontine platform. This threat model covers both traditional web security and Bitcoin/Lightning-specific threats.

## Assets
- **Bitcoin/Lightning funds**: Channels, on-chain UTXOs, multisig wallets
- **Private keys**: HD wallet seeds, Lightning node keys, macaroons, signing keys
- **User data**: Phone hashes, group membership, contribution receipts (avoiding PII)
- **Server secrets**: API keys, KMS credentials, JWT secrets, webhook secrets
- **Logs & backups**: Audit trails, channel backups, database backups
- **Smart contracts**: Multisig scripts, time-locked contracts, dispute mechanisms

## Entry Points
- **Mobile API endpoints** (`/api/*`): Primary user interface
- **USSD/SMS gateway integrations**: Mobile-first communication
- **Admin UI/operator APIs**: Management and monitoring interfaces
- **Lightning node RPC/gRPC endpoints**: LND, Core Lightning, BTCPay integration
- **CI/CD pipeline and infrastructure**: Deployment and updates
- **WebSocket connections**: Real-time updates and notifications
- **Third-party integrations**: Payment processors, notification services

## STRIDE Threat Analysis

### Spoofing Threats
**Threat**: Attacker impersonates legitimate users or administrators
- **User impersonation**: Fake JWT tokens, stolen credentials
- **Admin impersonation**: Privilege escalation, unauthorized access
- **Node impersonation**: Fake Lightning nodes, man-in-the-middle attacks

**Mitigations**:
- JWT with short TTL (15 minutes) and secure signing
- Multi-factor authentication for admin operations
- Request signing with idempotency UUIDs for financial actions
- Certificate pinning for Lightning node communications
- Hardware security modules for critical operations

### Tampering Threats
**Threat**: Attacker alters data in transit or at rest
- **Contribution tampering**: Modifying payment amounts or recipients
- **Channel state tampering**: Altering Lightning channel balances
- **Database tampering**: Unauthorized modification of records
- **Log tampering**: Covering tracks or creating false audit trails

**Mitigations**:
- HMAC-signed receipts for all financial transactions
- Server-side deduplication by client UUID
- Strict input validation with Pydantic models
- Cryptographic audit logging with append-only storage
- Database integrity constraints and foreign keys
- Channel state verification with Lightning watchtowers

### Repudiation Threats
**Threat**: Users deny participation or dispute transactions
- **Contribution disputes**: "I didn't make that payment"
- **Payout disputes**: "I didn't receive my share"
- **Group membership disputes**: "I wasn't part of that group"

**Mitigations**:
- Signed receipts with cryptographic proof
- Store HMACs for all financial operations
- Optional daily Merkle root anchoring on-chain
- Comprehensive audit logging with immutable timestamps
- Multi-signature requirements for group operations
- Lightning preimage verification for payments

### Information Disclosure Threats
**Threat**: Sensitive data exposed through various vectors
- **PII leakage**: Phone numbers, personal data in logs
- **Financial data exposure**: Payment amounts, wallet balances
- **Private key exposure**: Seeds, macaroons, signing keys
- **Channel information**: Lightning channel states, routing data

**Mitigations**:
- PII scrubbing middleware for all logs
- Field-level encryption for sensitive database columns
- Secure key storage using hardware security modules
- Audit logging with automatic redaction
- Network segmentation and access controls
- Regular security audits and penetration testing

### Denial of Service Threats
**Threat**: System unavailable due to malicious or accidental overload
- **API spam**: Rate limiting bypass, resource exhaustion
- **Sync storms**: Mass offline contribution synchronization
- **Lightning network attacks**: Channel flooding, routing attacks
- **Database overload**: Query complexity attacks

**Mitigations**:
- Comprehensive rate limiting with IP and user-based limits
- Connection pooling and backpressure mechanisms
- Circuit breakers for external service calls
- Database query optimization and indexing
- CDN and caching for static content
- Monitoring and alerting for resource usage

### Elevation of Privilege Threats
**Threat**: Unauthorized access to administrative functions
- **Role escalation**: Gaining admin privileges
- **Database privilege escalation**: Direct database access
- **Lightning node access**: Unauthorized channel management
- **Infrastructure access**: Server compromise

**Mitigations**:
- Role-based access control (RBAC) with least privilege
- Multi-factor authentication for administrative functions
- Audit trails for all privilege changes
- Network segmentation and firewall rules
- Regular privilege reviews and access audits
- Secure development practices and code reviews

## Bitcoin/Lightning Specific Threats

### Lightning Network Threats
- **Channel state attacks**: Attempting to broadcast old channel states
- **Routing attacks**: Malicious routing to steal funds
- **Fee manipulation**: Exploiting fee estimation vulnerabilities
- **Channel jamming**: Preventing channel closure or payment routing

**Mitigations**:
- Watchtower integration for fraud protection
- Multiple routing providers and fallback mechanisms
- Conservative fee estimation with safety margins
- Channel backup and recovery procedures
- Regular channel monitoring and health checks

### Multisig Wallet Threats
- **Key compromise**: Loss or theft of signing keys
- **Signature manipulation**: Forged or coerced signatures
- **Script vulnerabilities**: Malicious script execution
- **Time-lock bypass**: Circumventing dispute periods

**Mitigations**:
- Hardware security modules for key storage
- Multi-signature verification with threshold requirements
- Script auditing and standardized templates
- Time-lock validation and enforcement
- Emergency recovery procedures

### On-Chain Threats
- **Transaction malleability**: UTXO confusion attacks
- **Fee sniping**: Transaction replacement attacks
- **Mempool manipulation**: Transaction ordering attacks
- **Reorg attacks**: Chain reorganization exploitation

**Mitigations**:
- RBF (Replace-By-Fee) protection
- Conservative confirmation requirements
- Multiple confirmation sources
- Transaction monitoring and alerting
- Emergency response procedures

## Operational Security Measures

### Key Management
- **Hardware Security Modules**: Store critical signing keys in secure hardware
- **Key rotation**: Regular rotation of API keys and certificates
- **Backup procedures**: Secure backup of essential keys and seeds
- **Access controls**: Strict access controls for key management systems

### Monitoring and Alerting
- **Real-time monitoring**: System health, performance, and security metrics
- **Anomaly detection**: Unusual patterns in user behavior or transactions
- **Alert systems**: Immediate notification of security events
- **Incident response**: Documented procedures for security incidents

### Backup and Recovery
- **Channel backups**: Lightning channel state backups
- **Database backups**: Encrypted, off-site database backups
- **Key backups**: Secure backup of essential cryptographic material
- **Disaster recovery**: Tested procedures for system restoration

### Compliance and Auditing
- **Regular audits**: Security assessments and penetration testing
- **Compliance monitoring**: Adherence to security policies and procedures
- **Documentation**: Comprehensive security documentation and procedures
- **Training**: Security awareness training for all team members

## Security Controls Matrix

| Control Category | Implementation | Status |
|------------------|----------------|---------|
| Authentication | JWT + MFA + Request Signing | ✅ Implemented |
| Authorization | RBAC + Least Privilege | ✅ Implemented |
| Encryption | TLS 1.3 + Field Encryption | ✅ Implemented |
| Audit Logging | Signed + Immutable | ✅ Implemented |
| Key Management | HSM + Rotation | ✅ Implemented |
| Input Validation | Pydantic + Sanitization | ✅ Implemented |
| Rate Limiting | IP + User-based | ✅ Implemented |
| Monitoring | Real-time + Alerts | ✅ Implemented |
| Backup | Encrypted + Off-site | ✅ Implemented |
| Incident Response | Documented + Tested | ✅ Implemented |

## Risk Assessment

### High Risk
- **Private key compromise**: Could result in total fund loss
- **Lightning channel attacks**: Could result in significant financial loss
- **Database compromise**: Could expose sensitive user data

### Medium Risk
- **API abuse**: Could impact service availability
- **Social engineering**: Could lead to unauthorized access
- **Third-party vulnerabilities**: Could affect integrated services

### Low Risk
- **Information disclosure**: Limited impact due to minimal PII storage
- **Denial of service**: Mitigated by rate limiting and monitoring

## Review and Update Schedule

- **Monthly**: Review threat model for new threats and mitigations
- **Quarterly**: Update risk assessment and control effectiveness
- **Annually**: Comprehensive security review and penetration testing
- **As needed**: Update following security incidents or major changes

---

**Last Updated**: 2024-10-22  
**Next Review**: 2024-11-22  
**Version**: 1.0  
**Approved By**: Security Team
