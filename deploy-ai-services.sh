#!/usr/bin/env bash

# SunuSàv AI Services Deployment Script
# This script deploys all AI microservices with proper configuration

set -e

echo "🚀 Deploying SunuSàv AI Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f ".env.ai" ]; then
    print_status "Creating .env.ai file..."
    cat > .env.ai << EOF
# AI Services Configuration
AI_INTERNAL_TOKEN=$(openssl rand -hex 32)
LIGHTNING_NETWORK=testnet
NODE_ENV=development

# Database Configuration
POSTGRES_DB=sunusav
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# AI Service URLs
AI_CREDIT_URL=http://ai-credit:8001
AI_FRAUD_URL=http://ai-fraud:8002
EOF
    print_success "Created .env.ai file"
else
    print_status "Using existing .env.ai file"
fi

# Load environment variables
export $(cat .env.ai | grep -v '^#' | xargs)

# Create model directories
print_status "Creating model directories..."
mkdir -p services/ai-credit/models
mkdir -p services/ai-fraud/models

# Train AI models if they don't exist
if [ ! -f "services/ai-credit/models/credit_score_model.pkl" ]; then
    print_status "Training credit scoring model..."
    cd services/ai-credit
    python3 -m pip install -r requirements.txt
    python3 train/train_credit_model.py
    cd ../..
    print_success "Credit scoring model trained"
else
    print_status "Credit scoring model already exists"
fi

if [ ! -f "services/ai-fraud/models/fraud_iforest.pkl" ]; then
    print_status "Training fraud detection model..."
    cd services/ai-fraud
    python3 -m pip install -r requirements.txt
    python3 train/train_fraud_model.py
    cd ../..
    print_success "Fraud detection model trained"
else
    print_status "Fraud detection model already exists"
fi

# Build and start services
print_status "Building and starting AI services..."
docker-compose -f docker-compose.ai.yml down --remove-orphans
docker-compose -f docker-compose.ai.yml up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check Redis
if docker-compose -f docker-compose.ai.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    print_success "Redis is healthy"
else
    print_error "Redis is not healthy"
    exit 1
fi

# Check PostgreSQL
if docker-compose -f docker-compose.ai.yml exec -T postgres pg_isready -U postgres | grep -q "accepting connections"; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not healthy"
    exit 1
fi

# Check AI Credit Service
if curl -f http://localhost:8001/health > /dev/null 2>&1; then
    print_success "AI Credit Service is healthy"
else
    print_error "AI Credit Service is not healthy"
    exit 1
fi

# Check AI Fraud Service
if curl -f http://localhost:8002/health > /dev/null 2>&1; then
    print_success "AI Fraud Service is healthy"
else
    print_error "AI Fraud Service is not healthy"
    exit 1
fi

# Check Backend Service
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend Service is healthy"
else
    print_warning "Backend Service health check failed (may still be starting)"
fi

print_success "🎉 AI Services deployed successfully!"
echo ""
echo "📊 Service Endpoints:"
echo "  • AI Credit Scoring: http://localhost:8001"
echo "  • AI Fraud Detection: http://localhost:8002"
echo "  • Backend API: http://localhost:3001"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: docker-compose -f docker-compose.ai.yml logs -f"
echo "  • Stop services: docker-compose -f docker-compose.ai.yml down"
echo "  • Restart services: docker-compose -f docker-compose.ai.yml restart"
echo "  • Scale workers: docker-compose -f docker-compose.ai.yml up -d --scale credit-worker=2 --scale fraud-worker=2"
echo ""
echo "🧪 Test AI Services:"
echo "  • Credit Score: curl -X POST http://localhost:8001/predict -H 'X-Internal-Token: $AI_INTERNAL_TOKEN' -H 'Content-Type: application/json' -d '{\"user_id\":\"test\",\"tontine_contributions\":50000,\"punctuality_rate\":0.9,\"contributions_count\":10,\"mobile_tx_volume\":100000,\"avg_payment_delay_days\":1,\"community_endorsements\":5}'"
echo "  • Fraud Check: curl -X POST http://localhost:8002/check -H 'X-Internal-Token: $AI_INTERNAL_TOKEN' -H 'Content-Type: application/json' -d '{\"user_id\":\"test\",\"amount_sats\":1000000,\"time_since_last_sec\":5,\"invoices_last_min\":10,\"device_changes\":3,\"location_changes\":2}'"
echo ""
echo "🔐 Security Notes:"
echo "  • AI_INTERNAL_TOKEN: $AI_INTERNAL_TOKEN"
echo "  • Change default passwords in production"
echo "  • Use TLS/mTLS for service communication"
echo "  • Rotate AI_INTERNAL_TOKEN regularly"
echo ""
echo "📈 Monitoring:"
echo "  • Queue stats: docker-compose -f docker-compose.ai.yml exec backend node -e \"require('./server/jobs/enqueueCreditCheck').getQueueStats().then(console.log)\""
echo "  • Database: docker-compose -f docker-compose.ai.yml exec postgres psql -U postgres -d sunusav -c \"SELECT * FROM ai_alerts LIMIT 5;\""
echo ""

# Optional: Run a quick test
read -p "Would you like to run a quick AI service test? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running AI service test..."
    
    # Test credit scoring
    CREDIT_RESPONSE=$(curl -s -X POST http://localhost:8001/predict \
        -H "X-Internal-Token: $AI_INTERNAL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"user_id":"test-user","tontine_contributions":50000,"punctuality_rate":0.9,"contributions_count":10,"mobile_tx_volume":100000,"avg_payment_delay_days":1,"community_endorsements":5}')
    
    if echo "$CREDIT_RESPONSE" | grep -q "credit_score"; then
        print_success "Credit scoring test passed"
        echo "Response: $CREDIT_RESPONSE"
    else
        print_error "Credit scoring test failed"
    fi
    
    # Test fraud detection
    FRAUD_RESPONSE=$(curl -s -X POST http://localhost:8002/check \
        -H "X-Internal-Token: $AI_INTERNAL_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"user_id":"test-user","amount_sats":1000000,"time_since_last_sec":5,"invoices_last_min":10,"device_changes":3,"location_changes":2}')
    
    if echo "$FRAUD_RESPONSE" | grep -q "alert"; then
        print_success "Fraud detection test passed"
        echo "Response: $FRAUD_RESPONSE"
    else
        print_error "Fraud detection test failed"
    fi
fi

print_success "AI Services deployment complete! 🚀"