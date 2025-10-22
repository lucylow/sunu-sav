// server/_core/security/secrets.ts

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SecurityConfig {
  nodeEnv: string;
  database: {
    host: string;
    name: string;
    user: string;
    password: string;
  };
  lightning: {
    lndRestUrl: string;
    macaroonPath: string;
    certPath: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

class SecretManager {
  private config: SecurityConfig;
  private encryptionKey: Buffer;

  constructor() {
    this.loadConfiguration();
    this.initializeEncryption();
  }

  private loadConfiguration(): void {
    // Validate required environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'LND_REST_URL',
      'LND_MACAROON_PATH',
      'LND_CERT_PATH',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.config = {
      nodeEnv: process.env.NODE_ENV!,
      database: {
        host: process.env.DB_HOST!,
        name: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
      },
      lightning: {
        lndRestUrl: process.env.LND_REST_URL!,
        macaroonPath: process.env.LND_MACAROON_PATH!,
        certPath: process.env.LND_CERT_PATH!,
      },
      jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY!,
        algorithm: 'aes-256-gcm',
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      },
    };
  }

  private initializeEncryption(): void {
    // Convert hex string to buffer
    this.encryptionKey = Buffer.from(this.config.encryption.key, 'hex');
    
    // Validate key length
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
  }

  /**
   * Encrypt sensitive data before storing in database
   */
  encrypt(text: string): { iv: string; data: string; authTag: string } {
    try {
      const algorithm = this.config.encryption.algorithm;
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.encryptionKey);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt sensitive data from database
   */
  decrypt(encryptedData: { iv: string; data: string; authTag: string }): string {
    try {
      const algorithm = this.config.encryption.algorithm;
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure random salt
   */
  generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate Bitcoin private key format
   */
  validatePrivateKey(privateKey: string): boolean {
    try {
      // Check if it's a valid hex string
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        return false;
      }
      
      // Additional validation could include checking key range
      const keyBuffer = Buffer.from(privateKey, 'hex');
      const keyBN = BigInt('0x' + privateKey);
      
      // Check if key is in valid range (1 to n-1 where n is the order of the secp256k1 curve)
      const secp256k1Order = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
      
      return keyBN > 0n && keyBN < secp256k1Order;
    } catch {
      return false;
    }
  }

  /**
   * Validate Bitcoin address format
   */
  validateBitcoinAddress(address: string): boolean {
    try {
      // Basic format validation
      const patterns = [
        /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy addresses
        /^bc1[a-z0-9]{39,59}$/, // Bech32 addresses
        /^tb1[a-z0-9]{39,59}$/, // Testnet bech32 addresses
      ];
      
      return patterns.some(pattern => pattern.test(address));
    } catch {
      return false;
    }
  }

  /**
   * Validate Lightning invoice format
   */
  validateLightningInvoice(invoice: string): boolean {
    try {
      // Basic Lightning invoice validation
      const pattern = /^lnbc\d+[munp]?[0-9a-z]+$/i;
      return pattern.test(invoice) && invoice.length >= 50 && invoice.length <= 2000;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig(): Omit<SecurityConfig, 'database' | 'jwt' | 'encryption'> {
    return {
      nodeEnv: this.config.nodeEnv,
      lightning: this.config.lightning,
      rateLimit: this.config.rateLimit,
    };
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.config.database;
  }

  /**
   * Get JWT configuration
   */
  getJWTConfig() {
    return this.config.jwt;
  }

  /**
   * Get Lightning configuration
   */
  getLightningConfig() {
    return this.config.lightning;
  }

  /**
   * Get rate limit configuration
   */
  getRateLimitConfig() {
    return this.config.rateLimit;
  }

  /**
   * Read macaroon file securely
   */
  readMacaroon(): Buffer {
    try {
      const macaroonPath = path.resolve(this.config.lightning.macaroonPath);
      
      // Security check: ensure file is within expected directory
      if (!macaroonPath.includes('macaroons') && !macaroonPath.includes('.macaroon')) {
        throw new Error('Invalid macaroon file path');
      }
      
      return fs.readFileSync(macaroonPath);
    } catch (error) {
      throw new Error('Failed to read macaroon: ' + error.message);
    }
  }

  /**
   * Read TLS certificate file securely
   */
  readTLSCert(): Buffer {
    try {
      const certPath = path.resolve(this.config.lightning.certPath);
      
      // Security check: ensure file is within expected directory
      if (!certPath.includes('tls.cert') && !certPath.includes('.crt')) {
        throw new Error('Invalid TLS certificate file path');
      }
      
      return fs.readFileSync(certPath);
    } catch (error) {
      throw new Error('Failed to read TLS certificate: ' + error.message);
    }
  }

  /**
   * Sanitize sensitive data for logging
   */
  sanitizeForLogging(data: any): any {
    const sensitiveFields = [
      'password', 'privateKey', 'mnemonic', 'seed', 'token', 'secret',
      'macaroon', 'cert', 'key', 'authTag', 'iv', 'encryptedData'
    ];
    
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }
    
    return sanitized;
  }
}

// Export singleton instance
export const secretManager = new SecretManager();
export default secretManager;
