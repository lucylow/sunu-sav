#!/bin/bash

# SunuSàv AI Services Deployment Script
# This script deploys all AI microservices for the SunuSàv platform

set -e

echo "🚀 Starting SunuSàv AI Services Deployment..."

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

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f security.env.template ]; then
        cp security.env.template .env
        print_warning "Please edit .env file with your configuration before continuing."
        print_warning "Required variables:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - SUPABASE_SERVICE_ROLE_KEY"
        echo "  - OPENAI_API_KEY (optional, for chat assistant)"
        read -p "Press Enter to continue after editing .env file..."
    else
        print_error "security.env.template not found. Please create .env file manually."
        exit 1
    fi
fi

# Create necessary directories
print_status "Creating AI service directories..."
mkdir -p services/ai-credit/models
mkdir -p services/ai-fraud/models
mkdir -p services/ai-insights/data
mkdir -p services/ai-routing/models

# Build AI services
print_status "Building AI microservices..."

# Build Credit Scoring Service
print_status "Building AI Credit Scoring Service..."
cd services/ai-credit
if [ -f Dockerfile ]; then
    docker build -t sunusav-ai-credit .
    print_success "AI Credit Service built successfully"
else
    print_error "Dockerfile not found in services/ai-credit/"
    exit 1
fi
cd ../..

# Build Fraud Detection Service
print_status "Building AI Fraud Detection Service..."
cd services/ai-fraud
if [ -f Dockerfile ]; then
    docker build -t sunusav-ai-fraud .
    print_success "AI Fraud Service built successfully"
else
    print_error "Dockerfile not found in services/ai-fraud/"
    exit 1
fi
cd ../..

# Build AI Insights Service
print_status "Building AI Insights Service..."
cd services/ai-insights
if [ -f Dockerfile ]; then
    docker build -t sunusav-ai-insights .
    print_success "AI Insights Service built successfully"
else
    print_error "Dockerfile not found in services/ai-insights/"
    exit 1
fi
cd ../..

# Build AI Routing Service
print_status "Building AI Routing Service..."
cd services/ai-routing
if [ -f Dockerfile ]; then
    docker build -t sunusav-ai-routing .
    print_success "AI Routing Service built successfully"
else
    print_error "Dockerfile not found in services/ai-routing/"
    exit 1
fi
cd ../..

# Start services with Docker Compose
print_status "Starting AI services with Docker Compose..."

if [ -f docker-compose.ai.yml ]; then
    docker-compose -f docker-compose.ai.yml up -d
    print_success "AI services started successfully"
else
    print_error "docker-compose.ai.yml not found"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for AI services to be ready..."
sleep 10

# Check service health
print_status "Checking AI service health..."

services=(
    "ai-credit:8001"
    "ai-fraud:8002"
    "ai-insights:8003"
    "ai-routing:8004"
)

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d: -f1)
    service_port=$(echo $service | cut -d: -f2)
    
    print_status "Checking $service_name..."
    
    # Wait for service to be ready
    for i in {1..30}; do
        if curl -s -f "http://localhost:$service_port/health" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_warning "$service_name health check failed after 30 attempts"
        else
            sleep 2
        fi
    done
done

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if [ -f package.json ]; then
    npm install
    print_success "Node.js dependencies installed"
else
    print_warning "package.json not found, skipping npm install"
fi

# Start the main application
print_status "Starting main SunuSàv application..."
if command -v npm &> /dev/null; then
    print_status "You can now start the main application with: npm run dev"
    print_status "Or build and start with: npm run build && npm run start-server"
else
    print_warning "npm not found, please install Node.js and npm"
fi

# Display service URLs
print_success "🎉 SunuSàv AI Services Deployment Complete!"
echo ""
echo "📊 Service URLs:"
echo "  Main Application: http://localhost:3000"
echo "  AI Features Page: http://localhost:3000/ai-features"
echo "  AI Credit Service: http://localhost:8001"
echo "  AI Fraud Service: http://localhost:8002"
echo "  AI Insights Service: http://localhost:8003"
echo "  AI Routing Service: http://localhost:8004"
echo ""
echo "🔧 Management Commands:"
echo "  View logs: docker-compose -f docker-compose.ai.yml logs"
echo "  Stop services: docker-compose -f docker-compose.ai.yml down"
echo "  Restart services: docker-compose -f docker-compose.ai.yml restart"
echo "  Scale services: docker-compose -f docker-compose.ai.yml up -d --scale ai-credit=3"
echo ""
echo "📚 Documentation:"
echo "  AI Integration Guide: AI_INTEGRATION_README.md"
echo "  Implementation Summary: AI_IMPLEMENTATION_SUMMARY.md"
echo ""
print_success "Ready to experience AI-powered financial services! 🚀"

# Optional: Start the main application
read -p "Would you like to start the main application now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting main application..."
    npm run dev
fi
