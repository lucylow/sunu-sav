# 👥 Mock Users & Personas System

Comprehensive mock user system for SunuSàv Tontine Bitcoin App, designed for Senegalese use cases.

## 🎯 **What's Included**

✅ **10 Realistic Personas** - Senegalese tontine users  
✅ **Frontend Mock Data** - JSON fixtures for UI testing  
✅ **Database Seeds** - PostgreSQL scripts for backend  
✅ **Activity Generator** - 90 days of realistic contribution history  
✅ **Multiple Formats** - SQL, Node.js, JSON for different use cases  

## 👥 **User Personas**

### **Primary Users**
- **Fatou Diop** - Market vendor & group captain (Android, Wolof)
- **Mamadou Ndiaye** - Traveling trader (Feature phone, USSD)
- **Aissatou Sarr** - Diaspora in Paris (iPhone, Lightning)
- **Seynabou Ba** - Community captain (Android, organizer)
- **Ousmane Diouf** - Agent/cash operator (Tablet, portal)

### **Secondary Users**
- **Cheikh Kane** - Smallholder farmer (Feature phone, seasonal)
- **Ndeye Fall** - Student entrepreneur (Android, micro-payments)
- **Baba Thiam** - Elderly user (Shared phone, agent-dependent)
- **Amadou Ly** - Developer ambassador (Android, beta tester)
- **Luc Low** - Node operator (Laptop, admin)

## 🚀 **Quick Start**

### **1. Seed Database**
```bash
# Using Node.js script (recommended)
npm run seed:users

# Using SQL script
npm run db:seed

# Generate activity history
npm run seed:activity

# Seed everything at once
npm run seed:all
```

### **2. Use in Frontend**
```javascript
// Import mock users
import mockUsers from './src/mocks/users.json';

// Use in components
const currentUser = mockUsers.find(u => u.role === 'group_captain');
```

### **3. Test Different Scenarios**
```bash
# Test market vendor flow (Fatou)
curl -H "X-User-ID: 11111111-1111-4111-8111-111111111111" /api/groups

# Test diaspora payment (Aissatou)
curl -H "X-User-ID: 33333333-3333-4333-8333-333333333333" /api/payments
```

## 📊 **Persona Characteristics**

### **Device Distribution**
- **Android**: 5 users (50%) - Modern smartphones
- **Feature Phone**: 3 users (30%) - Basic phones
- **iPhone**: 1 user (10%) - Diaspora user
- **Tablet/Laptop**: 2 users (20%) - Agents/developers

### **Channel Preferences**
- **App**: 6 users (60%) - Primary interface
- **USSD**: 2 users (20%) - Offline scenarios
- **Agent**: 3 users (30%) - Cash operations
- **Admin**: 1 user (10%) - Technical operations

### **Language Support**
- **Wolof**: 5 users (50%) - Local language
- **French**: 8 users (80%) - Administrative
- **English**: 2 users (20%) - Technical/diaspora

### **Credit Scores**
- **High (0.8+)**: 4 users (40%) - Reliable payers
- **Medium (0.6-0.8)**: 3 users (30%) - Regular users
- **Low (0.4-0.6)**: 3 users (30%) - New/risky users

## 🧪 **Testing Scenarios**

### **Group Management**
```bash
# Fatou creates market tontine
POST /api/groups
{
  "name": "Marché Central Tontine",
  "contribution_amount_sats": 10000,
  "cycle_days": 7,
  "created_by": "11111111-1111-4111-8111-111111111111"
}
```

### **Payment Flows**
```bash
# Aissatou sends diaspora payment
POST /api/lightning/pay
{
  "invoice": "lntb1...",
  "idempotency_key": "diaspora-weekly-2024-01-15"
}
```

### **Offline Scenarios**
```bash
# Mamadou queues offline contribution
POST /api/contributions/queue
{
  "user_id": "22222222-2222-4222-8222-222222222222",
  "amount_sats": 8000,
  "group_id": "g-neighborhood-01"
}
```

### **Agent Operations**
```bash
# Ousmane processes cash-in
POST /api/agent/cash-in
{
  "agent_id": "55555555-5555-4555-8555-555555555555",
  "user_phone": "+221770000001",
  "amount_sats": 10000
}
```

## 📁 **File Structure**

```
├── USER_PERSONAS.md                    # Detailed persona documentation
├── client/src/mocks/users.json         # Frontend mock data
├── migrations/seed_mock_users.sql      # PostgreSQL seed script
├── backend/scripts/
│   ├── seed_mock_users.js             # Node.js seeder
│   └── generate_mock_activity.js      # Activity generator
└── package.json                       # Updated with seed scripts
```

## 🔧 **Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    role VARCHAR(50) DEFAULT 'member',
    device_type VARCHAR(50) DEFAULT 'android',
    preferred_channel VARCHAR(50) DEFAULT 'app',
    avg_contribution_sats INTEGER DEFAULT 0,
    typical_payment_hour TIME DEFAULT '19:00',
    credit_score DECIMAL(3,2) DEFAULT 0.5,
    trust_score DECIMAL(3,2) DEFAULT 0.5,
    metadata JSONB DEFAULT '{}',
    avatar_url VARCHAR(500),
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Groups Table**
```sql
CREATE TABLE tontine_groups (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contribution_amount_sats INTEGER NOT NULL,
    cycle_days INTEGER DEFAULT 7,
    max_members INTEGER DEFAULT 10,
    current_cycle INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Contributions Table**
```sql
CREATE TABLE contributions (
    id UUID PRIMARY KEY,
    group_id UUID REFERENCES tontine_groups(id),
    user_id UUID REFERENCES users(id),
    cycle_number INTEGER DEFAULT 1,
    amount_sats INTEGER NOT NULL,
    payment_request TEXT,
    payment_hash TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);
```

## 🎭 **Persona Usage Guide**

### **For UX Design**
- **Fatou**: Test group creation and management
- **Mamadou**: Test offline/USSD scenarios
- **Aissatou**: Test Lightning payment flows
- **Baba**: Test accessibility and trust features

### **For Development**
- **Amadou**: Test new features and edge cases
- **Luc**: Validate technical integrations
- **Ousmane**: Test agent portal functionality

### **For Demos**
- **Seynabou**: Showcase admin features
- **Ndeye**: Demonstrate gamification
- **Cheikh**: Highlight seasonal patterns

## 📱 **Device-Specific Testing**

### **Android (Mid-range)**
- Test with Fatou, Seynabou, Ndeye, Amadou
- Focus on app performance and battery usage

### **Feature Phone**
- Test with Mamadou, Cheikh, Baba
- Ensure USSD compatibility and agent integration

### **iPhone**
- Test with Aissatou
- Focus on Lightning wallet integration

### **Tablet/Desktop**
- Test with Ousmane, Luc
- Focus on admin interfaces and bulk operations

## 🌍 **Cultural Considerations**

### **Language Support**
- **Wolof**: Primary language for 50% of users
- **French**: Administrative and technical language
- **English**: Limited to diaspora and developers

### **Trust Patterns**
- **Local Trust**: High for community members
- **Agent Trust**: Critical for elderly and rural users
- **Technical Trust**: High for developers

### **Payment Patterns**
- **Evening Payments**: Most users prefer evening contributions
- **Agent-Mediated**: 30% rely on agent assistance
- **Seasonal**: Farmers have irregular payment patterns

## 🔄 **Activity Patterns**

### **Weekly Contributors**
- **Fatou**: Monday 7 PM (Market vendor)
- **Aissatou**: Sunday 9 PM (Diaspora)
- **Ndeye**: Saturday 8 PM (Student)
- **Amadou**: Saturday 10 PM (Developer)

### **Irregular Contributors**
- **Mamadou**: Traveling trader (unpredictable)
- **Cheikh**: Seasonal farmer (monthly)
- **Baba**: Elderly (bi-weekly)

### **Non-Contributors**
- **Ousmane**: Agent (processes others)
- **Luc**: Node operator (technical only)

## 🎯 **Demo Scripts**

### **Market Tontine Demo**
1. **Fatou** creates weekly market group
2. **Seynabou** joins as organizer
3. **Mamadou** contributes via USSD
4. **Aissatou** sends diaspora contribution
5. **Ousmane** processes agent payments

### **Student Micro-Tontine**
1. **Ndeye** creates small weekly group
2. **Amadou** helps with onboarding
3. **Baba** observes via agent
4. **Luc** monitors technical aspects

### **Farmer Seasonal Tontine**
1. **Cheikh** creates harvest-season group
2. **Fatou** provides market access
3. **Ousmane** handles large payouts
4. **Seynabou** manages documentation

## 🚨 **Troubleshooting**

### **Common Issues**

**1. Database Connection**
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

**2. Missing Dependencies**
```bash
# Install required packages
cd backend && npm install pg uuid
```

**3. Permission Issues**
```bash
# Fix file permissions
chmod +x backend/scripts/*.js
```

**4. Data Conflicts**
```bash
# Clear existing data
psql $DATABASE_URL -c "TRUNCATE users, tontine_groups, contributions CASCADE;"
npm run seed:all
```

## 📈 **Analytics & Insights**

### **User Behavior Patterns**
- **Payment Timing**: Most contributions happen in evening
- **Device Usage**: Android dominates, feature phones important
- **Channel Preferences**: App primary, USSD/agent fallbacks
- **Credit Patterns**: Diaspora users highest scores

### **Group Dynamics**
- **Market Groups**: High frequency, reliable payments
- **Family Groups**: Large amounts, diaspora participation
- **Student Groups**: Small amounts, high frequency
- **Farmer Groups**: Large amounts, seasonal patterns

## 🎉 **Success!**

Your SunuSàv app now has **comprehensive mock user data** for:

- ✅ **Realistic Testing** - Senegalese tontine scenarios
- ✅ **UX Validation** - Multi-device, multi-language support
- ✅ **Demo Ready** - Complete user journeys
- ✅ **Development** - Edge cases and error scenarios

**Perfect for hackathons, demos, and development! 🚀**
