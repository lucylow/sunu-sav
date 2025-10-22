#!/usr/bin/env bash

# SunuSàv AI Demo Script
# This script starts the development server and opens the AI demo page

set -e

echo "🚀 Starting SunuSàv AI Demo..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Check if client directory exists
if [ ! -d "client" ]; then
    print_error "Client directory not found. Please ensure you're in the correct project directory."
    exit 1
fi

# Install client dependencies if needed
if [ ! -d "client/node_modules" ]; then
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    print_success "Client dependencies installed"
fi

# Start the development server
print_status "Starting development server..."
print_status "The AI demo will be available at: http://localhost:3000/ai-demo"
print_status "Press Ctrl+C to stop the server"

# Start the server in the background
npm run dev &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 3

# Try to open the browser (works on macOS and Linux with xdg-open)
if command -v open &> /dev/null; then
    print_status "Opening browser..."
    open "http://localhost:3000/ai-demo" 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    print_status "Opening browser..."
    xdg-open "http://localhost:3000/ai-demo" 2>/dev/null || true
else
    print_warning "Could not automatically open browser. Please navigate to:"
    print_warning "http://localhost:3000/ai-demo"
fi

print_success "🎉 AI Demo is running!"
echo ""
echo "📊 Demo Features Available:"
echo "  • AI Credit Scoring with loan pre-approval"
echo "  • Multilingual Chat Assistant (Wolof/French/English)"
echo "  • Fraud Detection with real-time alerts"
echo "  • Lightning Routing Optimization"
echo "  • Bitcoin vs CFA Inflation Forecasting"
echo "  • Transparent Payout Fairness with AI explanations"
echo "  • Predictive Analytics for group completion"
echo "  • Smart Reminder Scheduling"
echo "  • Agent Recommendation System"
echo "  • Microtask Rewards with Lightning payments"
echo ""
echo "🔧 Technical Details:"
echo "  • All AI responses are mock/deterministic for demo purposes"
echo "  • Components are production-ready with proper error handling"
echo "  • Easy to switch from mock to real AI services"
echo "  • Responsive design works on mobile and desktop"
echo ""
echo "🌍 Senegalese Market Focus:"
echo "  • Wolof language support with cultural context"
echo "  • CFA inflation tracking vs Bitcoin"
echo "  • Local agent networks and mobile money integration"
echo "  • Offline-capable for poor connectivity areas"
echo ""

# Wait for user to stop the server
trap 'print_status "Stopping server..."; kill $SERVER_PID 2>/dev/null; print_success "Server stopped. Demo complete!"' INT

# Keep the script running
wait $SERVER_PID
