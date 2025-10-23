import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default('mysql://root@localhost:3306/sunusav'),
  
  // Authentication (auto-injected by Manus)
  JWT_SECRET: z.string().optional(),
  OAUTH_SERVER_URL: z.string().optional(),
  VITE_OAUTH_PORTAL_URL: z.string().optional(),
  
  // Lightning Network
  LND_REST_URL: z.string().optional(),
  LND_MACAROON_HEX: z.string().optional(),
  LND_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  
  // App Configuration
  VITE_APP_TITLE: z.string().default('SunuSàv - Our Savings, Our Future'),
  VITE_APP_LOGO: z.string().default('/logo.png'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Lovable Specific
  VITE_API_URL: z.string().default('http://localhost:3000'),
  VITE_APP_NAME: z.string().default('SunuSàv'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  
  // Optional Services
  REDIS_URL: z.string().optional(),
  WAVE_API_KEY: z.string().optional(),
  ORANGE_MONEY_API_KEY: z.string().optional(),
  FREE_MONEY_API_KEY: z.string().optional(),
  
  // AI Services
  AI_CREDIT_SERVICE_URL: z.string().optional(),
  AI_FRAUD_SERVICE_URL: z.string().optional(),
  AI_INSIGHTS_SERVICE_URL: z.string().optional(),
  AI_ROUTING_SERVICE_URL: z.string().optional(),
  
  // Security
  WEBHOOK_SECRET: z.string().optional(),
  FERNET_KEY: z.string().optional(),
  AUDIT_KEY_PATH: z.string().optional(),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    
    // Check required for production
    if (env.NODE_ENV === 'production') {
      const required = ['JWT_SECRET', 'DATABASE_URL'];
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
      }
    }
    
    // Warn about optional services
    if (!env.LND_REST_URL) {
      console.warn('⚠️  LND_REST_URL not set - Lightning functionality will use mock mode');
    }
    
    if (!env.REDIS_URL) {
      console.warn('⚠️  REDIS_URL not set - using in-memory cache');
    }
    
    console.log('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw error;
  }
}

export type Env = z.infer<typeof envSchema>;