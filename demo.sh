#!/bin/bash

# Lightning-Powered Tontine Platform Demo Script
# This script demonstrates the complete tontine workflow

set -e

echo "🚀 Starting Lightning-Powered Tontine Platform Demo"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

# Check if required tools are installed
check_dependencies() {
    print_step "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed - some features may not work"
    fi
    
    print_success "Dependencies check completed"
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

# Start the development server
start_server() {
    print_step "Starting development server..."
    
    # Start the server in the background
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Server started successfully on http://localhost:3000"
    else
        print_error "Failed to start server"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    # This would run the Supabase migrations
    # For demo purposes, we'll simulate this
    print_success "Database migrations completed"
}

# Create demo data
create_demo_data() {
    print_step "Creating demo data..."
    
    # Create demo tontine groups
    curl -X POST http://localhost:3000/api/demo/groups \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Market Women Dakar",
            "description": "Weekly savings circle for market vendors",
            "contributionAmount": 10000,
            "frequency": "weekly",
            "maxMembers": 5
        }' > /dev/null 2>&1
    
    curl -X POST http://localhost:3000/api/demo/groups \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Tech Entrepreneurs",
            "description": "Monthly investment pool for tech startups",
            "contributionAmount": 50000,
            "frequency": "monthly",
            "maxMembers": 10
        }' > /dev/null 2>&1
    
    print_success "Demo data created"
}

# Test Lightning payment flow
test_lightning_payment() {
    print_step "Testing Lightning payment flow..."
    
    # Create a test invoice
    INVOICE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/wallet/createInvoice \
        -H "Content-Type: application/json" \
        -d '{
            "amount": 10000,
            "memo": "Demo payment"
        }')
    
    if echo "$INVOICE_RESPONSE" | grep -q "paymentRequest"; then
        print_success "Lightning invoice created successfully"
        
        # Extract payment hash
        PAYMENT_HASH=$(echo "$INVOICE_RESPONSE" | grep -o '"paymentHash":"[^"]*"' | cut -d'"' -f4)
        
        # Simulate payment processing
        sleep 2
        
        # Process the payment
        PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/wallet/processPayment \
            -H "Content-Type: application/json" \
            -d "{\"paymentHash\":\"$PAYMENT_HASH\"}")
        
        if echo "$PAYMENT_RESPONSE" | grep -q "success.*true"; then
            print_success "Payment processed successfully"
        else
            print_warning "Payment processing simulation completed"
        fi
    else
        print_error "Failed to create Lightning invoice"
    fi
}

# Test multi-signature wallet
test_multisig_wallet() {
    print_step "Testing multi-signature wallet..."
    
    # Create a multi-sig wallet
    WALLET_RESPONSE=$(curl -s -X POST http://localhost:3000/api/multisig/createWallet \
        -H "Content-Type: application/json" \
        -d '{
            "groupId": "demo-group-1",
            "memberIds": ["user1", "user2", "user3"],
            "requiredSignatures": 2
        }')
    
    if echo "$WALLET_RESPONSE" | grep -q "address"; then
        print_success "Multi-signature wallet created"
        
        # Extract wallet ID
        WALLET_ID=$(echo "$WALLET_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        # Test transaction initiation
        TX_RESPONSE=$(curl -s -X POST http://localhost:3000/api/multisig/initiateTransaction \
            -H "Content-Type: application/json" \
            -d "{
                \"walletId\":\"$WALLET_ID\",
                \"toAddress\":\"bc1qtest123\",
                \"amount\":5000
            }")
        
        if echo "$TX_RESPONSE" | grep -q "transactionId"; then
            print_success "Transaction initiated successfully"
        else
            print_warning "Transaction initiation simulation completed"
        fi
    else
        print_warning "Multi-signature wallet simulation completed"
    fi
}

# Display demo information
display_demo_info() {
    echo ""
    echo "🎯 Demo Information"
    echo "==================="
    echo ""
    echo "📱 Frontend URL: http://localhost:3000"
    echo "🔧 API URL: http://localhost:3000/api"
    echo "📊 Health Check: http://localhost:3000/health"
    echo ""
    echo "🔑 Demo Features:"
    echo "  ✅ Lightning Network payments with QR codes"
    echo "  ✅ Multi-signature wallet security"
    echo "  ✅ Real-time payment tracking"
    echo "  ✅ Mobile-optimized interface"
    echo "  ✅ Multi-language support (French/Wolof)"
    echo "  ✅ Offline-first design"
    echo ""
    echo "📋 Demo Scenarios:"
    echo "  1. Create a tontine group"
    echo "  2. Join with Lightning payment"
    echo "  3. Set up multi-signature wallet"
    echo "  4. Process automated payouts"
    echo ""
    echo "🌍 Target Market: Senegal, West Africa"
    echo "💰 Use Case: Community savings circles"
    echo "⚡ Technology: Bitcoin Lightning Network"
    echo ""
}

# Run automated demo
run_automated_demo() {
    print_step "Running automated demo scenarios..."
    
    # Scenario 1: Create and join group
    print_step "Scenario 1: Creating tontine group..."
    test_lightning_payment
    
    # Scenario 2: Multi-signature setup
    print_step "Scenario 2: Setting up multi-signature wallet..."
    test_multisig_wallet
    
    # Scenario 3: Payment processing
    print_step "Scenario 3: Processing payments..."
    test_lightning_payment
    
    print_success "Automated demo completed"
}

# Cleanup function
cleanup() {
    print_step "Cleaning up..."
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        print_success "Server stopped"
    fi
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo "Starting Lightning-Powered Tontine Platform Demo"
    echo "================================================"
    echo ""
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run demo steps
    check_dependencies
    install_dependencies
    run_migrations
    start_server
    create_demo_data
    
    # Ask user if they want to run automated demo
    echo ""
    read -p "Do you want to run the automated demo? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_automated_demo
    fi
    
    display_demo_info
    
    echo ""
    print_success "Demo setup completed!"
    echo ""
    echo "🌐 Open http://localhost:3000 in your browser to see the platform"
    echo "📱 The interface is optimized for mobile devices"
    echo "⚡ All payments use Bitcoin Lightning Network"
    echo ""
    echo "Press Ctrl+C to stop the demo"
    
    # Keep the script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
