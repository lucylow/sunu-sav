# 👥 SunuSàv User Personas

Realistic user personas for Senegalese tontine scenarios, designed for testing, demos, and UX design.

## 🎯 **Primary Personas**

### **Fatou Diop** - Market Vendor & Group Captain
- **Age**: 42 · **Languages**: Wolof + French · **Device**: Android (mid-range)
- **Channel**: App + Agent · **Role**: Group Captain
- **Behavior**: Organizes 10-person weekly market tontine. Pays reliably in evenings. Prefers simple UI with large buttons. High local trust, moderate tech literacy.
- **Test Scenarios**: Create group, queue offline contributions, claim payout via agent
- **Credit Score**: 0.88 · **Trust Score**: 0.94
- **Phone**: +221770000001

### **Mamadou Ndiaye** - Traveling Trader
- **Age**: 36 · **Languages**: Wolof + French · **Device**: Feature phone + occasional smartphone
- **Channel**: USSD primary · **Role**: Member
- **Behavior**: Often offline, prefers USSD. Contributes via agent when in town. Variable contribution amounts.
- **Test Scenarios**: USSD contribution, agent cash-in, offline queue reconciliations
- **Credit Score**: 0.62 · **Trust Score**: 0.80
- **Phone**: +221770000002

### **Aissatou Sarr** - Diaspora (Paris)
- **Age**: 30 · **Languages**: French + English · **Device**: iPhone
- **Channel**: App (Lightning wallet) · **Role**: Diaspora Member
- **Behavior**: Sends remittance contributions weekly. Values speed/low fees, uses external Lightning wallet. High credit reliability.
- **Test Scenarios**: Cross-border remittance, LN invoice payment, FX conversion
- **Credit Score**: 0.97 · **Trust Score**: 0.99
- **Phone**: +221770000003

### **Seynabou Ba** - Community Captain
- **Age**: 50 · **Languages**: Wolof + French · **Device**: Android
- **Channel**: App + Nostr notifications · **Role**: Organizer
- **Behavior**: Manages many groups, needs auditing and export of receipts. High trust, may sign multisig keys.
- **Test Scenarios**: Create+close group, export receipts, multisig payout
- **Credit Score**: 0.90 · **Trust Score**: 0.98
- **Phone**: +221770000004

### **Ousmane Diouf** - Agent/Cash-in Operator
- **Age**: 28 · **Languages**: French · **Device**: Android tablet
- **Channel**: Agent portal (offline sync) · **Role**: Agent
- **Behavior**: Accepts cash from users, queues requests when offline, performs cash-outs to winners. Critical for liquidity.
- **Test Scenarios**: Agent offline queue, reconcile to server, cash-in commission flow
- **Credit Score**: 0.75 · **Trust Score**: 0.80
- **Phone**: +221770000005

## 🌾 **Secondary Personas**

### **Cheikh Kane** - Smallholder Farmer
- **Age**: 55 · **Languages**: Wolof · **Device**: Feature phone
- **Channel**: USSD via local agent · **Role**: Member
- **Behavior**: Irregular connectivity, seasonal large lump payouts needed (harvest). Low tech literacy.
- **Test Scenarios**: Schedule large payout, agent cash-out, partial on-chain settlement
- **Credit Score**: 0.58 · **Trust Score**: 0.70
- **Phone**: +221770000006

### **Ndeye Fall** - Student/Young Entrepreneur
- **Age**: 22 · **Languages**: Wolof + French · **Device**: Android
- **Channel**: App (lightning wallet) · **Role**: Member
- **Behavior**: Small weekly contributions, loves reward gamification and micro-rewards (Sunu Points). Low avg contribution but high frequency.
- **Test Scenarios**: Micro-reward issuance, credit score growth, low-value LN payments
- **Credit Score**: 0.67 · **Trust Score**: 0.72
- **Phone**: +221770000007

### **Baba Thiam** - Elder/Risk-averse
- **Age**: 63 · **Languages**: Wolof · **Device**: Feature phone (shared)
- **Channel**: Agent + USSD · **Role**: Member
- **Behavior**: Conservative, prefers cash payout via local trusted agent, won't use app until proven.
- **Test Scenarios**: Agent-driven payout, usability and trust messages
- **Credit Score**: 0.45 · **Trust Score**: 0.60
- **Phone**: +221770000008

## 🚀 **Technical Personas**

### **Amadou Ly** - Youth Vendor/Developer Aspirant
- **Age**: 27 · **Languages**: French + Wolof · **Device**: Android + laptop
- **Channel**: App (tests features) · **Role**: Developer Ambassador
- **Behavior**: Tech-savvy, participates in pilot, helps others onboard. Good test user for edge flows and Nostr events.
- **Test Scenarios**: QR scanning, LN invoice scanning, testnet send/receive
- **Credit Score**: 0.85 · **Trust Score**: 0.88
- **Phone**: +221770000009

### **Luc Low** - Local Developer/Node Operator
- **Age**: 31 · **Languages**: French + English · **Device**: Laptop + Android emulator
- **Channel**: Admin UI / CLI · **Role**: Node Operator
- **Behavior**: Runs local LND node, helps maintain watchtowers, tests channel rebalancing. Crucial for dev operations.
- **Test Scenarios**: LND node integration, admin forced payouts, watchtower alerts
- **Credit Score**: 0.99 · **Trust Score**: 0.99
- **Phone**: +221770000010

## 📊 **Persona Usage Guide**

### **For UX Design**
- Use personas to validate UI/UX decisions
- Test accessibility for different device types
- Ensure multi-language support (Wolof/French)

### **For Testing**
- **Fatou**: Test group creation and management flows
- **Mamadou**: Test offline/USSD scenarios
- **Aissatou**: Test Lightning payment flows
- **Ousmane**: Test agent portal functionality

### **For Demos**
- **Seynabou**: Showcase admin/organizer features
- **Ndeye**: Demonstrate gamification and rewards
- **Baba**: Highlight trust and agent integration

### **For Development**
- **Amadou**: Test new features and edge cases
- **Luc**: Validate technical integrations

## 🎭 **Persona Characteristics**

### **Device Distribution**
- **Android**: 5 users (50%)
- **Feature Phone**: 3 users (30%)
- **iPhone**: 1 user (10%)
- **Tablet/Laptop**: 2 users (20%)

### **Channel Preferences**
- **App**: 6 users (60%)
- **USSD**: 2 users (20%)
- **Agent**: 3 users (30%)
- **Admin**: 1 user (10%)

### **Language Distribution**
- **Wolof**: 5 users (50%)
- **French**: 8 users (80%)
- **English**: 2 users (20%)

### **Credit Score Ranges**
- **High (0.8+)**: 4 users (40%)
- **Medium (0.6-0.8)**: 3 users (30%)
- **Low (0.4-0.6)**: 3 users (30%)

## 🔄 **Testing Scenarios**

### **Group Management**
- **Fatou**: Create weekly market tontine
- **Seynabou**: Manage multiple groups
- **Ousmane**: Agent-assisted group operations

### **Payment Flows**
- **Aissatou**: Lightning wallet integration
- **Mamadou**: USSD + agent payments
- **Ndeye**: Micro-payments and rewards

### **Offline Scenarios**
- **Mamadou**: Offline contribution queuing
- **Cheikh**: Seasonal connectivity issues
- **Ousmane**: Agent offline reconciliation

### **Trust & Security**
- **Baba**: Agent-mediated transactions
- **Seynabou**: Multisig operations
- **Luc**: Technical security validation

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
- **Local Trust**: High for community members (Fatou, Seynabou)
- **Agent Trust**: Critical for elderly and rural users (Baba, Cheikh)
- **Technical Trust**: High for developers (Luc, Amadou)

### **Payment Patterns**
- **Evening Payments**: Most users prefer evening contributions
- **Agent-Mediated**: 30% rely on agent assistance
- **Seasonal**: Farmers have irregular payment patterns

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

These personas provide comprehensive coverage of Senegalese tontine use cases and enable thorough testing of all SunuSàv features! 🚀
