const crypto = require('crypto');

/**
 * Raw body saver middleware - captures raw request body for HMAC verification
 * This must be used BEFORE express.json() middleware
 */
function rawBodySaver(req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf;
  }
}

/**
 * Setup raw body capture for webhook endpoints
 * @param {Express} app - Express application instance
 */
function setupRawBody(app) {
  // Use for JSON endpoints that receive webhooks
  app.use(require('express').json({ 
    verify: rawBodySaver, 
    limit: '50kb' 
  }));
  
  app.use(require('express').urlencoded({ 
    extended: true, 
    verify: rawBodySaver, 
    limit: '50kb' 
  }));
  
  // Also add raw parser for text/plain if required by gateway
  app.use(require('express').text({ 
    type: 'text/*', 
    verify: rawBodySaver, 
    limit: '50kb' 
  }));
}

/**
 * Webhook signature verification middleware
 * @param {Object} options - Configuration options
 * @param {string} options.headerName - Header name containing signature (default: 'x-sunu-signature')
 * @param {string} options.secretEnv - Environment variable name for secret (default: 'WEBHOOK_HMAC_SECRET')
 * @param {boolean} options.requireSignature - Whether to require signature (default: true)
 */
function verifyWebhookSecret(options = {}) {
  const headerName = (options.headerName || 'x-sunu-signature').toLowerCase();
  const secretEnv = options.secretEnv || 'WEBHOOK_HMAC_SECRET';
  const requireSignature = options.requireSignature !== false;
  const secret = process.env[secretEnv];
  
  if (!secret && requireSignature) {
    console.warn(`Warning: ${secretEnv} not configured; middleware will reject requests`);
  }

  return function (req, res, next) {
    try {
      // Check if raw body is available
      const raw = req.rawBody;
      if (!raw) {
        return res.status(400).json({ 
          error: 'No raw body for webhook verification',
          error_code: 'MISSING_RAW_BODY'
        });
      }

      // Get signature header
      const sigHeader = (req.get(headerName) || '').trim();
      if (!sigHeader) {
        if (requireSignature) {
          return res.status(401).json({ 
            error: 'Missing signature header',
            error_code: 'MISSING_SIGNATURE',
            expected_header: headerName
          });
        } else {
          // Skip verification if signature not required and not provided
          return next();
        }
      }

      if (!secret) {
        return res.status(500).json({ 
          error: 'Webhook secret not configured',
          error_code: 'SECRET_NOT_CONFIGURED'
        });
      }

      // Parse signature - support formats like "sha256=hex" or just "hex"
      let providedHex = sigHeader;
      if (providedHex.startsWith('sha256=')) {
        providedHex = providedHex.split('=')[1];
      }

      // Compute HMAC using raw body bytes
      const computed = crypto.createHmac('sha256', secret)
        .update(raw)
        .digest('hex');

      // Use timingSafeEqual for constant-time comparison
      const providedBuf = Buffer.from(providedHex, 'hex');
      const computedBuf = Buffer.from(computed, 'hex');
      
      if (providedBuf.length !== computedBuf.length) {
        return res.status(401).json({ 
          error: 'Invalid signature length',
          error_code: 'INVALID_SIGNATURE_LENGTH'
        });
      }
      
      if (!crypto.timingSafeEqual(providedBuf, computedBuf)) {
        return res.status(401).json({ 
          error: 'Invalid signature',
          error_code: 'INVALID_SIGNATURE'
        });
      }

      // Signature verified successfully
      console.log(`Webhook signature verified for ${req.path}`);
      next();
      
    } catch (err) {
      console.error('Webhook verification error:', err);
      return res.status(401).json({ 
        error: 'Signature verification failed',
        error_code: 'VERIFICATION_ERROR'
      });
    }
  };
}

/**
 * Generate HMAC signature for testing purposes
 * @param {string} payload - Raw payload string
 * @param {string} secret - HMAC secret
 * @returns {string} - HMAC signature in hex format
 */
function generateSignature(payload, secret) {
  return crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Generate signature with prefix (e.g., "sha256=hex")
 * @param {string} payload - Raw payload string
 * @param {string} secret - HMAC secret
 * @param {string} algorithm - Algorithm prefix (default: 'sha256')
 * @returns {string} - Prefixed HMAC signature
 */
function generateSignatureWithPrefix(payload, secret, algorithm = 'sha256') {
  const signature = generateSignature(payload, secret);
  return `${algorithm}=${signature}`;
}

module.exports = { 
  setupRawBody, 
  verifyWebhookSecret, 
  generateSignature, 
  generateSignatureWithPrefix 
};
