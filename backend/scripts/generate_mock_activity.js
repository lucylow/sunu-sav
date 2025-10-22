// backend/scripts/generate_mock_activity.js
// Run: node backend/scripts/generate_mock_activity.js
// Generates realistic contribution history for the last 90 days

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tontine_user:tontine_password@localhost:5432/tontine'
});

// Mock activity patterns based on user personas
const activityPatterns = {
  '11111111-1111-4111-8111-111111111111': { // Fatou - Market vendor
    frequency: 'weekly',
    amount: 10000,
    dayOfWeek: 1, // Monday
    hour: 19,
    reliability: 0.95
  },
  '22222222-2222-4222-8222-222222222222': { // Mamadou - Traveling trader
    frequency: 'irregular',
    amount: 8000,
    dayOfWeek: 2, // Tuesday
    hour: 8,
    reliability: 0.70
  },
  '33333333-3333-4333-8333-333333333333': { // Aissatou - Diaspora
    frequency: 'weekly',
    amount: 25000,
    dayOfWeek: 0, // Sunday
    hour: 21,
    reliability: 0.98
  },
  '44444444-4444-4444-8444-444444444444': { // Seynabou - Community captain
    frequency: 'weekly',
    amount: 12000,
    dayOfWeek: 6, // Saturday
    hour: 18,
    reliability: 0.92
  },
  '55555555-5555-4555-8555-555555555555': { // Ousmane - Agent
    frequency: 'none',
    amount: 0,
    reliability: 1.0
  },
  '66666666-6666-4666-8666-666666666666': { // Cheikh - Farmer
    frequency: 'monthly',
    amount: 30000,
    dayOfWeek: 0, // Sunday
    hour: 7,
    reliability: 0.85
  },
  '77777777-7777-4777-8777-777777777777': { // Ndeye - Student
    frequency: 'weekly',
    amount: 2000,
    dayOfWeek: 6, // Saturday
    hour: 20,
    reliability: 0.88
  },
  '88888888-8888-4888-8888-888888888888': { // Baba - Elder
    frequency: 'biweekly',
    amount: 15000,
    dayOfWeek: 0, // Sunday
    hour: 10,
    reliability: 0.75
  },
  '99999999-9999-4999-8999-999999999999': { // Amadou - Developer
    frequency: 'weekly',
    amount: 15000,
    dayOfWeek: 6, // Saturday
    hour: 22,
    reliability: 0.90
  },
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa': { // Luc - Node operator
    frequency: 'none',
    amount: 0,
    reliability: 1.0
  }
};

// Group contribution schedules
const groupSchedules = {
  'g-market-01': { cycle_days: 7, amount: 10000 },
  'g-neighborhood-01': { cycle_days: 7, amount: 8000 },
  'g-family-01': { cycle_days: 7, amount: 25000 },
  'g-women-02': { cycle_days: 14, amount: 12000 },
  'g-farmers-01': { cycle_days: 30, amount: 30000 },
  'g-schoolmates-01': { cycle_days: 7, amount: 2000 },
  'g-elders-01': { cycle_days: 14, amount: 15000 },
  'g-devs-01': { cycle_days: 7, amount: 15000 }
};

function getRandomVariation(baseAmount, variationPercent = 0.1) {
  const variation = baseAmount * variationPercent;
  const randomVariation = (Math.random() - 0.5) * 2 * variation;
  return Math.max(100, Math.round(baseAmount + randomVariation)); // Minimum 100 sats
}

function shouldMakeContribution(pattern, date) {
  if (pattern.frequency === 'none') return false;
  
  const dayOfWeek = date.getDay();
  const reliability = pattern.reliability;
  
  switch (pattern.frequency) {
    case 'weekly':
      return dayOfWeek === pattern.dayOfWeek && Math.random() < reliability;
    case 'biweekly':
      return dayOfWeek === pattern.dayOfWeek && Math.random() < reliability * 0.5;
    case 'monthly':
      return dayOfWeek === pattern.dayOfWeek && date.getDate() <= 7 && Math.random() < reliability;
    case 'irregular':
      return Math.random() < reliability * 0.3; // 30% chance any day
    default:
      return false;
  }
}

function generateContributionsForUser(userId, pattern, startDate, endDate) {
  const contributions = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (shouldMakeContribution(pattern, currentDate)) {
      const amount = getRandomVariation(pattern.amount);
      const hour = pattern.hour + Math.floor(Math.random() * 4) - 2; // ±2 hour variation
      const minute = Math.floor(Math.random() * 60);
      
      const contributionDate = new Date(currentDate);
      contributionDate.setHours(hour, minute, 0, 0);
      
      contributions.push({
        id: uuidv4(),
        user_id: userId,
        amount_sats: amount,
        created_at: contributionDate,
        status: Math.random() < 0.95 ? 'completed' : 'pending' // 95% completion rate
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return contributions;
}

async function createContributionsTable(client) {
  const query = `
    CREATE TABLE IF NOT EXISTS contributions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID REFERENCES tontine_groups(id),
      user_id UUID REFERENCES users(id),
      cycle_number INTEGER DEFAULT 1,
      amount_sats INTEGER NOT NULL,
      payment_request TEXT,
      payment_hash TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      paid_at TIMESTAMP WITH TIME ZONE,
      metadata JSONB DEFAULT '{}'
    );
    
    CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
    CREATE INDEX IF NOT EXISTS idx_contributions_group_id ON contributions(group_id);
    CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
    CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
  `;
  
  await client.query(query);
}

async function insertContributions(client, contributions) {
  const query = `
    INSERT INTO contributions (id, user_id, amount_sats, status, created_at, paid_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
  `;
  
  for (const contribution of contributions) {
    const paidAt = contribution.status === 'completed' ? contribution.created_at : null;
    await client.query(query, [
      contribution.id,
      contribution.user_id,
      contribution.amount_sats,
      contribution.status,
      contribution.created_at,
      paidAt
    ]);
  }
}

async function generateActivityForGroups(client) {
  // Get all group memberships
  const membershipsQuery = `
    SELECT gm.group_id, gm.user_id, gm.role, tg.name as group_name, tg.contribution_amount_sats, tg.cycle_days
    FROM group_members gm
    JOIN tontine_groups tg ON gm.group_id = tg.id
    WHERE tg.status = 'active'
  `;
  
  const memberships = await client.query(membershipsQuery);
  
  const contributions = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // 90 days ago
  const endDate = new Date();
  
  for (const membership of memberships.rows) {
    const userId = membership.user_id;
    const pattern = activityPatterns[userId];
    
    if (!pattern || pattern.frequency === 'none') continue;
    
    // Generate contributions for this user
    const userContributions = generateContributionsForUser(userId, pattern, startDate, endDate);
    
    // Add group information to contributions
    for (const contribution of userContributions) {
      contribution.group_id = membership.group_id;
      contribution.cycle_number = Math.floor((endDate - contribution.created_at) / (membership.cycle_days * 24 * 60 * 60 * 1000)) + 1;
      contributions.push(contribution);
    }
  }
  
  return contributions;
}

(async () => {
  const client = await pool.connect();
  try {
    console.log('🎲 Generating mock activity for the last 90 days...');
    
    await client.query('BEGIN');
    
    // Create contributions table
    console.log('📊 Creating contributions table...');
    await createContributionsTable(client);
    
    // Generate activity
    console.log('🔄 Generating user activity patterns...');
    const contributions = await generateActivityForGroups(client);
    
    // Insert contributions
    console.log(`💾 Inserting ${contributions.length} contributions...`);
    await insertContributions(client, contributions);
    
    await client.query('COMMIT');
    
    // Display summary
    const totalContributions = await client.query('SELECT COUNT(*) FROM contributions');
    const completedContributions = await client.query("SELECT COUNT(*) FROM contributions WHERE status = 'completed'");
    const totalAmount = await client.query('SELECT SUM(amount_sats) FROM contributions WHERE status = \'completed\'');
    
    console.log('\n🎉 Mock activity generation completed!');
    console.log(`📊 Summary:`);
    console.log(`   💰 Total contributions: ${totalContributions.rows[0].count}`);
    console.log(`   ✅ Completed: ${completedContributions.rows[0].count}`);
    console.log(`   💵 Total amount: ${totalAmount.rows[0].sum || 0} sats`);
    
    // Show activity by user
    console.log('\n👥 Activity by user:');
    const userActivity = await client.query(`
      SELECT u.name, u.role, COUNT(c.id) as contributions, SUM(c.amount_sats) as total_amount
      FROM users u
      LEFT JOIN contributions c ON u.id = c.user_id AND c.status = 'completed'
      WHERE u.phone_number LIKE '+22177000000%'
      GROUP BY u.id, u.name, u.role
      ORDER BY total_amount DESC
    `);
    
    for (const user of userActivity.rows) {
      console.log(`   ${user.name} (${user.role}): ${user.contributions} contributions, ${user.total_amount || 0} sats`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Activity generation failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
