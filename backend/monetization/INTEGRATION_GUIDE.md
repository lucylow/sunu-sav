# backend/monetization/INTEGRATION_GUIDE.md
# SunuSàv Monetization Integration Guide

This guide explains how to integrate the new monetization system with your existing SunuSàv codebase.

## Overview

The monetization system is designed as a separate FastAPI service that can run alongside your existing Node.js backend. It provides:

- Fee calculation and management
- Lightning Network payout processing
- Mobile money partner integration
- Subscription management
- Revenue reporting and analytics
- Community fund management

## Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Existing      │    │   Monetization  │    │   Database      │
│   Node.js API   │◄──►│   FastAPI       │◄──►│   (MySQL)       │
│                 │    │                 │    │                 │
│ • Tontine Mgmt  │    │ • Fee Calc      │    │ • Groups        │
│ • User Auth     │    │ • Payouts       │    │ • Cycles        │
│ • Frontend API  │    │ • Subscriptions │    │ • Fees          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step 1: Database Integration

### Option A: Shared Database (Recommended)
Use the same MySQL database for both systems:

1. **Update your existing Drizzle schema** to include monetization tables:
```sql
-- Add to your existing migrations
-- The monetization system will create its own tables
-- Ensure your groups table has the required fields:
ALTER TABLE groups ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE groups ADD COLUMN country VARCHAR(8) DEFAULT 'SN';
```

2. **Update database connection**:
```javascript
// In your existing backend
const monetizationDbUrl = process.env.MONETIZATION_DATABASE_URL || 
  'mysql://sunusav:sunusav_password@localhost:3306/sunusav_monetization';
```

### Option B: Separate Database
Run monetization system with its own database (as configured in docker-compose.yml).

## Step 2: API Integration

### Add Monetization Service Client

Create a client to communicate with the monetization API:

```javascript
// backend/services/monetizationClient.js
const axios = require('axios');

class MonetizationClient {
  constructor(baseUrl = 'http://localhost:8001') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000
    });
  }

  async calculateFee(payoutSats, groupVerified = false, userRecurring = false) {
    const response = await this.client.post('/monetization/fees/calculate', {
      payout_sats: payoutSats,
      group_verified: groupVerified,
      user_recurring: userRecurring
    });
    return response.data;
  }

  async processPayout(cycleId, groupVerified = false, userRecurring = false) {
    const response = await this.client.post('/monetization/payouts/process', {
      cycle_id: cycleId,
      group_verified: groupVerified,
      user_recurring: userRecurring
    });
    return response.data;
  }

  async createSubscription(userId, tier = 'pro') {
    const response = await this.client.post('/monetization/subscriptions', {
      user_id: userId,
      tier: tier,
      payment_method: 'lightning'
    });
    return response.data;
  }

  async getUserSubscription(userId) {
    const response = await this.client.get(`/monetization/subscriptions/user/${userId}`);
    return response.data;
  }
}

module.exports = MonetizationClient;
```

### Update Tontine Routes

Modify your existing tontine routes to integrate with monetization:

```javascript
// backend/routes/tontine.js
const MonetizationClient = require('../services/monetizationClient');
const monetization = new MonetizationClient();

// Add fee calculation to group creation
router.post('/groups', async (req, res) => {
  try {
    const { name, description, contributionAmountSats, cycleDays, maxMembers, createdBy } = req.body;
    
    // Create group as before
    const group = {
      id: uuidv4(),
      name,
      description,
      contribution_amount_sats: contributionAmountSats,
      cycle_days: cycleDays,
      max_members: maxMembers,
      current_cycle: 1,
      status: 'active',
      created_by: createdBy,
      created_at: new Date().toISOString(),
      is_verified: false // Add verification status
    };

    groups.push(group);
    
    // Calculate fee for this group's payout
    const payoutTotal = contributionAmountSats * maxMembers;
    const feeInfo = await monetization.calculateFee(
      payoutTotal, 
      group.is_verified, 
      false // Would check if user has subscription
    );
    
    // Store fee information
    group.fee_info = feeInfo;
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Add payout processing
router.post('/groups/:id/payout', async (req, res) => {
  try {
    const { id } = req.params;
    const group = groups.find(g => g.id === id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Process payout through monetization system
    const payoutResult = await monetization.processPayout(
      group.current_cycle_id, // You'd need to track this
      group.is_verified,
      false // Check user subscription
    );
    
    res.json(payoutResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payout' });
  }
});
```

## Step 3: Frontend Integration

### Add Monetization Features to React Components

Update your Groups.tsx to show fee information:

```typescript
// client/src/pages/Groups.tsx
import { useState, useEffect } from 'react';

// Add fee display to TontineCard
const TontineCard = ({ group, onPay, onManage }) => {
  const [feeInfo, setFeeInfo] = useState(null);

  useEffect(() => {
    // Fetch fee information
    if (group.fee_info) {
      setFeeInfo(group.fee_info);
    }
  }, [group]);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        {/* Existing content */}
        
        {/* Add fee information */}
        {feeInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Fee Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Platform Fee: {feeInfo.platform_share} sats</div>
              <div>Community Fund: {feeInfo.community_share} sats</div>
              <div>Partner Reserve: {feeInfo.partner_reserved} sats</div>
              <div>Total Fee: {feeInfo.sats_fee} sats</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### Add Subscription Management

Create a subscription management component:

```typescript
// client/src/components/SubscriptionManager.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SubscriptionManager = ({ userId }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const createSubscription = async (tier) => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tier })
      });
      const result = await response.json();
      setSubscription(result);
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div>
            <p>Current Plan: {subscription.tier}</p>
            <p>Monthly Cost: {subscription.recurring_xof} XOF</p>
            <p>Status: {subscription.active ? 'Active' : 'Inactive'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={() => createSubscription('pro')}
              disabled={loading}
              className="w-full"
            >
              Subscribe to Pro (500 XOF/month)
            </Button>
            <Button 
              onClick={() => createSubscription('enterprise')}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Subscribe to Enterprise (2000 XOF/month)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

## Step 4: Environment Configuration

### Update your main .env file:

```bash
# Add monetization configuration
MONETIZATION_API_URL=http://localhost:8001
MONETIZATION_DATABASE_URL=mysql+pymysql://sunusav:sunusav_password@localhost:3306/sunusav_monetization

# Partner API keys
WAVE_API_KEY=your_wave_api_key
ORANGE_API_KEY=your_orange_api_key
MTN_API_KEY=your_mtn_api_key

# Lightning configuration
LND_HOST=localhost:10009
LND_MACAROON_PATH=/path/to/admin.macaroon
LND_TLS_CERT_PATH=/path/to/tls.cert
```

## Step 5: Docker Integration

### Update your main docker-compose.yml:

```yaml
# Add to your existing docker-compose.yml
services:
  # ... existing services ...

  # Monetization API
  monetization:
    build: ./backend/monetization
    ports:
      - "8001:8001"
    environment:
      - MONETIZATION_DATABASE_URL=mysql+pymysql://sunusav:sunusav_password@mysql:3306/sunusav_monetization
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - mysql
      - redis

  # Celery Worker
  monetization_worker:
    build: ./backend/monetization
    command: celery -A tasks worker --loglevel=info
    environment:
      - MONETIZATION_DATABASE_URL=mysql+pymysql://sunusav:sunusav_password@mysql:3306/sunusav_monetization
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - mysql
      - redis
```

## Step 6: Testing Integration

### Test the integration:

1. **Start all services**:
```bash
docker-compose up -d
```

2. **Test fee calculation**:
```bash
curl -X POST http://localhost:8001/monetization/fees/calculate \
  -H "Content-Type: application/json" \
  -d '{"payout_sats": 100000, "group_verified": true}'
```

3. **Test subscription creation**:
```bash
curl -X POST http://localhost:8001/monetization/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "tier": "pro"}'
```

4. **Check API documentation**:
   - Visit http://localhost:8001/docs for monetization API docs
   - Visit http://localhost:5555 for Celery monitoring

## Step 7: Production Deployment

### Production considerations:

1. **Security**:
   - Use proper API keys and secrets management
   - Enable HTTPS
   - Implement rate limiting
   - Use proper database credentials

2. **Monitoring**:
   - Set up health checks
   - Monitor Celery tasks
   - Track revenue metrics
   - Set up alerts for failed payouts

3. **Scaling**:
   - Use multiple Celery workers
   - Consider Redis clustering
   - Use database connection pooling
   - Implement caching for exchange rates

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Check MySQL credentials
   - Ensure database exists
   - Verify network connectivity

2. **Celery Task Failures**:
   - Check Redis connection
   - Verify task imports
   - Check worker logs

3. **Lightning Integration Issues**:
   - Verify LND credentials
   - Check Lightning node status
   - Ensure proper macaroon permissions

4. **Partner API Errors**:
   - Verify API keys
   - Check API endpoints
   - Monitor rate limits

## Next Steps

1. **Implement real Lightning integration** (replace mock LND client)
2. **Add real partner API integrations** (Wave, Orange, MTN)
3. **Implement user authentication** for monetization API
4. **Add comprehensive logging and monitoring**
5. **Create admin dashboard** for revenue management
6. **Implement automated testing**

## Support

For integration support:
- Check the monetization API documentation at `/docs`
- Review the README.md for detailed setup instructions
- Create issues for specific integration problems
- Contact the SunuSàv team for assistance
