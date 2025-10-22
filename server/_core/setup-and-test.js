#!/usr/bin/env node

/**
 * Complete setup script for SunuSàv backend with mock data
 * Runs migrations, seeds data, and tests all monetization flows
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 SunuSàv Backend Setup & Testing');
console.log('=====================================\n');

async function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname),
      env: { ...process.env, NODE_ENV: 'development' }
    });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function setupBackend() {
  console.log('🔧 Setting up SunuSàv backend...\n');
  
  // Step 1: Install dependencies
  const depsInstalled = await runCommand('npm install', 'Installing dependencies');
  if (!depsInstalled) {
    console.error('❌ Failed to install dependencies');
    return false;
  }
  
  // Step 2: Run database migrations
  const migrationsRun = await runCommand('npm run migrate', 'Running database migrations');
  if (!migrationsRun) {
    console.error('❌ Failed to run migrations');
    return false;
  }
  
  // Step 3: Seed mock data
  const dataSeeded = await runCommand('node seed-sunusav.js', 'Seeding mock data');
  if (!dataSeeded) {
    console.error('❌ Failed to seed data');
    return false;
  }
  
  console.log('✅ Backend setup completed successfully!\n');
  return true;
}

async function testBackend() {
  console.log('🧪 Testing backend improvements...\n');
  
  // Test the improvements we implemented
  const improvementsTested = await runCommand('node test-improvements.js', 'Testing backend improvements');
  if (!improvementsTested) {
    console.error('❌ Backend improvements test failed');
    return false;
  }
  
  // Test monetization flows with seeded data
  const monetizationTested = await runCommand('node test-monetization-flows.js', 'Testing monetization flows');
  if (!monetizationTested) {
    console.error('❌ Monetization flows test failed');
    return false;
  }
  
  console.log('✅ All tests completed successfully!\n');
  return true;
}

async function main() {
  try {
    // Setup backend
    const setupSuccess = await setupBackend();
    if (!setupSuccess) {
      console.error('💥 Backend setup failed');
      process.exit(1);
    }
    
    // Test backend
    const testSuccess = await testBackend();
    if (!testSuccess) {
      console.error('💥 Backend testing failed');
      process.exit(1);
    }
    
    console.log('🎉 SunuSàv Backend Setup Complete!');
    console.log('=====================================');
    console.log('');
    console.log('📊 What was set up:');
    console.log('   ✅ PostgreSQL database with all tables');
    console.log('   ✅ Redis for job queues');
    console.log('   ✅ Mock data for 3 tontine groups');
    console.log('   ✅ 5 users with realistic profiles');
    console.log('   ✅ Completed and active cycles');
    console.log('   ✅ Fee records and monetization data');
    console.log('   ✅ Partner settlements (Wave, Orange Money)');
    console.log('   ✅ Community fund contributions');
    console.log('');
    console.log('🔒 Security features tested:');
    console.log('   ✅ PostgreSQL advisory locks (race condition prevention)');
    console.log('   ✅ Webhook HMAC verification (signature validation)');
    console.log('   ✅ Background job processing (BullMQ workers)');
    console.log('');
    console.log('🚀 Ready for demo!');
    console.log('   Start the server: npm start');
    console.log('   Health check: http://localhost:3000/health/detailed');
    console.log('   Worker stats: http://localhost:3000/health/workers');
    console.log('');
    console.log('📱 Mock data includes:');
    console.log('   - Marché Liberté Women\'s Circle (completed cycle 1, active cycle 2)');
    console.log('   - Garage & Vendors Co-op (completed cycle 1)');
    console.log('   - Dakar University Students (active cycle 1)');
    console.log('   - Pro subscription for Aissatou Diop');
    console.log('   - Partner settlements with Wave and Orange Money');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { setupBackend, testBackend };
