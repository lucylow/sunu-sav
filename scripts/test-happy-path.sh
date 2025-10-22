#!/bin/bash
# scripts/test-happy-path.sh

echo "🧪 Running Happy Path Test..."
echo "==============================="

# Wait for backend to be ready
until curl -s http://localhost:3000/health > /dev/null; do
    sleep 2
done

# Run the demo script
node scripts/demo-happy-path.js

# Test API endpoints
echo ""
echo "🔍 Testing individual endpoints..."
curl -s http://localhost:3000/api/status | jq '.system'

echo ""
echo "✅ All tests completed!"
