# 🏦 SunuSàv Backend - Tontine Bitcoin Platform

A comprehensive backend implementation for the SunuSàv Tontine Bitcoin platform, featuring Lightning Network integration, multi-language support, and production-ready architecture.

## 🚀 Features

### Core Functionality
- **Tontine Management**: Create, join, and manage savings groups
- **Lightning Integration**: Bitcoin Lightning Network payments
- **Multi-language Support**: French, Wolof, and English
- **USSD/SMS Integration**: Mobile-first communication
- **Audit Logging**: Comprehensive security and compliance tracking
- **Real-time Notifications**: SMS and USSD notifications

### Technical Features
- **Database**: PostgreSQL with connection pooling
- **API**: RESTful API with comprehensive validation
- **Security**: Rate limiting, CORS, helmet, input validation
- **Monitoring**: Health checks, logging, error handling
- **Scalability**: Event-driven architecture, background jobs
- **Testing**: Comprehensive test suite with Jest

## 📁 Project Structure

```
server/_core/
├── app.js                 # Main application setup
├── server.js              # Server entry point
├── database.js            # Database connection manager
├── TontineService.js      # Core tontine business logic
├── TontineController.js   # API controllers
├── AuditService.js        # Security audit logging
├── NotificationService.js # SMS/USSD notifications
├── LightningService.js    # Lightning Network integration
├── i18n.ts               # Internationalization
├── localeMiddleware.ts    # Locale detection
├── validation.js         # Request validation
├── migrations/           # Database migrations
└── package.json         # Dependencies
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis (optional, for caching)

### Setup

1. **Clone and install dependencies:**
```bash
cd server/_core
npm install
```

2. **Environment configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup:**
```bash
# Create database
createdb sunu_sav

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

4. **Start development server:**
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=sunu_sav
DB_PASSWORD=your_password
DB_NAME=sunu_sav
DB_SSL=false

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SMS/Notifications
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Lightning Network
LIGHTNING_RPC_HOST=localhost
LIGHTNING_RPC_PORT=10009
LIGHTNING_RPC_CERT_PATH=/path/to/cert
LIGHTNING_RPC_MACAROON_PATH=/path/to/macaroon

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://sunu-sav.com
```

## 📊 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

### Tontine Groups
- `POST /api/tontine/groups` - Create new group
- `GET /api/tontine/groups` - List user's groups
- `GET /api/tontine/groups/:id` - Get group details
- `GET /api/tontine/groups/:id/status` - Get group status

### Members
- `POST /api/tontine/groups/:id/members` - Add member to group

### Contributions
- `GET /api/tontine/groups/:id/invoice` - Create contribution invoice

### Webhooks
- `POST /webhook/lightning` - Lightning payment webhook

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and preferences
- **tontine_groups**: Savings groups configuration
- **group_members**: Group membership and roles
- **contributions**: Payment records and status
- **payouts**: Cycle completion and distributions
- **audit_logs**: Security and compliance tracking
- **sms_logs**: Communication audit trail

### Key Features
- UUID primary keys for security
- Comprehensive foreign key relationships
- Audit trail for all operations
- Indexed queries for performance
- Data retention policies

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin/member)
- Request rate limiting
- IP-based restrictions

### Data Protection
- PII scrubbing in logs
- Encrypted sensitive data
- Audit trail for all operations
- Input validation and sanitization

### API Security
- CORS configuration
- Helmet security headers
- Request size limits
- SQL injection prevention

## 🌍 Multi-Language Support

### Supported Languages
- **French (fr)**: Primary language for Senegal
- **Wolof (wo)**: Local language with cultural context
- **English (en)**: International support

### Implementation
- Backend YAML translation files
- Locale detection middleware
- User preference storage
- SMS/USSD localization

## ⚡ Lightning Network Integration

### Features
- Invoice creation and management
- Payment verification and processing
- Fee estimation
- Channel balance monitoring
- Webhook handling

### Mock Implementation
The current implementation includes a mock Lightning service for development. Replace with actual Lightning node integration for production.

## 📱 SMS/USSD Integration

### SMS Features
- Multi-language SMS templates
- Delivery status tracking
- Retry mechanisms
- PII protection

### USSD Features
- Interactive menu system
- Language-specific responses
- Transaction processing
- Error handling

## 🧪 Testing

### Test Structure
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Categories
- Unit tests for services
- Integration tests for API
- Database migration tests
- Security validation tests

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Production Considerations
- Environment-specific configurations
- Database connection pooling
- Redis caching layer
- Load balancer configuration
- SSL/TLS termination
- Monitoring and alerting

## 📈 Monitoring & Logging

### Health Checks
- Database connectivity
- External service status
- System resource usage
- API response times

### Logging
- Structured JSON logging
- PII scrubbing
- Request/response tracking
- Error aggregation
- Performance metrics

## 🔄 Background Jobs

### Scheduled Tasks
- **Hourly**: Reminder notifications
- **15 minutes**: Cycle completion checks
- **Daily**: Audit log cleanup

### Job Processing
- SMS queue processing
- Payment verification
- Notification delivery
- Data cleanup tasks

## 🛡️ Error Handling

### Error Types
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "errorId": "request-uuid",
  "details": "Additional context"
}
```

## 📚 API Documentation

### Request/Response Examples

**Create Group:**
```bash
POST /api/tontine/groups
Content-Type: application/json
X-User-ID: user-uuid

{
  "name": "Family Savings",
  "description": "Monthly family tontine",
  "contributionAmountSats": 50000,
  "cycleDays": 30,
  "maxMembers": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "group-uuid",
    "name": "Family Savings",
    "status": "active",
    "current_cycle": 1,
    "created_at": "2023-12-01T10:00:00Z"
  },
  "message": "Tontine group created successfully"
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Write tests
4. Implement feature
5. Run tests and linting
6. Submit pull request

### Code Standards
- ESLint configuration
- Prettier formatting
- Jest testing
- JSDoc documentation
- Conventional commits

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/lucylow/sunu-sav/wiki)
- **Issues**: [GitHub Issues](https://github.com/lucylow/sunu-sav/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lucylow/sunu-sav/discussions)

---

**Built with ❤️ for financial inclusion in Senegal**
