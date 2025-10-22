// Lightning Network payload parsing utility
// Supports BOLT11 invoices and LNURL

export type LightningPayload =
  | { type: 'bolt11'; invoice: string; amountSats?: number; memo?: string; payee?: string }
  | { type: 'lnurl'; lnurl: string } // bech32 lnurl1...
  | { type: 'unknown'; raw: string };

export function parseLightningPayload(raw: string): LightningPayload {
  const trimmed = (raw || '').trim();
  const normalized = trimmed.replace(/^lightning:/i, '');

  // LNURL (bech32 starts with lnurl1)
  if (/^lnurl1/i.test(normalized)) {
    return { type: 'lnurl', lnurl: normalized };
  }

  // Try BOLT11 - simplified parsing without bolt11 library for now
  if (/^lnbc|lntb|lnbcrt/i.test(normalized)) {
    // Basic BOLT11 detection - in production, use bolt11 library for full parsing
    return { 
      type: 'bolt11', 
      invoice: normalized,
      // amountSats and memo would be parsed from the invoice in full implementation
    };
  }

  return { type: 'unknown', raw: normalized };
}

// Helper function to validate Lightning invoice format
export function isValidLightningInvoice(invoice: string): boolean {
  const trimmed = invoice.trim().replace(/^lightning:/i, '');
  return /^lnbc|lntb|lnbcrt/i.test(trimmed) && trimmed.length > 50 && trimmed.length < 3000;
}

// Helper function to validate LNURL format
export function isValidLnurl(lnurl: string): boolean {
  const trimmed = lnurl.trim().toLowerCase();
  return /^lnurl1[a-z0-9]+$/i.test(trimmed);
}
