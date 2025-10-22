// backend/scripts/seed_mock_users.js
// Run: node backend/scripts/seed_mock_users.js
// Prerequisites: npm install pg

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tontine_user:tontine_password@localhost:5432/tontine'
});

const users = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Fatou Diop',
    phone_number: '+221770000001',
    preferred_language: 'wo',
    role: 'group_captain',
    device_type: 'android',
    preferred_channel: 'app',
    avg_contribution_sats: 10000,
    typical_payment_hour: '19:00',
    credit_score: 0.88,
    trust_score: 0.94,
    metadata: { 
      notes: 'Market vendor, organizes 10-person weekly tontine', 
      groups: ['g-market-01'],
      location: 'Dakar',
      occupation: 'market_vendor',
      family_size: 4
    }
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Mamadou Ndiaye',
    phone_number: '+221770000002',
    preferred_language: 'fr',
    role: 'member',
    device_type: 'feature_phone',
    preferred_channel: 'ussd',
    avg_contribution_sats: 8000,
    typical_payment_hour: '08:30',
    credit_score: 0.62,
    trust_score: 0.80,
    metadata: { 
      notes: 'Travelling trader, uses USSD via agent', 
      groups: ['g-neighborhood-01'],
      location: 'Thiès',
      occupation: 'trader',
      travel_frequency: 'high'
    }
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Aissatou Sarr',
    phone_number: '+221770000003',
    preferred_language: 'fr',
    role: 'diaspora',
    device_type: 'iphone',
    preferred_channel: 'app',
    avg_contribution_sats: 25000,
    typical_payment_hour: '21:00',
    credit_score: 0.97,
    trust_score: 0.99,
    metadata: { 
      notes: 'Diaspora in Paris, sends remittances weekly', 
      groups: ['g-family-01'],
      location: 'Paris',
      occupation: 'nurse',
      remittance_frequency: 'weekly'
    }
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Seynabou Ba',
    phone_number: '+221770000004',
    preferred_language: 'wo',
    role: 'organizer',
    device_type: 'android',
    preferred_channel: 'app',
    avg_contribution_sats: 12000,
    typical_payment_hour: '18:00',
    credit_score: 0.90,
    trust_score: 0.98,
    metadata: { 
      notes: 'Community captain, exports receipts frequently', 
      groups: ['g-market-01', 'g-women-02'],
      location: 'Dakar',
      occupation: 'community_leader',
      groups_managed: 2
    }
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Ousmane Diouf',
    phone_number: '+221770000005',
    preferred_language: 'fr',
    role: 'agent',
    device_type: 'android_tablet',
    preferred_channel: 'agent_portal',
    avg_contribution_sats: 0,
    typical_payment_hour: '09:00',
    credit_score: 0.75,
    trust_score: 0.80,
    metadata: { 
      notes: 'Agent for cash-in/out; offline queueing required', 
      groups: [],
      location: 'Dakar',
      occupation: 'agent',
      agent_type: 'cash_in_out',
      commission_rate: 0.02
    }
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Cheikh Kane',
    phone_number: '+221770000006',
    preferred_language: 'wo',
    role: 'member',
    device_type: 'feature_phone',
    preferred_channel: 'agent',
    avg_contribution_sats: 30000,
    typical_payment_hour: '07:00',
    credit_score: 0.58,
    trust_score: 0.70,
    metadata: { 
      notes: 'Smallholder; contributes seasonally', 
      groups: ['g-farmers-01'],
      location: 'Kaolack',
      occupation: 'farmer',
      crop_type: 'peanuts',
      seasonal_pattern: 'harvest'
    }
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Ndeye Fall',
    phone_number: '+221770000007',
    preferred_language: 'fr',
    role: 'member',
    device_type: 'android',
    preferred_channel: 'app',
    avg_contribution_sats: 2000,
    typical_payment_hour: '20:00',
    credit_score: 0.67,
    trust_score: 0.72,
    metadata: { 
      notes: 'Student; frequent small contributions', 
      groups: ['g-schoolmates-01'],
      location: 'Dakar',
      occupation: 'student',
      university: 'UCAD',
      payment_frequency: 'weekly'
    }
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    name: 'Baba Thiam',
    phone_number: '+221770000008',
    preferred_language: 'wo',
    role: 'member',
    device_type: 'shared_feature_phone',
    preferred_channel: 'agent',
    avg_contribution_sats: 15000,
    typical_payment_hour: '10:00',
    credit_score: 0.45,
    trust_score: 0.60,
    metadata: { 
      notes: 'Elderly, uses shared device and local agent', 
      groups: ['g-elders-01'],
      location: 'Saint-Louis',
      occupation: 'retired',
      age_group: 'elderly',
      tech_literacy: 'low'
    }
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    name: 'Amadou Ly',
    phone_number: '+221770000009',
    preferred_language: 'fr',
    role: 'developer_ambassador',
    device_type: 'android',
    preferred_channel: 'app',
    avg_contribution_sats: 15000,
    typical_payment_hour: '22:00',
    credit_score: 0.85,
    trust_score: 0.88,
    metadata: { 
      notes: 'Youth vendor and local developer testing features', 
      groups: ['g-devs-01'],
      location: 'Dakar',
      occupation: 'vendor',
      tech_savvy: true,
      beta_tester: true
    }
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Luc Low',
    phone_number: '+221770000010',
    preferred_language: 'fr',
    role: 'node_operator',
    device_type: 'laptop',
    preferred_channel: 'admin_ui',
    avg_contribution_sats: 0,
    typical_payment_hour: '12:00',
    credit_score: 0.99,
    trust_score: 0.99,
    metadata: { 
      notes: 'Developer and node operator', 
      groups: [],
      location: 'Dakar',
      occupation: 'developer',
      node_operator: true,
      admin_access: true
    }
  }
];

const groups = [
  {
    id: 'g-market-01',
    name: 'Marché Central Tontine',
    description: 'Weekly market vendor tontine for capital',
    contribution_amount_sats: 10000,
    cycle_days: 7,
    max_members: 10,
    current_cycle: 3,
    status: 'active',
    created_by: '11111111-1111-4111-8111-111111111111'
  },
  {
    id: 'g-neighborhood-01',
    name: 'Quartier Liberté 6',
    description: 'Neighborhood savings group',
    contribution_amount_sats: 8000,
    cycle_days: 7,
    max_members: 8,
    current_cycle: 2,
    status: 'active',
    created_by: '22222222-2222-4222-8222-222222222222'
  },
  {
    id: 'g-family-01',
    name: 'Famille Sarr',
    description: 'Family remittance group',
    contribution_amount_sats: 25000,
    cycle_days: 7,
    max_members: 5,
    current_cycle: 1,
    status: 'active',
    created_by: '33333333-3333-4333-8333-333333333333'
  },
  {
    id: 'g-women-02',
    name: 'Femmes Entrepreneures',
    description: 'Women entrepreneurs group',
    contribution_amount_sats: 12000,
    cycle_days: 14,
    max_members: 6,
    current_cycle: 1,
    status: 'active',
    created_by: '44444444-4444-4444-8444-444444444444'
  },
  {
    id: 'g-farmers-01',
    name: 'Agriculteurs Kaolack',
    description: 'Seasonal farmers group',
    contribution_amount_sats: 30000,
    cycle_days: 30,
    max_members: 12,
    current_cycle: 1,
    status: 'active',
    created_by: '66666666-6666-4666-8666-666666666666'
  },
  {
    id: 'g-schoolmates-01',
    name: 'Anciens UCAD',
    description: 'University friends group',
    contribution_amount_sats: 2000,
    cycle_days: 7,
    max_members: 15,
    current_cycle: 4,
    status: 'active',
    created_by: '77777777-7777-4777-8777-777777777777'
  },
  {
    id: 'g-elders-01',
    name: 'Anciens Saint-Louis',
    description: 'Elderly community group',
    contribution_amount_sats: 15000,
    cycle_days: 14,
    max_members: 8,
    current_cycle: 2,
    status: 'active',
    created_by: '88888888-8888-4888-8888-888888888888'
  },
  {
    id: 'g-devs-01',
    name: 'Tech Senegal',
    description: 'Developer community group',
    contribution_amount_sats: 15000,
    cycle_days: 7,
    max_members: 20,
    current_cycle: 1,
    status: 'active',
    created_by: '99999999-9999-4999-8999-999999999999'
  }
];

const groupMemberships = [
  // Market group members
  { group_id: 'g-market-01', user_id: '11111111-1111-4111-8111-111111111111', role: 'admin' },
  { group_id: 'g-market-01', user_id: '44444444-4444-4444-8444-444444444444', role: 'member' },
  // Neighborhood group members
  { group_id: 'g-neighborhood-01', user_id: '22222222-2222-4222-8222-222222222222', role: 'member' },
  // Family group members
  { group_id: 'g-family-01', user_id: '33333333-3333-4333-8333-333333333333', role: 'member' },
  // Women group members
  { group_id: 'g-women-02', user_id: '44444444-4444-4444-8444-444444444444', role: 'admin' },
  // Farmers group members
  { group_id: 'g-farmers-01', user_id: '66666666-6666-4666-8666-666666666666', role: 'member' },
  // Schoolmates group members
  { group_id: 'g-schoolmates-01', user_id: '77777777-7777-4777-8777-777777777777', role: 'member' },
  // Elders group members
  { group_id: 'g-elders-01', user_id: '88888888-8888-4888-8888-888888888888', role: 'member' },
  // Developers group members
  { group_id: 'g-devs-01', user_id: '99999999-9999-4999-8999-999999999999', role: 'member' }
];

async function upsertUser(client, user) {
  const query = `
    INSERT INTO users (id, name, phone_number, preferred_language, role, device_type, preferred_channel, avg_contribution_sats, typical_payment_hour, credit_score, trust_score, metadata, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    ON CONFLICT (phone_number) DO UPDATE SET
      name = EXCLUDED.name,
      preferred_language = EXCLUDED.preferred_language,
      role = EXCLUDED.role,
      device_type = EXCLUDED.device_type,
      preferred_channel = EXCLUDED.preferred_channel,
      avg_contribution_sats = EXCLUDED.avg_contribution_sats,
      typical_payment_hour = EXCLUDED.typical_payment_hour,
      credit_score = EXCLUDED.credit_score,
      trust_score = EXCLUDED.trust_score,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id;
  `;
  const values = [
    user.id, user.name, user.phone_number, user.preferred_language, user.role, user.device_type, user.preferred_channel,
    user.avg_contribution_sats, user.typical_payment_hour, user.credit_score, user.trust_score, JSON.stringify(user.metadata || {})
  ];
  const result = await client.query(query, values);
  return result.rows[0];
}

async function upsertGroup(client, group) {
  const query = `
    INSERT INTO tontine_groups (id, name, description, contribution_amount_sats, cycle_days, max_members, current_cycle, status, created_by, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      contribution_amount_sats = EXCLUDED.contribution_amount_sats,
      cycle_days = EXCLUDED.cycle_days,
      max_members = EXCLUDED.max_members,
      current_cycle = EXCLUDED.current_cycle,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING id;
  `;
  const values = [
    group.id, group.name, group.description, group.contribution_amount_sats, group.cycle_days, 
    group.max_members, group.current_cycle, group.status, group.created_by
  ];
  const result = await client.query(query, values);
  return result.rows[0];
}

async function upsertGroupMembership(client, membership) {
  const query = `
    INSERT INTO group_members (group_id, user_id, role, joined_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (group_id, user_id) DO UPDATE SET
      role = EXCLUDED.role
    RETURNING id;
  `;
  const values = [membership.group_id, membership.user_id, membership.role];
  const result = await client.query(query, values);
  return result.rows[0];
}

(async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting mock data seeding...');
    
    await client.query('BEGIN');
    
    // Seed users
    console.log('👥 Seeding users...');
    for (const user of users) {
      const result = await upsertUser(client, user);
      console.log(`✅ Upserted user: ${user.name} (${result.id})`);
    }
    
    // Seed groups
    console.log('🏘️ Seeding groups...');
    for (const group of groups) {
      const result = await upsertGroup(client, group);
      console.log(`✅ Upserted group: ${group.name} (${result.id})`);
    }
    
    // Seed group memberships
    console.log('🤝 Seeding group memberships...');
    for (const membership of groupMemberships) {
      const result = await upsertGroupMembership(client, membership);
      console.log(`✅ Upserted membership: ${membership.user_id} -> ${membership.group_id}`);
    }
    
    await client.query('COMMIT');
    
    // Display summary
    const userCount = await client.query('SELECT COUNT(*) FROM users WHERE phone_number LIKE $1', ['+22177000000%']);
    const groupCount = await client.query('SELECT COUNT(*) FROM tontine_groups WHERE id LIKE $1', ['g-%']);
    const membershipCount = await client.query('SELECT COUNT(*) FROM group_members');
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users: ${userCount.rows[0].count}`);
    console.log(`   🏘️ Groups: ${groupCount.rows[0].count}`);
    console.log(`   🤝 Memberships: ${membershipCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
