#!/bin/bash
# setup-lnd-secrets.sh
# Script to set up LND secrets for Docker development

set -e

echo "🔧 Setting up LND secrets for SunuSàv..."

# Create secrets directory
mkdir -p secrets/lnd

# Check if LND is running and get secrets
if docker ps | grep -q lnd; then
    echo "📋 Copying secrets from running LND container..."
    
    # Copy admin macaroon
    docker cp $(docker ps -q --filter "name=lnd"):/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon secrets/lnd/admin.macaroon
    
    # Copy TLS cert
    docker cp $(docker ps -q --filter "name=lnd"):/root/.lnd/tls.cert secrets/lnd/tls.cert
    
    # Set proper permissions
    chmod 600 secrets/lnd/admin.macaroon
    chmod 644 secrets/lnd/tls.cert
    
    echo "✅ LND secrets copied successfully!"
    echo "📁 Macaroon: secrets/lnd/admin.macaroon"
    echo "📁 TLS Cert: secrets/lnd/tls.cert"
else
    echo "⚠️  LND container not running. Starting LND first..."
    docker-compose up -d lnd
    
    echo "⏳ Waiting for LND to initialize..."
    sleep 30
    
    echo "📋 Copying secrets from LND container..."
    docker cp $(docker ps -q --filter "name=lnd"):/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon secrets/lnd/admin.macaroon
    docker cp $(docker ps -q --filter "name=lnd"):/root/.lnd/tls.cert secrets/lnd/tls.cert
    
    chmod 600 secrets/lnd/admin.macaroon
    chmod 644 secrets/lnd/tls.cert
    
    echo "✅ LND secrets setup complete!"
fi

echo ""
echo "🚀 You can now start the backend with LND integration:"
echo "   docker-compose up backend"
echo ""
echo "🔍 To check LND status:"
echo "   curl -k https://localhost:8080/v1/getinfo"
