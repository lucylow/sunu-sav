// scripts/seed-demo-data.js
const knexConfig = require('../server/_core/knexfile');
const knex = require('knex')(knexConfig.development);
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Seeding demo data...');
  
  // create users
  const users = [
    { id: uuidv4(), phone_number: '+221770000001', language: 'fr', created_at: new Date() },
    { id: uuidv4(), phone_number: '+221770000002', language: 'wo', created_at: new Date() },
    { id: uuidv4(), phone_number: '+221770000003', language: 'fr', created_at: new Date() },
  ];
  await knex('users').insert(users);
  console.log('✅ Users created');

  // create groups
  const groups = [
    {
      id: uuidv4(),
      name: 'Market Women Savings',
      description: 'Weekly savings group for market vendors',
      contribution_amount_sats: 10000,
      cycle_days: 7,
      max_members: 5,
      current_cycle: 1,
      status: 'active',
      created_by: users[0].id,
      cycle_ends_at: new Date(Date.now() + 7*24*3600*1000),
      created_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Tech Community Fund',
      description: 'Monthly developer savings club',
      contribution_amount_sats: 50000,
      cycle_days: 30,
      max_members: 10,
      current_cycle: 1,
      status: 'active',
      created_by: users[2].id,
      cycle_ends_at: new Date(Date.now() + 30*24*3600*1000),
      created_at: new Date()
    }
  ];
  await knex('tontine_groups').insert(groups);
  console.log('✅ Groups created');

  // add members (first group: 3 members)
  const members = [
    { id: uuidv4(), group_id: groups[0].id, user_id: users[0].id, role: 'admin', joined_at: new Date(), is_active: true },
    { id: uuidv4(), group_id: groups[0].id, user_id: users[1].id, role: 'member', joined_at: new Date(), is_active: true },
    { id: uuidv4(), group_id: groups[0].id, user_id: users[2].id, role: 'member', joined_at: new Date(), is_active: true }
  ];
  await knex('group_members').insert(members);
  console.log('✅ Members added');

  // contributions placeholder (pending)
  const contributions = members.map(m => ({
    id: uuidv4(),
    group_id: groups[0].id,
    user_id: m.user_id,
    cycle_number: 1,
    amount_sats: groups[0].contribution_amount_sats,
    status: 'pending',
    created_at: new Date()
  }));
  await knex('contributions').insert(contributions);
  console.log('✅ Contributions seeded (pending)');
  
  console.log('🎉 Demo seed complete.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
