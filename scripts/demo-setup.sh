#!/usr/bin/env bash
set -euo pipefail

# demo-setup.sh - boot a local demo environment (expects Docker + docker-compose OR local DB)
echo "🚀 Setting up SunuSàv Demo Environment..."

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️ Running database migrations..."
pnpm db:migrate

echo "🌱 Seeding demo data..."
node ./scripts/seed-demo-data.js

echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
  echo "Creating .env file with demo settings..."
  cat > .env << EOF
# Demo Environment Variables
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=sunusav_demo

# Lightning Network (Testnet)
LND_REST_URL=https://testnet.lnd.yournode.com
LND_MACAROON_HEX=demo_macaroon_hex
WEBHOOK_SECRET=demo_webhook_secret_$(openssl rand -hex 16)

# Bitcoin Network
BITCOIN_NETWORK=testnet
BITCOIND_RPC_HOST=localhost
BITCOIND_RPC_PORT=18443
BITCOIND_RPC_USER=rpcuser
BITCOIND_RPC_PASS=rpcpass

# Redis (for workers)
REDIS_HOST=localhost
REDIS_PORT=6379

# Demo UTXO (for testing)
DEMO_UTXO_TXID=demo_txid_for_testing
DEMO_UTXO_VOUT=0
DEMO_UTXO_VALUE=100000
EOF
fi

echo "✅ Demo setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start your database (PostgreSQL)"
echo "2. Start Redis (for workers)"
echo "3. Configure LND node (testnet)"
echo "4. Run: pnpm dev"
echo ""
echo "📱 Demo will be available at: http://localhost:3001"
echo "🔗 API docs at: http://localhost:3001/api/docs"
