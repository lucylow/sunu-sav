# 🌱 SunuSàv Mock Data & Testing Suite

This comprehensive mock data implementation provides realistic test data for the SunuSàv Tontine Bitcoin platform, enabling thorough testing of all monetization flows and backend improvements.

## 📊 Mock Data Overview

### 🏘️ **Tontine Groups**
- **Marché Liberté Women's Circle** - 5 members, 50,000 sats per cycle, 7-day cycles
- **Garage & Vendors Co-op** - 2 members, 100,000 sats per cycle, 7-day cycles  
- **Dakar University Students** - 2 members, 25,000 sats per cycle, 14-day cycles

### 👥 **Users**
- **Aissatou Diop** - Pro subscriber, group admin, Wolof speaker
- **Mamadou Fall** - Group admin, French speaker
- **Fatou Cissé** - Standard user, group admin, Wolof speaker
- **Ibrahima Ndiaye** - Group member, French speaker
- **Aminata Ba** - Group member, Wolof speaker

### 💰 **Financial Data**
- **Completed Cycles**: 2 cycles with successful payouts
- **Active Cycles**: 3 cycles currently collecting contributions
- **Fee Records**: Platform fees split between partner, community, and platform
- **Subscriptions**: Pro tier (5,000 XOF/month) and Standard tier (free)
- **Partner Settlements**: Wave, Orange Money, MTN Mobile Money integrations

## 🚀 Quick Start

### 1. Complete Setup (Recommended)
```bash
cd server/_core
npm run setup
```
This single command will:
- Install all dependencies
- Run database migrations
- Seed realistic mock data
- Test all backend improvements
- Validate monetization flows

### 2. Manual Setup
```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed mock data
npm run seed

# Test improvements
npm run test:improvements

# Test monetization flows
npm run test:monetization
```

### 3. Start Development Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

## 🧪 Testing Suite

### Backend Improvements Tests
```bash
npm run test:improvements
```
Tests:
- ✅ PostgreSQL advisory locks (race condition prevention)
- ✅ Webhook raw-body HMAC verification (security)
- ✅ Durable worker (BullMQ) integration (reliability)
- ✅ Background job processing (scalability)

### Monetization Flow Tests
```bash
npm run test:monetization
```
Tests:
- ✅ Seeded data accessibility
- ✅ Webhook processing with realistic payment hashes
- ✅ Cycle completion with advisory locks
- ✅ Invalid signature rejection
- ✅ Worker queue processing
- ✅ Performance under concurrent load

## 📋 Database Schema

### Core Tables
- `users` - User profiles with phone numbers and Lightning keys
- `tontine_groups` - Savings groups with cycle configuration
- `group_members` - Group membership and roles
- `contributions` - Payment records and status tracking
- `payouts` - Cycle completion and winner distributions

### Monetization Tables
- `fee_records` - Platform fee tracking and splits
- `subscriptions` - User subscription tiers and billing
- `partner_settlements` - Mobile money partner integrations
- `community_fund` - Community contribution tracking
- `payment_attempts` - Idempotent payout processing

### Security & Audit Tables
- `audit_logs` - Comprehensive security audit trail
- `sms_logs` - Communication audit records

## 🔍 Mock Data Details

### Completed Cycles
**Group 1 - Marché Liberté Women's Circle (Cycle 1)**
- 3 members contributed 50,000 sats each
- Total payout: 150,000 sats to Fatou Cissé (winner)
- Platform fee: 1,500 sats (1%)
- Fee split: 450 sats to partners, 300 sats to community, 750 sats to platform

**Group 2 - Garage & Vendors Co-op (Cycle 1)**
- 2 members contributed 100,000 sats each
- Total payout: 200,000 sats to Mamadou Fall (winner)
- Platform fee: 2,000 sats (1%)
- Fee split: 600 sats to partners, 400 sats to community, 1,000 sats to platform

### Active Cycles
**Group 1 - Cycle 2**: 1 paid, 2 pending (cycle completion ready)
**Group 2 - Cycle 2**: Not started yet
**Group 3 - Cycle 1**: Just started, no payments yet

### Subscription Data
- **Aissatou Diop**: Pro tier, 5,000 XOF/month recurring
- **Fatou Cissé**: Standard tier, free
- Others: No active subscriptions

### Partner Settlements
- **Wave**: 3,000 XOF settled (12,000 sats equivalent)
- **Orange Money**: 6,000 XOF pending (24,000 sats equivalent)
- **MTN Mobile Money**: 1,500 XOF settled (6,000 sats equivalent)

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=sunu_sav
DB_PASSWORD=your_password
DB_NAME=sunu_sav

# Redis (for job queues)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
WEBHOOK_HMAC_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret

# Worker Configuration
PAYOUT_WORKER_CONCURRENCY=2
WEBHOOK_WORKER_CONCURRENCY=5
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Basic health check
- `GET /health/detailed` - Comprehensive system status
- `GET /health/workers` - Worker and queue statistics

### Example Health Response
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "api": "running",
    "workers": "running"
  },
  "workers": {
    "healthy": true,
    "workers": {
      "payout": "running",
      "webhook": "running"
    },
    "queues": {
      "payouts": { "waiting": 0, "active": 0, "completed": 5, "failed": 0 },
      "webhooks": { "waiting": 0, "active": 0, "completed": 12, "failed": 0 }
    }
  }
}
```

## 🧪 Testing Scenarios

### 1. Cycle Completion Testing
```bash
# Send webhooks to complete Group 1, Cycle 2
curl -X POST http://localhost:3000/webhook/lightning \
  -H "Content-Type: application/json" \
  -H "x-sunu-signature: sha256=$(echo '{"payment_hash":"payment_hash_fatou_cycle2","status":"settled"}' | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | xxd -p -c 256)" \
  -d '{"payment_hash":"payment_hash_fatou_cycle2","status":"settled","amount_sats":50000}'
```

### 2. Concurrent Webhook Testing
The test suite automatically sends multiple concurrent webhooks to test:
- Advisory lock effectiveness
- Race condition prevention
- Background job processing

### 3. Invalid Signature Testing
Tests various invalid signature scenarios:
- Wrong signature
- Missing signature
- Malformed signature format

## 📈 Performance Metrics

### Expected Performance
- **Webhook Processing**: < 100ms response time
- **Background Jobs**: 2-5 second processing time
- **Concurrent Requests**: 10+ simultaneous webhooks handled
- **Database Locks**: Sub-millisecond advisory lock acquisition

### Load Testing
The test suite includes performance testing with:
- 10 concurrent webhook requests
- Timing measurements
- Success rate tracking
- Average response time calculation

## 🔄 Data Management

### Clear and Reseed
```bash
# Clear all data and reseed
npm run db:reset

# Clear data only
npm run seed:clear

# Reseed data only
npm run seed
```

### Extend Mock Data
To add more realistic data:
1. Edit `seed-sunusav.js`
2. Add more users, groups, or cycles
3. Run `npm run seed:clear && npm run seed`

## 🎯 Demo Scenarios

### Scenario 1: Complete Cycle Flow
1. Start with Group 1, Cycle 2 (1 paid, 2 pending)
2. Send webhook for Fatou's payment
3. Send webhook for Aminata's payment
4. Watch cycle complete automatically
5. Verify payout job is enqueued
6. Check fee records are created

### Scenario 2: Subscription Management
1. Check Aissatou's Pro subscription
2. Verify fee discounts for Pro users
3. Test subscription renewal flow
4. Monitor subscription revenue

### Scenario 3: Partner Integration
1. Review Wave settlement (completed)
2. Check Orange Money settlement (pending)
3. Test new settlement creation
4. Verify XOF to sats conversion

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running
2. **Redis Connection**: Ensure Redis is running for job queues
3. **Migration Errors**: Run `npm run migrate:rollback` then `npm run migrate`
4. **Seed Errors**: Clear data with `npm run seed:clear` then reseed

### Debug Commands
```bash
# Check database connection
npm run migrate

# Check Redis connection
redis-cli ping

# View worker logs
# Check console output when running npm start

# Test individual components
npm run test:improvements
npm run test:monetization
```

## 📚 Next Steps

### For Development
1. **API Endpoints**: Add REST endpoints for frontend integration
2. **Real Lightning**: Replace mock Lightning service with real LND
3. **Mobile Money**: Implement actual Wave/Orange Money APIs
4. **Notifications**: Add SMS/USSD notification system

### For Production
1. **Security Audit**: External security review
2. **Load Testing**: Scale testing with 1000+ groups
3. **Monitoring**: Prometheus/Grafana integration
4. **Backup Strategy**: Database backup and recovery procedures

---

## 🎉 Ready for Demo!

Your SunuSàv backend is now fully set up with:
- ✅ Realistic mock data for 3 tontine groups
- ✅ Complete monetization flow testing
- ✅ All backend improvements validated
- ✅ Comprehensive test suite
- ✅ Production-ready architecture

Start the server with `npm start` and begin demonstrating the platform!
