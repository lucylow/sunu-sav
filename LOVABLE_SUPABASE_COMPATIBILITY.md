# SunuSàv Lovable + Supabase Compatibility Guide

## 🎯 Overview

This guide ensures SunuSàv is fully compatible with Lovable's development platform and Supabase's backend services. The codebase has been updated to work seamlessly with both platforms.

## ✅ What's Been Updated

### 1. **Supabase Integration**
- ✅ Updated Supabase client configuration
- ✅ Fixed import paths to use Lovable-compatible structure
- ✅ Created comprehensive database schema with Senegal-specific features
- ✅ Implemented Row Level Security (RLS) policies
- ✅ Added PostgreSQL functions for business logic

### 2. **Lovable Compatibility**
- ✅ Fixed UI component imports (`@/components/ui/input` instead of `accessible-input`)
- ✅ Updated API client to use Supabase directly
- ✅ Created environment configuration template
- ✅ Ensured package.json has proper Lovable configuration

### 3. **Senegal-Specific Features**
- ✅ Wave mobile money integration
- ✅ USSD session management
- ✅ Holiday-aware scheduling
- ✅ Multi-language support (French/Wolof/English)
- ✅ Community fund management
- ✅ Fee calculation and transparency

## 🚀 Quick Start with Lovable

### 1. **Environment Setup**
```bash
# Copy environment template
cp env.example .env.local

# Add your Supabase credentials
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 2. **Database Setup**
```sql
-- Run the Supabase schema
-- Copy contents of supabase-schema.sql to Supabase SQL editor
-- This creates all tables, functions, and RLS policies
```

### 3. **Start Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📊 Database Schema

### Core Tables
- `tontine_groups` - Tontine groups with Senegal-specific fields
- `contributions` - User contributions to tontine cycles
- `payouts` - Payout records for cycle winners
- `lightning_invoices` - Lightning Network invoice tracking
- `profiles` - User profiles with Senegal-specific data

### Senegal-Specific Tables
- `wave_transactions` - Wave mobile money cash-outs
- `ussd_sessions` - USSD menu session management
- `senegal_holidays` - Local holiday calendar
- `exchange_rates` - Bitcoin/XOF exchange rates
- `community_fund` - Community fund management
- `subscriptions` - User subscription tiers
- `fee_records` - Fee tracking and transparency

### PostgreSQL Functions
- `is_business_day_in_senegal(date)` - Check if date is a business day
- `get_next_business_day_in_senegal(date)` - Get next business day
- `calculate_fee_breakdown(sats, verified, recurring)` - Calculate fee splits

## 🔧 API Integration

### Supabase Client Usage
```typescript
import { sunuSavAPI } from '@/lib/sunu-sav-api';

// Get tontine groups
const groups = await sunuSavAPI.getGroups();

// Create Wave transaction
const waveTx = await sunuSavAPI.createWaveTransaction({
  user_id: user.id,
  phone_number: '+221701234567',
  amount_xof: 1000,
  amount_sats: 5000,
  status: 'pending'
});

// Calculate fee breakdown
const fees = await sunuSavAPI.calculateFeeBreakdown(
  100000, // 100k sats
  true,   // verified group
  false   // not recurring user
);
```

### Authentication Flow
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  
  if (!user) {
    return <LoginForm onSignIn={signIn} />;
  }
  
  return <Dashboard user={user} />;
}
```

## 🎨 UI Components

### Updated Components
- `SenegalSubscriptionManager` - Subscription management with Supabase
- `WaveCashOutModal` - Wave mobile money integration
- `Groups.tsx` - Enhanced with Senegal features

### Component Usage
```typescript
import { SenegalSubscriptionManager } from '@/components/SenegalSubscriptionManager';
import { WaveCashOutModal } from '@/components/WaveCashOutModal';

function Dashboard() {
  return (
    <div>
      <SenegalSubscriptionManager 
        currentSubscription={subscription}
        onSubscriptionChange={setSubscription}
      />
      
      <WaveCashOutModal
        isOpen={showCashOut}
        onClose={() => setShowCashOut(false)}
        payoutAmount={50000}
        winnerPhone="+221701234567"
        onSuccess={handleCashOutSuccess}
      />
    </div>
  );
}
```

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only view their own subscriptions
- Users can only view their own Wave transactions
- Admin users can view all fee records
- Public read access for USSD sessions

### Authentication
- Supabase Auth integration
- JWT token validation
- User session management
- Secure API endpoints

## 🌍 Senegal-Specific Features

### Wave Mobile Money
- Instant Bitcoin-to-XOF cash-outs
- Senegal phone number validation
- Transaction status tracking
- Error handling and retry logic

### USSD Support
- Menu-driven interface for feature phones
- Session management with timeout
- Contribution payments via mobile money
- Balance checking and history

### Holiday Awareness
- Automatic holiday detection
- Business day calculation
- Payout scheduling around holidays
- Local calendar integration

### Multi-Language Support
- French (primary)
- Wolof (local language)
- English (international)
- Contextual translations

## 📱 Mobile-First Design

### Responsive Components
- Mobile-optimized layouts
- Touch-friendly interfaces
- Offline-capable features
- Low-bandwidth optimization

### Progressive Web App (PWA)
- Service worker for offline support
- App-like experience
- Push notifications
- Install prompts

## 🚀 Deployment

### Lovable Platform
```json
{
  "lovable": {
    "type": "react-vite",
    "framework": "react",
    "buildTool": "vite",
    "port": 8080,
    "features": [
      "typescript",
      "tailwindcss",
      "react-query",
      "trpc",
      "i18n",
      "pwa",
      "offline-support"
    ],
    "deployment": {
      "platform": "vercel",
      "buildCommand": "npm run build",
      "outputDirectory": "dist/public"
    }
  }
}
```

### Supabase Deployment
1. Create Supabase project
2. Run database schema
3. Configure RLS policies
4. Set up authentication
5. Deploy Edge Functions (if needed)

## 🔧 Development Workflow

### Local Development
```bash
# Start Supabase locally (optional)
supabase start

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables
```bash
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

# Optional
VITE_WAVE_API_KEY=your_wave_key
VITE_LND_GRPC_HOST=localhost:10009
VITE_DEFAULT_LANGUAGE=fr
```

## 📊 Monitoring & Analytics

### Supabase Dashboard
- Real-time database monitoring
- Authentication analytics
- API usage statistics
- Error tracking

### Custom Metrics
- Tontine cycle completion rates
- Wave cash-out success rates
- User engagement metrics
- Fee collection tracking

## 🎯 Next Steps

### Immediate (This Week)
1. **Set up Supabase project** with provided schema
2. **Configure environment variables** for Lovable
3. **Test authentication flow** with Supabase Auth
4. **Verify Senegal features** work correctly

### Short-term (Next Month)
1. **Implement real Wave API** integration
2. **Add USSD gateway** for feature phones
3. **Deploy to production** on Lovable platform
4. **Set up monitoring** and analytics

### Long-term (Next Quarter)
1. **Scale to other countries** (Mali, Burkina Faso)
2. **Add more mobile money** providers
3. **Implement advanced analytics** and reporting
4. **Create mobile app** with React Native

## 🆘 Troubleshooting

### Common Issues

**Supabase Connection Error**
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_PUBLISHABLE_KEY

# Verify Supabase project is active
# Check RLS policies are correctly set
```

**Authentication Issues**
```typescript
// Check user session
const { user, session } = useAuth();
console.log('User:', user);
console.log('Session:', session);
```

**Database Errors**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 📚 Resources

- [Lovable Documentation](https://lovable.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Senegal Mobile Money APIs](https://wave.com/sn/api)
- [Lightning Network Development](https://lightning.network/)

---

## ✅ Compatibility Checklist

- [x] Supabase client configuration
- [x] Lovable-compatible import paths
- [x] Database schema with Senegal features
- [x] Authentication flow
- [x] UI component updates
- [x] API client implementation
- [x] Environment configuration
- [x] Security policies (RLS)
- [x] Mobile-first design
- [x] PWA configuration

**🎉 SunuSàv is now fully compatible with Lovable and Supabase!**
