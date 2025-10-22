/**
 * Lightning Network utility functions for parsing invoices and LNURL
 */

/**
 * Parse Lightning payload from scanned QR code
 * Detects whether the scanned text is:
 * - a BOLT11 invoice (starts with lnbc/lnbcrt... / bech32-like)
 * - an LNURL (lnurl1...)
 * - a plain lightning: URI (lightning:lnbc1...)
 * 
 * Returns a typed object with parsed information
 */
export function parseLightningPayload(raw) {
  const trimmed = (raw || '').trim();

  // Remove common prefix
  const normalized = trimmed.replace(/^lightning:/i, '');

  // Detect LNURL (bech32 prefix 'lnurl1...')
  if (/^lnurl1/i.test(normalized)) {
    return { 
      type: 'lnurl', 
      lnurl: normalized,
      raw: normalized 
    };
  }

  // Try BOLT11 decode (simplified detection)
  if (/^lnbc/i.test(normalized)) {
    try {
      // Basic BOLT11 parsing - in a real app you'd use a proper library
      const parts = normalized.split('1');
      if (parts.length >= 2) {
        const amountMatch = parts[0].match(/lnbc(\d+)/);
        const amount = amountMatch ? parseInt(amountMatch[1]) : null;
        
        return { 
          type: 'bolt11', 
          invoice: normalized, 
          amountSats: amount,
          raw: normalized 
        };
      }
    } catch (err) {
      // Not a valid BOLT11 invoice
    }
  }

  // Fallback: unknown
  return { 
    type: 'unknown', 
    raw: normalized 
  };
}

/**
 * Validate Lightning invoice format
 */
export function isValidLightningInvoice(invoice) {
  if (!invoice || typeof invoice !== 'string') return false;
  
  // Basic BOLT11 format validation
  return /^lnbc[a-z0-9]+$/i.test(invoice);
}

/**
 * Extract amount from Lightning invoice (simplified)
 */
export function extractAmountFromInvoice(invoice) {
  if (!isValidLightningInvoice(invoice)) return null;
  
  try {
    const match = invoice.match(/lnbc(\d+)/);
    return match ? parseInt(match[1]) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Format amount for display
 */
export function formatAmount(amountSats) {
  if (!amountSats) return '0 sats';
  
  return `${amountSats.toLocaleString()} sats`;
}

/**
 * Convert sats to local currency (approximate)
 */
export function convertToLocalCurrency(sats, rate = 0.0003) {
  if (!sats) return 0;
  return Math.round(sats * rate);
}
