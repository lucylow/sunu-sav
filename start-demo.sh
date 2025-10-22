#!/bin/bash
# start-demo.sh

set -e

echo "🚀 Starting Tontine Bitcoin Demo..."
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
mkdir -p logs
mkdir -p data

echo "📦 Building and starting services..."
docker-compose down && docker-compose up --build -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Wait for backend to be ready
echo "🔍 Checking backend health..."
until curl -s http://localhost:3000/health > /dev/null; do
    echo "   Backend not ready yet... waiting 5 seconds"
    sleep 5
done

echo "✅ All services are running!"
echo ""
echo "🌐 Demo URLs:"
echo "   Backend API: http://localhost:3000"
echo "   API Documentation: http://localhost:3000/api/docs"
echo "   Health Check: http://localhost:3000/health"
echo "   Lightning Mock: http://localhost:8080"
echo ""
echo "📱 Test Endpoints:"
echo "   Create User: curl -X POST http://localhost:3000/api/users"
echo "   Create Tontine: curl -X POST http://localhost:3000/api/tontine/groups"
echo ""
echo "💡 Run the demo script: ./scripts/test-happy-path.sh"
echo "======================================"
