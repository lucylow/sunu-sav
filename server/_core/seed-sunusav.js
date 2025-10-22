const { v4: uuidv4 } = require('uuid');
const dbManager = require('./database');

/**
 * Comprehensive seed script for SunuSàv Tontine Bitcoin Platform
 * Populates realistic mock data for testing monetization flows
 */

class SunuSavSeeder {
  constructor() {
    this.db = dbManager.getDb();
  }

  async seed() {
    console.log('🌱 Starting SunuSàv database seeding...');
    
    try {
      await this.seedUsers();
      await this.seedGroups();
      await this.seedGroupMembers();
      await this.seedTontineCycles();
      await this.seedContributions();
      await this.seedPayouts();
      await this.seedFeeRecords();
      await this.seedSubscriptions();
      await this.seedPartnerSettlements();
      await this.seedCommunityFund();
      await this.seedAuditLogs();
      
      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    
    const users = [
      {
        id: uuidv4(),
        phone_number: '+221712345678',
        name: 'Aissatou Diop',
        public_key: 'npub1alice123456789abcdefghijklmnopqrstuvwxyz',
        language: 'fr',
        is_active: true,
        created_at: new Date('2025-04-01T10:00:00Z'),
        updated_at: new Date('2025-04-01T10:00:00Z')
      },
      {
        id: uuidv4(),
        phone_number: '+221798765432',
        name: 'Mamadou Fall',
        public_key: 'npub1bob456789abcdefghijklmnopqrstuvwxyz123',
        language: 'fr',
        is_active: true,
        created_at: new Date('2025-04-10T14:30:00Z'),
        updated_at: new Date('2025-04-10T14:30:00Z')
      },
      {
        id: uuidv4(),
        phone_number: '+221766112233',
        name: 'Fatou Cissé',
        public_key: 'npub1fatou789abcdefghijklmnopqrstuvwxyz456',
        language: 'wo',
        is_active: true,
        created_at: new Date('2025-04-05T09:45:00Z'),
        updated_at: new Date('2025-04-05T09:45:00Z')
      },
      {
        id: uuidv4(),
        phone_number: '+221755443322',
        name: 'Ibrahima Ndiaye',
        public_key: 'npub1ibrahima123456789abcdefghijklmnopqrst',
        language: 'fr',
        is_active: true,
        created_at: new Date('2025-04-03T16:20:00Z'),
        updated_at: new Date('2025-04-03T16:20:00Z')
      },
      {
        id: uuidv4(),
        phone_number: '+221744556677',
        name: 'Aminata Ba',
        public_key: 'npub1aminata456789abcdefghijklmnopqrstuvwx',
        language: 'wo',
        is_active: true,
        created_at: new Date('2025-04-07T11:15:00Z'),
        updated_at: new Date('2025-04-07T11:15:00Z')
      }
    ];

    await this.db('users').insert(users);
    this.userIds = users.map(u => u.id);
    console.log(`✅ Seeded ${users.length} users`);
  }

  async seedGroups() {
    console.log('🏘️ Seeding tontine groups...');
    
    const groups = [
      {
        id: uuidv4(),
        name: 'Marché Liberté Women\'s Circle',
        description: 'Women\'s savings group at Liberté Market',
        contribution_amount_sats: 50000,
        cycle_days: 7,
        max_members: 5,
        current_cycle: 2,
        status: 'active',
        cycle_status: 'active',
        created_by: this.userIds[0],
        cycle_ends_at: new Date('2025-04-15T12:00:00Z'),
        created_at: new Date('2025-03-20T08:00:00Z'),
        updated_at: new Date('2025-04-08T12:00:00Z')
      },
      {
        id: uuidv4(),
        name: 'Garage & Vendors Co-op',
        description: 'Cooperative savings for garage workers and vendors',
        contribution_amount_sats: 100000,
        cycle_days: 7,
        max_members: 5,
        current_cycle: 1,
        status: 'active',
        cycle_status: 'active',
        created_by: this.userIds[1],
        cycle_ends_at: new Date('2025-04-09T09:00:00Z'),
        created_at: new Date('2025-03-25T11:15:00Z'),
        updated_at: new Date('2025-04-02T09:00:00Z')
      },
      {
        id: uuidv4(),
        name: 'Dakar University Students',
        description: 'Student savings group at Dakar University',
        contribution_amount_sats: 25000,
        cycle_days: 14,
        max_members: 8,
        current_cycle: 1,
        status: 'active',
        cycle_status: 'active',
        created_by: this.userIds[2],
        cycle_ends_at: new Date('2025-04-16T18:00:00Z'),
        created_at: new Date('2025-03-30T14:00:00Z'),
        updated_at: new Date('2025-04-02T18:00:00Z')
      }
    ];

    await this.db('tontine_groups').insert(groups);
    this.groupIds = groups.map(g => g.id);
    console.log(`✅ Seeded ${groups.length} tontine groups`);
  }

  async seedGroupMembers() {
    console.log('👥 Seeding group members...');
    
    const members = [
      // Group 1: Marché Liberté Women's Circle
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[0],
        role: 'admin',
        joined_at: new Date('2025-03-20T08:00:00Z'),
        is_active: true
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[2],
        role: 'member',
        joined_at: new Date('2025-03-21T10:00:00Z'),
        is_active: true
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[4],
        role: 'member',
        joined_at: new Date('2025-03-22T14:00:00Z'),
        is_active: true
      },
      // Group 2: Garage & Vendors Co-op
      {
        id: uuidv4(),
        group_id: this.groupIds[1],
        user_id: this.userIds[1],
        role: 'admin',
        joined_at: new Date('2025-03-25T11:15:00Z'),
        is_active: true
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[1],
        user_id: this.userIds[3],
        role: 'member',
        joined_at: new Date('2025-03-26T09:00:00Z'),
        is_active: true
      },
      // Group 3: Dakar University Students
      {
        id: uuidv4(),
        group_id: this.groupIds[2],
        user_id: this.userIds[2],
        role: 'admin',
        joined_at: new Date('2025-03-30T14:00:00Z'),
        is_active: true
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[2],
        user_id: this.userIds[0],
        role: 'member',
        joined_at: new Date('2025-03-31T16:00:00Z'),
        is_active: true
      }
    ];

    await this.db('group_members').insert(members);
    console.log(`✅ Seeded ${members.length} group members`);
  }

  async seedTontineCycles() {
    console.log('🔄 Seeding tontine cycles...');
    
    // We'll create cycles through the contributions and payouts
    // This is handled in the contributions seeding
    console.log('✅ Tontine cycles will be created through contributions');
  }

  async seedContributions() {
    console.log('💰 Seeding contributions...');
    
    const contributions = [
      // Group 1, Cycle 1 - All paid (completed cycle)
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[0],
        cycle_number: 1,
        amount_sats: 50000,
        payment_request: 'lnbc500u1p3alice123...',
        payment_hash: 'payment_hash_alice_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-02T10:00:00Z'),
        created_at: new Date('2025-04-02T09:50:00Z'),
        updated_at: new Date('2025-04-02T10:00:00Z')
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[2],
        cycle_number: 1,
        amount_sats: 50000,
        payment_request: 'lnbc500u1p3fatou123...',
        payment_hash: 'payment_hash_fatou_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-02T11:30:00Z'),
        created_at: new Date('2025-04-02T11:20:00Z'),
        updated_at: new Date('2025-04-02T11:30:00Z')
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[4],
        cycle_number: 1,
        amount_sats: 50000,
        payment_request: 'lnbc500u1p3aminata123...',
        payment_hash: 'payment_hash_aminata_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-02T12:10:00Z'),
        created_at: new Date('2025-04-02T12:05:00Z'),
        updated_at: new Date('2025-04-02T12:10:00Z')
      },
      // Group 1, Cycle 2 - Currently collecting
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[0],
        cycle_number: 2,
        amount_sats: 50000,
        payment_request: 'lnbc500u1p3alice_cycle2...',
        payment_hash: 'payment_hash_alice_cycle2',
        status: 'paid',
        paid_at: new Date('2025-04-09T10:00:00Z'),
        created_at: new Date('2025-04-09T09:50:00Z'),
        updated_at: new Date('2025-04-09T10:00:00Z')
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[2],
        cycle_number: 2,
        amount_sats: 50000,
        payment_request: 'lnbc500u1p3fatou_cycle2...',
        payment_hash: 'payment_hash_fatou_cycle2',
        status: 'pending',
        created_at: new Date('2025-04-09T11:00:00Z'),
        updated_at: new Date('2025-04-09T11:00:00Z')
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        user_id: this.userIds[4],
        cycle_number: 2,
        amount_sats: 50000,
        payment_request: 'lnbc500u1p3aminata_cycle2...',
        payment_hash: 'payment_hash_aminata_cycle2',
        status: 'pending',
        created_at: new Date('2025-04-09T12:00:00Z'),
        updated_at: new Date('2025-04-09T12:00:00Z')
      },
      // Group 2, Cycle 1 - All paid (completed cycle)
      {
        id: uuidv4(),
        group_id: this.groupIds[1],
        user_id: this.userIds[1],
        cycle_number: 1,
        amount_sats: 100000,
        payment_request: 'lnbc1000u1p3mamadou123...',
        payment_hash: 'payment_hash_mamadou_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-03T10:00:00Z'),
        created_at: new Date('2025-04-03T09:50:00Z'),
        updated_at: new Date('2025-04-03T10:00:00Z')
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[1],
        user_id: this.userIds[3],
        cycle_number: 1,
        amount_sats: 100000,
        payment_request: 'lnbc1000u1p3ibrahima123...',
        payment_hash: 'payment_hash_ibrahima_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-03T11:30:00Z'),
        created_at: new Date('2025-04-03T11:20:00Z'),
        updated_at: new Date('2025-04-03T11:30:00Z')
      }
    ];

    await this.db('contributions').insert(contributions);
    console.log(`✅ Seeded ${contributions.length} contributions`);
  }

  async seedPayouts() {
    console.log('🎁 Seeding payouts...');
    
    const payouts = [
      // Group 1, Cycle 1 - Completed payout
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        cycle_number: 1,
        winner_user_id: this.userIds[2], // Fatou won
        amount_sats: 150000, // 3 members × 50,000 sats
        payment_request: 'lnbc1500u1p3payout_fatou...',
        payment_hash: 'payout_hash_fatou_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-08T12:05:00Z'),
        created_at: new Date('2025-04-08T12:00:00Z')
      },
      // Group 2, Cycle 1 - Completed payout
      {
        id: uuidv4(),
        group_id: this.groupIds[1],
        cycle_number: 1,
        winner_user_id: this.userIds[1], // Mamadou won
        amount_sats: 200000, // 2 members × 100,000 sats
        payment_request: 'lnbc2000u1p3payout_mamadou...',
        payment_hash: 'payout_hash_mamadou_cycle1',
        status: 'paid',
        paid_at: new Date('2025-04-09T09:05:00Z'),
        created_at: new Date('2025-04-09T09:00:00Z')
      }
    ];

    await this.db('payouts').insert(payouts);
    console.log(`✅ Seeded ${payouts.length} payouts`);
  }

  async seedFeeRecords() {
    console.log('💸 Seeding fee records...');
    
    const feeRecords = [
      {
        id: uuidv4(),
        group_id: this.groupIds[0],
        cycle_number: 1,
        payout_id: (await this.db('payouts').where({ group_id: this.groupIds[0], cycle_number: 1 }).first()).id,
        total_amount_sats: 150000,
        platform_fee_sats: 1500, // 1% of 150,000
        partner_fee_sats: 450,    // 30% of platform fee
        community_fee_sats: 300,  // 20% of platform fee
        net_platform_fee_sats: 750, // 50% of platform fee
        fee_type: 'payout_cycle',
        created_at: new Date('2025-04-08T12:02:00Z')
      },
      {
        id: uuidv4(),
        group_id: this.groupIds[1],
        cycle_number: 1,
        payout_id: (await this.db('payouts').where({ group_id: this.groupIds[1], cycle_number: 1 }).first()).id,
        total_amount_sats: 200000,
        platform_fee_sats: 2000, // 1% of 200,000
        partner_fee_sats: 600,   // 30% of platform fee
        community_fee_sats: 400, // 20% of platform fee
        net_platform_fee_sats: 1000, // 50% of platform fee
        fee_type: 'payout_cycle',
        created_at: new Date('2025-04-09T09:05:00Z')
      }
    ];

    await this.db('fee_records').insert(feeRecords);
    console.log(`✅ Seeded ${feeRecords.length} fee records`);
  }

  async seedSubscriptions() {
    console.log('📱 Seeding subscriptions...');
    
    const subscriptions = [
      {
        id: uuidv4(),
        user_id: this.userIds[0], // Aissatou - Pro user
        tier: 'pro',
        recurring_amount_xof: 5000, // 5000 XOF per month
        recurring_amount_sats: 20000, // ~20,000 sats equivalent
        status: 'active',
        started_at: new Date('2025-04-05T08:00:00Z'),
        expires_at: new Date('2025-05-05T08:00:00Z'),
        created_at: new Date('2025-04-05T08:00:00Z'),
        updated_at: new Date('2025-04-05T08:00:00Z')
      },
      {
        id: uuidv4(),
        user_id: this.userIds[2], // Fatou - Standard user
        tier: 'standard',
        recurring_amount_xof: 0,
        recurring_amount_sats: 0,
        status: 'active',
        started_at: new Date('2025-04-10T15:30:00Z'),
        expires_at: null,
        created_at: new Date('2025-04-10T15:30:00Z'),
        updated_at: new Date('2025-04-10T15:30:00Z')
      }
    ];

    await this.db('subscriptions').insert(subscriptions);
    console.log(`✅ Seeded ${subscriptions.length} subscriptions`);
  }

  async seedPartnerSettlements() {
    console.log('🤝 Seeding partner settlements...');
    
    const settlements = [
      {
        id: uuidv4(),
        partner_name: 'wave',
        partner_type: 'mobile_money',
        xof_amount: 3000.00,
        sats_equivalent: 12000,
        exchange_rate: 0.25, // 1 XOF = 0.25 sats
        status: 'settled',
        settled_at: new Date('2025-04-15T10:00:00Z'),
        created_at: new Date('2025-04-08T12:30:00Z'),
        updated_at: new Date('2025-04-15T10:00:00Z')
      },
      {
        id: uuidv4(),
        partner_name: 'orange_money',
        partner_type: 'mobile_money',
        xof_amount: 6000.00,
        sats_equivalent: 24000,
        exchange_rate: 0.25,
        status: 'pending',
        settled_at: null,
        created_at: new Date('2025-04-09T09:30:00Z'),
        updated_at: new Date('2025-04-09T09:30:00Z')
      },
      {
        id: uuidv4(),
        partner_name: 'mtn_mobile_money',
        partner_type: 'mobile_money',
        xof_amount: 1500.00,
        sats_equivalent: 6000,
        exchange_rate: 0.25,
        status: 'settled',
        settled_at: new Date('2025-04-12T14:00:00Z'),
        created_at: new Date('2025-04-10T11:00:00Z'),
        updated_at: new Date('2025-04-12T14:00:00Z')
      }
    ];

    await this.db('partner_settlements').insert(settlements);
    console.log(`✅ Seeded ${settlements.length} partner settlements`);
  }

  async seedCommunityFund() {
    console.log('🏛️ Seeding community fund...');
    
    const communityFund = [
      {
        id: uuidv4(),
        year: 2025,
        month: 4,
        sats_contributed: 700, // Sum of community fees from fee records
        description: 'April 2025 community fund share from payout fees',
        source: 'payout_fees',
        created_at: new Date('2025-04-30T23:59:59Z'),
        updated_at: new Date('2025-04-30T23:59:59Z')
      },
      {
        id: uuidv4(),
        year: 2025,
        month: 3,
        sats_contributed: 1200,
        description: 'March 2025 community fund share from payout fees',
        source: 'payout_fees',
        created_at: new Date('2025-03-31T23:59:59Z'),
        updated_at: new Date('2025-03-31T23:59:59Z')
      }
    ];

    await this.db('community_fund').insert(communityFund);
    console.log(`✅ Seeded ${communityFund.length} community fund records`);
  }

  async seedAuditLogs() {
    console.log('📋 Seeding audit logs...');
    
    const auditLogs = [
      {
        id: uuidv4(),
        action: 'CREATE_GROUP',
        resource_type: 'TONTINE_GROUP',
        resource_id: this.groupIds[0],
        user_id: this.userIds[0],
        new_values: { name: 'Marché Liberté Women\'s Circle' },
        ip_address: '192.168.1.100',
        created_at: new Date('2025-03-20T08:00:00Z')
      },
      {
        id: uuidv4(),
        action: 'PAYMENT_RECEIVED',
        resource_type: 'CONTRIBUTION',
        resource_id: (await this.db('contributions').where({ payment_hash: 'payment_hash_alice_cycle1' }).first()).id,
        user_id: this.userIds[0],
        old_values: { status: 'pending' },
        new_values: { status: 'paid', amount_sats: 50000 },
        ip_address: '192.168.1.101',
        created_at: new Date('2025-04-02T10:00:00Z')
      },
      {
        id: uuidv4(),
        action: 'CYCLE_COMPLETED',
        resource_type: 'TONTINE_GROUP',
        resource_id: this.groupIds[0],
        user_id: this.userIds[0],
        new_values: { cycle_number: 1, winner: this.userIds[2] },
        ip_address: '192.168.1.102',
        created_at: new Date('2025-04-08T12:05:00Z')
      }
    ];

    await this.db('audit_logs').insert(auditLogs);
    console.log(`✅ Seeded ${auditLogs.length} audit log records`);
  }

  async clear() {
    console.log('🧹 Clearing existing data...');
    
    const tables = [
      'audit_logs',
      'sms_logs', 
      'community_fund',
      'partner_settlements',
      'subscriptions',
      'fee_records',
      'payouts',
      'contributions',
      'group_members',
      'tontine_groups',
      'users'
    ];

    for (const table of tables) {
      await this.db(table).del();
    }
    
    console.log('✅ Database cleared');
  }
}

// Export for use in other scripts
module.exports = SunuSavSeeder;

// Run seeding if this script is executed directly
if (require.main === module) {
  const seeder = new SunuSavSeeder();
  
  seeder.seed()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
