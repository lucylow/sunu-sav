# SunuSàv AI Integration

This document outlines the comprehensive AI integration for the SunuSàv Bitcoin-powered tontine platform, designed specifically for the Senegalese market.

## 🧠 AI Features Overview

### 1. AI-Powered Credit Scoring
- **Purpose**: Provide credit scoring for unbanked users
- **Technology**: LightGBM machine learning model
- **Features**:
  - Alternative financial data analysis
  - Tontine contribution patterns
  - Community reputation scoring
  - Mobile money transaction analysis
  - Automated microloan approvals

### 2. Multilingual AI Chat Assistant
- **Languages**: Wolof, French, English
- **Features**:
  - Voice-to-text and text-to-speech
  - Contextual financial advice
  - Tontine-specific terminology
  - Offline-capable responses
  - Cultural adaptation for Senegal

### 3. AI Fraud Detection
- **Technology**: Isolation Forest + One-Class SVM
- **Features**:
  - Real-time transaction monitoring
  - Pattern anomaly detection
  - Rapid-fire payment detection
  - Amount manipulation detection
  - Automated risk scoring

### 4. AI Market Insights & Inflation Tracking
- **Technology**: Prophet time series forecasting
- **Features**:
  - CFA franc inflation tracking
  - Bitcoin price projections
  - Savings outcome predictions
  - Market trend analysis
  - Risk assessment

### 5. AI-Driven Payout Fairness
- **Technology**: Explainable AI (SHAP/LIME)
- **Features**:
  - Transparent payout selection
  - Contribution quality scoring
  - Community trust metrics
  - Verifiable randomness
  - Fairness explanations

## 🏗️ Architecture

### Microservices Architecture
```
┌──────────────────────┐
│ AI Worker Cluster    │ - Fraud / Credit / Forecast Jobs
├──────────────────────┤
│ ai-credit (FastAPI)  │ - Port 8001
│ ai-fraud (FastAPI)   │ - Port 8002
│ ai-insights (FastAPI)│ - Port 8003
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│ Node.js Backend TRPC │ -- AI Gateway
├──────────────────────┤
│ CreditAIService      │
│ FraudEngine          │
│ Webhook Queue        │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│ React Frontend       │
├──────────────────────┤
│ ChatAssistant        │
│ AIInsightsDashboard  │
│ CreditScore          │
└──────────────────────┘
```

### Service Communication
- **Internal**: HTTP REST APIs between microservices
- **External**: TRPC for frontend-backend communication
- **Queue**: Redis for asynchronous job processing
- **Database**: PostgreSQL for persistent data storage

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- Redis
- PostgreSQL

### Installation

1. **Clone and Setup**
```bash
git clone <repository>
cd sunu-sav
```

2. **Environment Configuration**
```bash
cp security.env.template .env
# Edit .env with your configuration
```

3. **Start AI Services**
```bash
# Start all services including AI microservices
docker-compose -f docker-compose.ai.yml up -d

# Or start individual services
docker-compose up ai-credit ai-fraud ai-insights -d
```

4. **Install Dependencies**
```bash
# Backend dependencies
npm install

# AI service dependencies
cd services/ai-credit && pip install -r requirements.txt
cd ../ai-fraud && pip install -r requirements.txt
cd ../ai-insights && pip install -r requirements.txt
```

5. **Start Development Server**
```bash
npm run dev
```

### Access Points
- **Main App**: http://localhost:3000
- **AI Credit Service**: http://localhost:8001
- **AI Fraud Service**: http://localhost:8002
- **AI Insights Service**: http://localhost:8003
- **AI Features Page**: http://localhost:3000/ai-features

## 🔧 Configuration

### Environment Variables

#### Main Application
```env
# AI Service URLs
AI_CREDIT_SERVICE_URL=http://ai-credit:8001
AI_FRAUD_SERVICE_URL=http://ai-fraud:8002
AI_INSIGHTS_SERVICE_URL=http://ai-insights:8003

# OpenAI API (for chat assistant)
OPENAI_API_KEY=your_openai_api_key

# Database
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

#### AI Services
```env
# Credit Scoring
MODEL_PATH=/app/models/credit_score_model.pkl

# Fraud Detection
MODELS_DIR=/app/models

# Insights
DATA_DIR=/app/data
```

## 📊 API Endpoints

### Credit Scoring API
```typescript
// Get user credit score
GET /api/ai/credit/getScore?userId=user123

// Update credit score
POST /api/ai/credit/updateScore
{
  "userId": "user123",
  "score": 0.85
}

// Batch credit scoring
POST /api/ai/credit/getBatchScores
{
  "userIds": ["user1", "user2", "user3"]
}
```

### Fraud Detection API
```typescript
// Detect fraud for single transaction
POST /api/ai/fraud/detect
{
  "transactionId": "tx123",
  "userId": "user123",
  "amount": 10000,
  "intervalTime": 300,
  "numInvoices": 1
}

// Batch fraud detection
POST /api/ai/fraud/detectBatch
{
  "transactions": [...]
}
```

### AI Insights API
```typescript
// Project savings
POST /api/ai/insights/projectSavings
{
  "userId": "user123",
  "weeklyAmountXOF": 5000,
  "durationMonths": 6,
  "currentBtcPriceXOF": 50000
}

// Get market insights
GET /api/ai/insights/getMarketInsights

// Get inflation history
GET /api/ai/insights/getInflationHistory?days=30
```

### Chat Assistant API
```typescript
// Send message to AI assistant
POST /api/ai/chat/sendMessage
{
  "message": "How much do I owe this week?",
  "language": "wolof",
  "userId": "user123"
}
```

## 🎯 Usage Examples

### Frontend Integration

#### Credit Score Component
```tsx
import CreditScore from '@/components/CreditScore';

function UserProfile({ userId }) {
  return (
    <div>
      <CreditScore userId={userId} />
    </div>
  );
}
```

#### AI Insights Dashboard
```tsx
import AIInsightsDashboard from '@/components/AIInsightsDashboard';

function Dashboard({ userId }) {
  return (
    <div>
      <AIInsightsDashboard userId={userId} />
    </div>
  );
}
```

#### Chat Assistant
```tsx
import ChatAssistant from '@/components/ChatAssistant';

function App() {
  return (
    <div>
      <ChatAssistant userId="user123" />
    </div>
  );
}
```

### Backend Integration

#### Credit Scoring Service
```javascript
const { CreditAIService } = require('./services/AIService');
const creditAI = new CreditAIService();

// Get user credit score
const score = await creditAI.getUserCreditScore(userId);
console.log(`Credit Score: ${score.credit_score}`);

// Update credit score
await creditAI.updateCreditScoreForUser(userId, score.credit_score);
```

#### Fraud Detection
```javascript
const { FraudDetectionService } = require('./services/AIService');
const fraudAI = new FraudDetectionService();

// Detect fraud
const detection = await fraudAI.detectFraud({
  id: transactionId,
  user_id: userId,
  amount: amount,
  interval_time: intervalTime
});

if (detection.is_fraudulent) {
  console.log('Fraud detected:', detection.fraud_type);
}
```

## 🌍 Localization

### Supported Languages
- **English**: Default language
- **French**: Primary local language
- **Wolof**: Local dialect with cultural context

### Translation Keys
```json
{
  "aiAssistant": "Assistant IA",
  "creditScore": "Score de Crédit",
  "fraudDetection": "Détection de Fraude",
  "marketInsights": "Insights du Marché",
  "askMeAnything": "Demandez-moi n'importe quoi",
  "typeYourMessage": "Tapez votre message",
  "listening": "Écoute"
}
```

## 🔒 Security Considerations

### Data Privacy
- All AI models run locally (no external API calls for sensitive data)
- User data is anonymized before processing
- Credit scores are encrypted in transit and at rest

### Fraud Prevention
- Real-time monitoring of all transactions
- Automated blocking of suspicious activities
- Manual review queue for high-risk transactions

### Model Security
- Models are versioned and validated
- Regular retraining with new data
- A/B testing for model improvements

## 📈 Performance Metrics

### Expected Performance
- **Credit Scoring**: < 100ms response time
- **Fraud Detection**: < 50ms response time
- **Chat Assistant**: < 2s response time
- **Market Insights**: < 500ms response time

### Scalability
- Horizontal scaling of AI microservices
- Redis-based job queue for batch processing
- Database connection pooling
- CDN for static AI model files

## 🧪 Testing

### Unit Tests
```bash
# Test AI services
cd services/ai-credit && python -m pytest
cd services/ai-fraud && python -m pytest
cd services/ai-insights && python -m pytest

# Test backend integration
npm test
```

### Integration Tests
```bash
# Test full AI pipeline
npm run test:ai-integration
```

### Load Testing
```bash
# Test AI service performance
npm run test:load
```

## 🚀 Deployment

### Production Deployment
```bash
# Build AI services
docker-compose -f docker-compose.ai.yml build

# Deploy to production
docker-compose -f docker-compose.ai.yml up -d

# Scale services
docker-compose -f docker-compose.ai.yml up -d --scale ai-credit=3 --scale ai-fraud=2
```

### Monitoring
- Health checks for all AI services
- Prometheus metrics collection
- Grafana dashboards for AI performance
- Alerting for service failures

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch for AI improvements
3. Add tests for new AI functionality
4. Update documentation
5. Submit pull request

### AI Model Updates
1. Train new models in separate environment
2. Validate model performance
3. Deploy with versioning
4. Monitor production performance

## 📚 Resources

### Documentation
- [AI Service API Documentation](./docs/ai-api.md)
- [Model Training Guide](./docs/model-training.md)
- [Deployment Guide](./docs/deployment.md)

### External Resources
- [LightGBM Documentation](https://lightgbm.readthedocs.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Prophet Documentation](https://facebook.github.io/prophet/)
- [PyOD Documentation](https://pyod.readthedocs.io/)

## 🆘 Support

### Troubleshooting
- Check service health: `curl http://localhost:8001/health`
- View logs: `docker-compose logs ai-credit`
- Restart services: `docker-compose restart ai-credit ai-fraud ai-insights`

### Common Issues
1. **Model Loading Errors**: Check model file paths and permissions
2. **Service Communication**: Verify network connectivity between services
3. **Memory Issues**: Monitor RAM usage and scale services accordingly
4. **Performance Degradation**: Check Redis queue and database connections

---

**Note**: This AI integration is designed to be culturally sensitive and economically relevant for the Senegalese market, with particular attention to local languages, financial behaviors, and community trust patterns.
