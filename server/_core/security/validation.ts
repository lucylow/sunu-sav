// server/_core/security/validation.ts

import { z } from 'zod';
import { secretManager } from './secrets';

// Base validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const phoneSchema = z.string().regex(/^(\+221[-\s]?)?[76][\d]{7}$/, 'Invalid Senegalese phone number');
export const emailSchema = z.string().email('Invalid email format');
export const bitcoinAddressSchema = z.string().refine(
  (addr) => secretManager.validateBitcoinAddress(addr),
  'Invalid Bitcoin address'
);
export const lightningInvoiceSchema = z.string().refine(
  (invoice) => secretManager.validateLightningInvoice(invoice),
  'Invalid Lightning invoice'
);
export const privateKeySchema = z.string().refine(
  (key) => secretManager.validatePrivateKey(key),
  'Invalid Bitcoin private key'
);

// Tontine-specific validation schemas
export const createTontineSchema = z.object({
  name: z.string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Group name contains invalid characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  contributionAmount: z.number()
    .int('Contribution amount must be an integer')
    .min(1000, 'Minimum contribution is 1000 satoshis')
    .max(10000000, 'Maximum contribution is 10,000,000 satoshis'),
  
  frequency: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Frequency must be daily, weekly, or monthly' })
  }),
  
  maxMembers: z.number()
    .int('Max members must be an integer')
    .min(2, 'Minimum 2 members required')
    .max(50, 'Maximum 50 members allowed'),
  
  rules: z.string()
    .max(1000, 'Rules must be less than 1000 characters')
    .optional(),
});

export const joinTontineSchema = z.object({
  groupId: uuidSchema,
  inviteCode: z.string()
    .min(6, 'Invite code must be at least 6 characters')
    .max(20, 'Invite code must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Invite code must contain only uppercase letters and numbers'),
});

export const contributeSchema = z.object({
  groupId: uuidSchema,
  amount: z.number()
    .int('Amount must be an integer')
    .min(1000, 'Minimum contribution is 1000 satoshis')
    .max(10000000, 'Maximum contribution is 10,000,000 satoshis'),
  
  memo: z.string()
    .max(200, 'Memo must be less than 200 characters')
    .optional(),
  
  timestamp: z.number()
    .int('Timestamp must be an integer')
    .min(0, 'Invalid timestamp')
    .optional(),
});

export const createInvoiceSchema = z.object({
  groupId: uuidSchema,
  amount: z.number()
    .int('Amount must be an integer')
    .min(1000, 'Minimum amount is 1000 satoshis')
    .max(10000000, 'Maximum amount is 10,000,000 satoshis'),
  
  memo: z.string()
    .max(200, 'Memo must be less than 200 characters')
    .optional(),
  
  expiry: z.number()
    .int('Expiry must be an integer')
    .min(60, 'Minimum expiry is 60 seconds')
    .max(86400, 'Maximum expiry is 24 hours')
    .default(3600), // 1 hour default
});

export const payInvoiceSchema = z.object({
  invoice: lightningInvoiceSchema,
  groupId: uuidSchema.optional(),
});

export const createWalletSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
});

export const restoreWalletSchema = z.object({
  mnemonic: z.string()
    .min(1, 'Mnemonic is required')
    .refine(
      (mnemonic) => {
        const words = mnemonic.trim().split(/\s+/);
        return words.length === 12 || words.length === 24;
      },
      'Mnemonic must be 12 or 24 words'
    ),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

export const sendBitcoinSchema = z.object({
  toAddress: bitcoinAddressSchema,
  amount: z.number()
    .int('Amount must be an integer')
    .min(1000, 'Minimum amount is 1000 satoshis')
    .max(100000000, 'Maximum amount is 100,000,000 satoshis'),
  
  memo: z.string()
    .max(200, 'Memo must be less than 200 characters')
    .optional(),
  
  feeRate: z.number()
    .int('Fee rate must be an integer')
    .min(1, 'Minimum fee rate is 1 sat/byte')
    .max(100, 'Maximum fee rate is 100 sat/byte')
    .default(10),
});

export const multiSigCreateSchema = z.object({
  groupId: uuidSchema,
  requiredSignatures: z.number()
    .int('Required signatures must be an integer')
    .min(2, 'Minimum 2 signatures required')
    .max(5, 'Maximum 5 signatures allowed'),
  
  totalSignatures: z.number()
    .int('Total signatures must be an integer')
    .min(3, 'Minimum 3 total signatures')
    .max(7, 'Maximum 7 total signatures'),
});

export const multiSigSignSchema = z.object({
  transactionId: uuidSchema,
  signature: z.string()
    .min(1, 'Signature is required')
    .max(200, 'Signature too long'),
});

export const payoutRequestSchema = z.object({
  groupId: uuidSchema,
  cycle: z.number()
    .int('Cycle must be an integer')
    .min(1, 'Cycle must be positive'),
  
  winnerId: uuidSchema.optional(),
  amount: z.number()
    .int('Amount must be an integer')
    .min(1000, 'Minimum payout is 1000 satoshis')
    .max(100000000, 'Maximum payout is 100,000,000 satoshis'),
});

// User profile validation
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters'),
  
  phoneNumber: phoneSchema.optional(),
  
  email: emailSchema.optional(),
  
  language: z.enum(['fr', 'wo', 'en'], {
    errorMap: () => ({ message: 'Language must be fr, wo, or en' })
  }).optional(),
});

// Admin validation schemas
export const adminCreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  phoneNumber: phoneSchema,
  email: emailSchema.optional(),
  role: z.enum(['user', 'admin', 'moderator']),
});

export const adminUpdateUserSchema = z.object({
  userId: uuidSchema,
  name: z.string().min(2).max(100).optional(),
  phoneNumber: phoneSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  isActive: z.boolean().optional(),
});

// Security validation schemas
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'New password must contain uppercase, lowercase, number, and special character'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'New password must contain uppercase, lowercase, number, and special character'),
});

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1, 'Page must be at least 1').default(1),
  limit: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100').default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'application/pdf'], {
    errorMap: () => ({ message: 'Invalid file type' })
  }),
  
  size: z.number()
    .int('File size must be an integer')
    .min(1, 'File size must be positive')
    .max(5 * 1024 * 1024, 'File size must be less than 5MB'), // 5MB limit
});

// Custom validation functions
export const validateSenegalesePhone = (phone: string): boolean => {
  const pattern = /^(\+221[-\s]?)?[76][\d]{7}$/;
  return pattern.test(phone);
};

export const validateMnemonicPhrase = (mnemonic: string): boolean => {
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
};

export const validateBitcoinAmount = (amount: number): boolean => {
  return Number.isInteger(amount) && amount >= 1000 && amount <= 100000000;
};

export const validateGroupName = (name: string): boolean => {
  return name.length >= 3 && name.length <= 100 && /^[a-zA-Z0-9\s\-_]+$/.test(name);
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, ''); // Keep only digits and +
};

export const sanitizeBitcoinAddress = (address: string): string => {
  return address.trim().toLowerCase();
};

// Export validation middleware factory
export const createValidationMiddleware = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export default {
  createTontineSchema,
  joinTontineSchema,
  contributeSchema,
  createInvoiceSchema,
  payInvoiceSchema,
  createWalletSchema,
  restoreWalletSchema,
  sendBitcoinSchema,
  multiSigCreateSchema,
  multiSigSignSchema,
  payoutRequestSchema,
  updateProfileSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  paginationSchema,
  dateRangeSchema,
  fileUploadSchema,
  validateSenegalesePhone,
  validateMnemonicPhrase,
  validateBitcoinAmount,
  validateGroupName,
  sanitizeString,
  sanitizePhoneNumber,
  sanitizeBitcoinAddress,
  createValidationMiddleware,
};
