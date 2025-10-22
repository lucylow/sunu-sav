// server/_core/security/audit/auditLog.ts
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const AUDIT_FILE = process.env.AUDIT_FILE || './data/audit.log';
const AUDIT_KEY = process.env.AUDIT_KEY_PATH || './certs/audit.pem'; // server private key for signing entries

export function appendAuditEntry(entry: any): void {
  const raw = JSON.stringify({ entry, ts: new Date().toISOString() });
  const sign = crypto.createSign('SHA256');
  sign.update(raw);
  sign.end();
  const privateKey = fs.readFileSync(AUDIT_KEY);
  const sig = sign.sign(privateKey, 'hex');
  const record = { payload: raw, sig };
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(record) + '\n', 'utf8');
}
