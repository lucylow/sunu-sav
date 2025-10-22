# backend/monetization/README.md
# SunuSàv Monetization System

A comprehensive monetization and fee management system for the SunuSàv tontine platform, built with FastAPI, SQLAlchemy, and Celery.

## Features

### 💰 Fee Management
- **Tiered Transaction Fees**: 0.5% - 1% base fee with discounts for verified groups and recurring users
- **Fee Splitting**: Automatic distribution between platform, community fund, and partner settlements
- **Dynamic Pricing**: Configurable fee structures based on user tiers and group verification status

### ⚡ Lightning Integration
- **Lightning Payouts**: Automated Lightning Network payments for tontine winners
- **Invoice Management**: Create and track Lightning invoices for contributions and payouts
- **Payment Verification**: Preimage verification and transaction logging

### 📱 Mobile Money Partners
- **Multi-Partner Support**: Integration with Wave, Orange Money, and MTN Mobile Money
- **Cash-Out Processing**: Convert Lightning payments to local fiat currency
- **Settlement Management**: Automated partner settlement processing

### 💳 Subscription Management
- **Tiered Subscriptions**: Standard, Pro, and Enterprise tiers
- **Fee Discounts**: Reduced transaction fees for subscribers
- **Payment Processing**: Lightning and mobile money payment support

### 📊 Revenue Reporting
- **Real-Time Analytics**: Live revenue tracking and reporting
- **Community Fund Management**: Transparent community fund distribution
- **Partner Settlement Tracking**: Comprehensive partner payment monitoring

### 🔄 Background Processing
- **Scheduled Tasks**: Automated payout processing and settlement management
- **Celery Integration**: Scalable background task processing
- **Health Monitoring**: System health checks and monitoring

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI API   │    │   Celery Tasks   │    │   MySQL DB      │
│                 │    │                 │    │                 │
│ • Fee Calc      │◄──►│ • Payouts       │◄──►│ • Models        │
│ • Subscriptions │    │ • Settlements    │    │ • Transactions  │
│ • Partners      │    │ • Reports        │    │ • Fees          │
│ • Reports       │    │ • Cleanup        │    │ • Subscriptions │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Lightning Node  │    │   Redis Queue   │    │ Partner APIs    │
│                 │    │                 │    │                 │
│ • LND Client    │    │ • Task Queue    │    │ • Wave          │
│ • Invoice Mgmt  │    │ • Results       │    │ • Orange        │
│ • Payment Proc  │    │ • Scheduling    │    │ • MTN           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- MySQL 8.0+
- Redis 7+
- Lightning Network Daemon (LND) or mock node

### Installation

1. **Clone and setup**:
```bash
cd backend/monetization
cp env.example .env
# Edit .env with your configuration
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Start with Docker Compose**:
```bash
docker-compose up -d
```

4. **Or run manually**:
```bash
# Start Redis and MySQL
# Start the API
uvicorn main:app --host 0.0.0.0 --port 8001

# Start Celery worker (in another terminal)
celery -A tasks worker --loglevel=info

# Start Celery beat (in another terminal)
celery -A tasks beat --loglevel=info
```

### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **Flower (Celery)**: http://localhost:5555

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONETIZATION_DATABASE_URL` | MySQL connection string | `mysql+pymysql://sunusav:sunusav_password@localhost:3307/sunusav_monetization` |
| `CELERY_BROKER_URL` | Redis broker URL | `redis://localhost:6380/0` |
| `LND_HOST` | Lightning node host | `localhost:10009` |
| `WAVE_API_KEY` | Wave API key | Required for Wave integration |
| `ORANGE_API_KEY` | Orange Money API key | Required for Orange integration |
| `FALLBACK_BTC_XOF_RATE` | Fallback BTC/XOF rate | `8000000` |

### Fee Configuration

Default fee structure:
- **Base Fee**: 1% of payout amount
- **Verified Group Discount**: 50% reduction
- **Recurring User Discount**: 25% reduction
- **Community Fund Share**: 20% of collected fees
- **Partner Reserve**: 30% of collected fees

## API Endpoints

### Fee Calculation
- `POST /monetization/fees/calculate` - Calculate fees for a payout
- `GET /monetization/fees/tiers` - Get available fee tiers
- `POST /monetization/fees/project-annual-revenue` - Project annual revenue

### Payouts
- `POST /monetization/payouts/process` - Process a payout
- `POST /monetization/payouts/schedule` - Schedule a payout
- `GET /monetization/payouts/status/{cycle_id}` - Get payout status

### Subscriptions
- `POST /monetization/subscriptions` - Create subscription
- `DELETE /monetization/subscriptions/{id}` - Cancel subscription
- `GET /monetization/subscriptions/user/{user_id}` - Get user subscription
- `GET /monetization/subscriptions/stats` - Get subscription statistics

### Partners
- `POST /monetization/partners/settle` - Process partner settlements
- `GET /monetization/partners/settlements/summary` - Get settlement summary
- `GET /monetization/partners/{partner}/balance` - Get partner balance

### Reports
- `POST /monetization/reports/revenue` - Generate revenue report
- `GET /monetization/reports/revenue/summary` - Get revenue summary
- `GET /monetization/reports/revenue/trends` - Get revenue trends

### Community Fund
- `GET /monetization/community-fund/status` - Get fund status
- `POST /monetization/community-fund/distribute` - Create distribution
- `POST /monetization/community-fund/distribute/{id}/approve` - Approve distribution
- `POST /monetization/community-fund/distribute/{id}/execute` - Execute distribution

## Usage Examples

### Calculate Fees
```python
import requests

response = requests.post("http://localhost:8001/monetization/fees/calculate", json={
    "payout_sats": 100000,
    "group_verified": True,
    "user_recurring": False
})

fee_info = response.json()
print(f"Fee: {fee_info['sats_fee']} sats")
print(f"Platform: {fee_info['platform_share']} sats")
print(f"Community: {fee_info['community_share']} sats")
```

### Process Payout
```python
response = requests.post("http://localhost:8001/monetization/payouts/process", json={
    "cycle_id": "cycle-123",
    "group_verified": True,
    "user_recurring": False
})

payout_result = response.json()
print(f"Payout processed: {payout_result['status']}")
```

### Create Subscription
```python
response = requests.post("http://localhost:8001/monetization/subscriptions", json={
    "user_id": "user-123",
    "tier": "pro",
    "payment_method": "lightning"
})

subscription = response.json()
print(f"Subscription created: {subscription['id']}")
```

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black .
flake8 .
mypy .
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

## Production Deployment

### Docker Production
```bash
# Build production image
docker build -t sunusav-monetization:latest .

# Run with production settings
docker run -d \
  --name sunusav-monetization \
  -p 8001:8001 \
  -e MONETIZATION_DATABASE_URL="mysql+pymysql://user:pass@host:port/db" \
  -e CELERY_BROKER_URL="redis://host:port/0" \
  sunusav-monetization:latest
```

### Environment Setup
1. Set up MySQL database with proper permissions
2. Configure Redis for Celery
3. Set up Lightning node with proper credentials
4. Configure partner API keys
5. Set up monitoring and logging

## Security Considerations

- **API Keys**: Store partner API keys securely (use environment variables)
- **Database**: Use strong passwords and enable SSL
- **Lightning**: Secure LND credentials and use proper macaroons
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Audit Logging**: Enable comprehensive audit logging

## Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /monetization/health` - Detailed system health

### Metrics
- Revenue tracking
- Fee collection rates
- Partner settlement success rates
- Subscription conversion rates
- System performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Create an issue in the repository
- Contact the SunuSàv team
- Check the documentation at `/docs`
