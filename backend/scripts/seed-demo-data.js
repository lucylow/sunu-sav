// scripts/seed-demo-data.js
const { getDb } = require('../database');

async function seedDemoData() {
  const db = getDb();
  
  console.log('🌱 Seeding demo data...');

  // Clear existing data
  await db('contributions').del();
  await db('group_members').del();
  await db('tontine_groups').del();
  await db('users').del();

  // Insert demo users
  const users = await db('users').insert([
    {
      id: '11111111-1111-1111-1111-111111111111',
      phone_number: '+221701234567',
      public_key: 'demo_pubkey_1',
      language: 'fr',
      created_at: new Date()
    },
    {
      id: '22222222-2222-2222-2222-222222222222', 
      phone_number: '+221701234568',
      public_key: 'demo_pubkey_2',
      language: 'fr',
      created_at: new Date()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      phone_number: '+221701234569', 
      public_key: 'demo_pubkey_3',
      language: 'fr',
      created_at: new Date()
    }
  ]).returning('*');

  // Insert demo tontine group
  const groups = await db('tontine_groups').insert([
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Tontine Familiale Demo',
      description: 'Groupe de démonstration pour le hackathon',
      contribution_amount_sats: 10000,
      cycle_days: 7,
      max_members: 3,
      current_cycle: 1,
      status: 'active',
      created_by: users[0].id,
      created_at: new Date()
    }
  ]).returning('*');

  // Add members to group
  await db('group_members').insert([
    {
      group_id: groups[0].id,
      user_id: users[0].id,
      role: 'admin',
      joined_at: new Date()
    },
    {
      group_id: groups[0].id,
      user_id: users[1].id, 
      role: 'member',
      joined_at: new Date()
    },
    {
      group_id: groups[0].id,
      user_id: users[2].id,
      role: 'member', 
      joined_at: new Date()
    }
  ]);

  console.log('✅ Demo data seeded successfully');
  return { users, groups };
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  const { initializeDb } = require('../database');
  
  initializeDb()
    .then(() => seedDemoData())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to seed demo data:', error);
      process.exit(1);
    });
}

module.exports = seedDemoData;
