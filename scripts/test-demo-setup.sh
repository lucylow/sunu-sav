#!/usr/bin/env bash
set -euo pipefail

# test-demo-setup.sh - Test the demo setup without requiring full database
echo "🧪 Testing SunuSàv Demo Setup..."

echo "📦 Checking dependencies..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Dependencies check passed"

echo "📁 Checking project structure..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -d "server/_core" ]; then
    echo "❌ server/_core directory not found"
    exit 1
fi

if [ ! -d "client/src" ]; then
    echo "❌ client/src directory not found"
    exit 1
fi

echo "✅ Project structure check passed"

echo "🔧 Testing script execution..."
if [ ! -x "scripts/demo-setup.sh" ]; then
    echo "❌ demo-setup.sh is not executable"
    exit 1
fi

echo "✅ Script execution check passed"

echo "🌐 Testing Lightning service..."
if [ -f "server/_core/lightningService.ts" ]; then
    echo "✅ Lightning service file exists"
else
    echo "❌ Lightning service file not found"
    exit 1
fi

echo "🔐 Testing multi-sig service..."
if [ -f "server/_core/services/multiSigService.ts" ]; then
    echo "✅ Multi-sig service file exists"
else
    echo "❌ Multi-sig service file not found"
    exit 1
fi

echo "🎉 Demo setup test completed successfully!"
echo ""
echo "📋 Next steps for full demo:"
echo "1. Setup PostgreSQL database"
echo "2. Configure LND node (testnet)"
echo "3. Run: pnpm demo"
echo "4. Visit: http://localhost:3001"
