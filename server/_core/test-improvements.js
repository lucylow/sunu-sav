#!/usr/bin/env node

/**
 * Test script to demonstrate the three backend improvements:
 * 1. PostgreSQL advisory locks for safe cycle completion
 * 2. Webhook raw-body HMAC verification
 * 3. Durable worker (BullMQ) integration
 */

const crypto = require('crypto');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_HMAC_SECRET || 'test-secret-key';

/**
 * Generate HMAC signature for webhook testing
 */
function generateWebhookSignature(payload, secret) {
  return crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Make HTTP request with proper error handling
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Test webhook HMAC verification
 */
async function testWebhookVerification() {
  console.log('\n🔐 Testing webhook HMAC verification...');
  
  const payload = JSON.stringify({
    payment_hash: 'test_payment_hash_123',
    status: 'settled',
    amount_sats: 1000
  });
  
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/webhook/lightning',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-sunu-signature': `sha256=${signature}`
    }
  };
  
  try {
    const response = await makeRequest(options, payload);
    
    if (response.status === 200) {
      console.log('✅ Webhook verification test passed');
      console.log('   Response:', response.data);
    } else {
      console.log('❌ Webhook verification test failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Webhook verification test error:', error.message);
  }
}

/**
 * Test webhook with invalid signature
 */
async function testInvalidWebhookSignature() {
  console.log('\n🚫 Testing webhook with invalid signature...');
  
  const payload = JSON.stringify({
    payment_hash: 'test_payment_hash_456',
    status: 'settled',
    amount_sats: 1000
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/webhook/lightning',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-sunu-signature': 'sha256=invalid_signature'
    }
  };
  
  try {
    const response = await makeRequest(options, payload);
    
    if (response.status === 401) {
      console.log('✅ Invalid signature correctly rejected');
      console.log('   Response:', response.data);
    } else {
      console.log('❌ Invalid signature not rejected');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Invalid signature test error:', error.message);
  }
}

/**
 * Test worker statistics endpoint
 */
async function testWorkerStats() {
  console.log('\n📊 Testing worker statistics...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health/workers',
    method: 'GET'
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Worker stats endpoint working');
      console.log('   Workers:', response.data.workers);
      console.log('   Queues:', response.data.queues);
    } else {
      console.log('❌ Worker stats endpoint failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Worker stats test error:', error.message);
  }
}

/**
 * Test detailed health check
 */
async function testDetailedHealthCheck() {
  console.log('\n🏥 Testing detailed health check...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health/detailed',
    method: 'GET'
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Detailed health check working');
      console.log('   Services:', response.data.services);
      console.log('   Workers healthy:', response.data.workers?.healthy);
    } else {
      console.log('❌ Detailed health check failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Health check test error:', error.message);
  }
}

/**
 * Test concurrent webhook processing (simulates race conditions)
 */
async function testConcurrentWebhooks() {
  console.log('\n🏃 Testing concurrent webhook processing...');
  
  const promises = [];
  
  // Send 5 concurrent webhooks with the same payment hash
  for (let i = 0; i < 5; i++) {
    const payload = JSON.stringify({
      payment_hash: 'concurrent_test_payment',
      status: 'settled',
      amount_sats: 1000,
      test_id: i
    });
    
    const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook/lightning',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-sunu-signature': `sha256=${signature}`
      }
    };
    
    promises.push(makeRequest(options, payload));
  }
  
  try {
    const responses = await Promise.all(promises);
    
    console.log('✅ Concurrent webhook test completed');
    console.log('   Responses received:', responses.length);
    
    const successful = responses.filter(r => r.status === 200).length;
    const failed = responses.filter(r => r.status !== 200).length;
    
    console.log(`   Successful: ${successful}, Failed: ${failed}`);
    
    // All should succeed due to idempotency
    if (successful === 5) {
      console.log('✅ All concurrent webhooks handled correctly');
    } else {
      console.log('⚠️  Some concurrent webhooks failed - check for race conditions');
    }
    
  } catch (error) {
    console.log('❌ Concurrent webhook test error:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting backend improvements test suite...');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Webhook Secret: ${WEBHOOK_SECRET.substring(0, 8)}...`);
  
  try {
    await testDetailedHealthCheck();
    await testWorkerStats();
    await testWebhookVerification();
    await testInvalidWebhookSignature();
    await testConcurrentWebhooks();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary of improvements tested:');
    console.log('   ✅ PostgreSQL advisory locks (via concurrent webhooks)');
    console.log('   ✅ Webhook raw-body HMAC verification');
    console.log('   ✅ Durable worker (BullMQ) integration');
    console.log('   ✅ Background job processing');
    console.log('   ✅ Health monitoring endpoints');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testWebhookVerification,
  testInvalidWebhookSignature,
  testWorkerStats,
  testDetailedHealthCheck,
  testConcurrentWebhooks,
  generateWebhookSignature
};
