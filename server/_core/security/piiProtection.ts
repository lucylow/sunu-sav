// server/_core/security/piiProtection.ts

import * as crypto from 'crypto';

interface SensitiveField {
  name: string;
  pattern?: RegExp;
  replacement: string;
}

class PIIProtection {
  private sensitiveFields: SensitiveField[] = [
    // Personal Information
    { name: 'phoneNumber', replacement: '[REDACTED_PHONE]' },
    { name: 'email', replacement: '[REDACTED_EMAIL]' },
    { name: 'name', replacement: '[REDACTED_NAME]' },
    { name: 'address', replacement: '[REDACTED_ADDRESS]' },
    { name: 'fullName', replacement: '[REDACTED_FULL_NAME]' },
    
    // Financial Information
    { name: 'privateKey', replacement: '[REDACTED_PRIVATE_KEY]' },
    { name: 'mnemonic', replacement: '[REDACTED_MNEMONIC]' },
    { name: 'seed', replacement: '[REDACTED_SEED]' },
    { name: 'walletSeed', replacement: '[REDACTED_WALLET_SEED]' },
    { name: 'paymentHash', replacement: '[REDACTED_PAYMENT_HASH]' },
    { name: 'txHash', replacement: '[REDACTED_TX_HASH]' },
    { name: 'invoice', replacement: '[REDACTED_INVOICE]' },
    { name: 'paymentRequest', replacement: '[REDACTED_PAYMENT_REQUEST]' },
    
    // Authentication & Security
    { name: 'password', replacement: '[REDACTED_PASSWORD]' },
    { name: 'token', replacement: '[REDACTED_TOKEN]' },
    { name: 'secret', replacement: '[REDACTED_SECRET]' },
    { name: 'apiKey', replacement: '[REDACTED_API_KEY]' },
    { name: 'macaroon', replacement: '[REDACTED_MACAROON]' },
    { name: 'cert', replacement: '[REDACTED_CERT]' },
    { name: 'authTag', replacement: '[REDACTED_AUTH_TAG]' },
    { name: 'iv', replacement: '[REDACTED_IV]' },
    { name: 'encryptedData', replacement: '[REDACTED_ENCRYPTED_DATA]' },
    
    // Bitcoin-specific
    { name: 'bitcoinAddress', replacement: '[REDACTED_BITCOIN_ADDRESS]' },
    { name: 'lightningAddress', replacement: '[REDACTED_LIGHTNING_ADDRESS]' },
    { name: 'publicKey', replacement: '[REDACTED_PUBLIC_KEY]' },
    { name: 'signature', replacement: '[REDACTED_SIGNATURE]' },
    
    // System Information
    { name: 'sessionId', replacement: '[REDACTED_SESSION_ID]' },
    { name: 'userId', replacement: '[REDACTED_USER_ID]' },
    { name: 'groupId', replacement: '[REDACTED_GROUP_ID]' },
  ];

  private regexPatterns: { [key: string]: RegExp } = {
    // Senegalese phone numbers
    phoneSenegal: /(\+221[-\s]?)?[76][\d]{7}/g,
    
    // Bitcoin addresses
    bitcoinLegacy: /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g,
    bitcoinBech32: /bc1[a-z0-9]{39,59}/g,
    bitcoinTestnet: /tb1[a-z0-9]{39,59}/g,
    
    // Lightning invoices
    lightningInvoice: /lnbc\d+[munp]?[0-9a-z]+/gi,
    
    // Email addresses
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // Private keys (hex format)
    privateKey: /[0-9a-fA-F]{64}/g,
    
    // Mnemonic phrases
    mnemonic: /\b[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\b/g,
    
    // Payment hashes
    paymentHash: /[0-9a-fA-F]{64}/g,
    
    // JWT tokens
    jwtToken: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    
    // API keys (common patterns)
    apiKey: /[a-zA-Z0-9]{32,}/g,
  };

  /**
   * Scrub sensitive data from an object
   */
  scrubObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.scrubString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubObject(item));
    }

    if (typeof obj === 'object') {
      const scrubbed: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const scrubbedKey = this.scrubFieldName(key);
        scrubbed[scrubbedKey] = this.scrubObject(value);
      }
      
      return scrubbed;
    }

    return obj;
  }

  /**
   * Scrub sensitive data from a string
   */
  scrubString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    let scrubbed = str;

    // Apply regex patterns
    for (const [patternName, pattern] of Object.entries(this.regexPatterns)) {
      scrubbed = scrubbed.replace(pattern, `[REDACTED_${patternName.toUpperCase()}]`);
    }

    return scrubbed;
  }

  /**
   * Scrub field names that might contain sensitive data
   */
  scrubFieldName(fieldName: string): string {
    const lowerFieldName = fieldName.toLowerCase();
    
    for (const field of this.sensitiveFields) {
      if (lowerFieldName.includes(field.name.toLowerCase())) {
        return field.replacement;
      }
    }
    
    return fieldName;
  }

  /**
   * Create a safe logger that automatically scrubs PII
   */
  createSafeLogger(originalLogger: any) {
    return {
      info: (message: string, data?: any) => {
        originalLogger.info(message, this.scrubObject(data));
      },
      warn: (message: string, data?: any) => {
        originalLogger.warn(message, this.scrubObject(data));
      },
      error: (message: string, data?: any) => {
        originalLogger.error(message, this.scrubObject(data));
      },
      debug: (message: string, data?: any) => {
        originalLogger.debug(message, this.scrubObject(data));
      },
    };
  }

  /**
   * Hash sensitive data for analytics (one-way)
   */
  hashForAnalytics(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }

  /**
   * Mask phone numbers for display (keep first 3 and last 2 digits)
   */
  maskPhoneNumber(phone: string): string {
    if (phone.length < 5) return '[REDACTED]';
    
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length < 5) return '[REDACTED]';
    
    const firstThree = cleaned.substring(0, 3);
    const lastTwo = cleaned.substring(cleaned.length - 2);
    const masked = '*'.repeat(cleaned.length - 5);
    
    return `${firstThree}${masked}${lastTwo}`;
  }

  /**
   * Mask Bitcoin addresses for display (keep first 6 and last 4 characters)
   */
  maskBitcoinAddress(address: string): string {
    if (address.length < 10) return '[REDACTED]';
    
    const firstSix = address.substring(0, 6);
    const lastFour = address.substring(address.length - 4);
    const masked = '*'.repeat(address.length - 10);
    
    return `${firstSix}${masked}${lastFour}`;
  }

  /**
   * Mask email addresses for display (keep first 2 and domain)
   */
  maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return '[REDACTED]';
    
    if (localPart.length <= 2) {
      return `*@${domain}`;
    }
    
    const firstTwo = localPart.substring(0, 2);
    const masked = '*'.repeat(localPart.length - 2);
    
    return `${firstTwo}${masked}@${domain}`;
  }

  /**
   * Create Express middleware for automatic PII scrubbing
   */
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const originalSend = res.send;
      const startTime = Date.now();

      // Scrub request body
      const scrubbedBody = this.scrubObject(req.body);
      
      res.send = function (body: any) {
        const duration = Date.now() - startTime;
        
        // Scrub the response body
        let scrubbedResponse = body;
        try {
          if (typeof body === 'string') {
            const jsonResp = JSON.parse(body);
            scrubbedResponse = JSON.stringify(this.scrubObject(jsonResp));
          } else {
            scrubbedResponse = this.scrubObject(body);
          }
        } catch (e) {
          // If not JSON, scrub as string
          scrubbedResponse = this.scrubString(body);
        }

        // Log the scrubbed data
        console.log('API Request Completed', {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration: duration,
          requestBody: scrubbedBody,
          responseBody: scrubbedResponse,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
        });
        
        originalSend.call(this, scrubbedResponse);
      };
      
      next();
    };
  }

  /**
   * Validate that no PII is present in logs
   */
  validateLogSafety(logData: any): { safe: boolean; violations: string[] } {
    const violations: string[] = [];
    
    const checkForPII = (obj: any, path: string = '') => {
      if (typeof obj === 'string') {
        // Check for patterns that might indicate PII
        for (const [patternName, pattern] of Object.entries(this.regexPatterns)) {
          if (pattern.test(obj)) {
            violations.push(`Potential ${patternName} found in ${path}`);
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          checkForPII(value, currentPath);
        }
      }
    };
    
    checkForPII(logData);
    
    return {
      safe: violations.length === 0,
      violations,
    };
  }

  /**
   * Get statistics about scrubbing operations
   */
  getScrubbingStats(): { totalFields: number; totalPatterns: number } {
    return {
      totalFields: this.sensitiveFields.length,
      totalPatterns: Object.keys(this.regexPatterns).length,
    };
  }
}

// Export singleton instance
export const piiProtection = new PIIProtection();
export default piiProtection;
