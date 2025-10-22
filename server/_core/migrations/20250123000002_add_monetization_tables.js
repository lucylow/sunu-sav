-- Additional tables for SunuSàv monetization features
-- Migration: Add fee records, subscriptions, partner settlements, and community fund

exports.up = async function(knex) {
  // Fee records table for tracking platform fees
  await knex.schema.createTable('fee_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('group_id').references('id').inTable('tontine_groups').onDelete('CASCADE');
    table.integer('cycle_number').notNullable();
    table.uuid('payout_id').references('id').inTable('payouts');
    table.integer('total_amount_sats').notNullable();
    table.integer('platform_fee_sats').notNullable();
    table.integer('partner_fee_sats').defaultTo(0);
    table.integer('community_fee_sats').defaultTo(0);
    table.integer('net_platform_fee_sats').notNullable();
    table.string('fee_type', 50).notNullable(); // payout_cycle, subscription, etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('group_id');
    table.index('payout_id');
    table.index('fee_type');
    table.index('created_at');
  });

  // Subscriptions table for user subscription tiers
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('tier', 20).notNullable(); // free, standard, pro, premium
    table.integer('recurring_amount_xof').defaultTo(0);
    table.integer('recurring_amount_sats').defaultTo(0);
    table.string('status', 20).defaultTo('active'); // active, cancelled, expired
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint - one active subscription per user
    table.unique(['user_id', 'status'], 'unique_active_subscription');
    
    // Indexes
    table.index('user_id');
    table.index('tier');
    table.index('status');
    table.index('expires_at');
  });

  // Partner settlements table for mobile money integrations
  await knex.schema.createTable('partner_settlements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('partner_name', 50).notNullable(); // wave, orange_money, mtn_mobile_money
    table.string('partner_type', 30).notNullable(); // mobile_money, bank, crypto_exchange
    table.decimal('xof_amount', 15, 2).notNullable();
    table.integer('sats_equivalent').notNullable();
    table.decimal('exchange_rate', 10, 6).notNullable();
    table.string('status', 20).defaultTo('pending'); // pending, settled, failed
    table.timestamp('settled_at');
    table.text('settlement_reference'); // external reference ID
    table.jsonb('metadata'); // additional partner-specific data
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('partner_name');
    table.index('status');
    table.index('settled_at');
    table.index('created_at');
  });

  // Community fund table for tracking community contributions
  await knex.schema.createTable('community_fund', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('year').notNullable();
    table.integer('month').notNullable();
    table.integer('sats_contributed').notNullable();
    table.text('description');
    table.string('source', 50).notNullable(); // payout_fees, donations, etc.
    table.jsonb('metadata'); // additional fund data
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint - one record per month/year/source
    table.unique(['year', 'month', 'source'], 'unique_monthly_contribution');
    
    // Indexes
    table.index(['year', 'month']);
    table.index('source');
    table.index('created_at');
  });

  // Payment attempts table (already created in previous migration)
  // This is just a placeholder to ensure the table exists
  await knex.schema.hasTable('payment_attempts').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('payment_attempts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('idempotency_key').unique();
        table.uuid('group_id').references('id').inTable('tontine_groups').onDelete('CASCADE');
        table.integer('cycle_number').notNullable();
        table.text('invoice');
        table.string('status', 20).defaultTo('pending');
        table.text('preimage');
        table.integer('fee_sat');
        table.integer('lnd_attempts').defaultTo(0);
        table.text('error_message');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        // Indexes
        table.index('idempotency_key');
        table.index(['group_id', 'cycle_number']);
        table.index('status');
      });
    }
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('community_fund');
  await knex.schema.dropTableIfExists('partner_settlements');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('fee_records');
  await knex.schema.dropTableIfExists('payment_attempts');
};
