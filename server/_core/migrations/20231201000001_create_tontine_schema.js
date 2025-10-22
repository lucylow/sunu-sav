-- Enhanced Database Schema for Tontine Bitcoin Platform
-- Migration: Create comprehensive tontine system

exports.up = async function(knex) {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('phone_number', 20).notNullable().unique();
    table.text('public_key');
    table.string('language', 10).defaultTo('fr');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    
    // Indexes
    table.index('phone_number');
    table.index('created_at');
  });

  // Tontine groups table
  await knex.schema.createTable('tontine_groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.text('description');
    table.integer('contribution_amount_sats').notNullable();
    table.integer('cycle_days').notNullable();
    table.integer('max_members').notNullable();
    table.integer('current_cycle').defaultTo(1);
    table.enum('status', ['active', 'completed', 'cancelled', 'paused']).defaultTo('active');
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('cycle_ends_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Constraints
    table.check('contribution_amount_sats > 0', ['contribution_amount_check']);
    table.check('max_members BETWEEN 2 AND 20', ['max_members_check']);
    
    // Indexes
    table.index('status');
    table.index('created_by');
    table.index('cycle_ends_at');
  });

  // Group members table
  await knex.schema.createTable('group_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('group_id').references('id').inTable('tontine_groups').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['admin', 'member']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    
    // Unique constraint
    table.unique(['group_id', 'user_id']);
    
    // Indexes
    table.index('group_id');
    table.index('user_id');
  });

  // Contributions table
  await knex.schema.createTable('contributions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('group_id').references('id').inTable('tontine_groups').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('cycle_number').notNullable();
    table.integer('amount_sats').notNullable();
    table.text('payment_request');
    table.string('payment_hash').unique();
    table.enum('status', ['pending', 'paid', 'confirmed', 'failed', 'expired']).defaultTo('pending');
    table.timestamp('paid_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Constraints
    table.check('amount_sats > 0', ['amount_check']);
    
    // Indexes
    table.index('group_id');
    table.index('user_id');
    table.index('payment_hash');
    table.index(['group_id', 'cycle_number']);
    table.index('status');
    table.index('created_at');
  });

  // Payouts table
  await knex.schema.createTable('payouts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('group_id').references('id').inTable('tontine_groups').onDelete('CASCADE');
    table.integer('cycle_number').notNullable();
    table.uuid('winner_user_id').references('id').inTable('users');
    table.integer('amount_sats').notNullable();
    table.text('payment_request');
    table.string('payment_hash').unique();
    table.enum('status', ['pending', 'paid', 'confirmed', 'failed']).defaultTo('pending');
    table.timestamp('paid_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('group_id');
    table.index('winner_user_id');
    table.index(['group_id', 'cycle_number']);
  });

  // Audit log table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('action', 50).notNullable();
    table.string('resource_type', 50).notNullable();
    table.uuid('resource_id');
    table.uuid('user_id').references('id').inTable('users');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.jsonb('metadata');
    table.string('ip_address', 45);
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('action');
    table.index('resource_type');
    table.index('resource_id');
    table.index('user_id');
    table.index('created_at');
  });

  // SMS logs table
  await knex.schema.createTable('sms_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('phone_number', 20).notNullable();
    table.text('message').notNullable();
    table.string('message_id').unique();
    table.enum('status', ['sent', 'delivered', 'failed']).defaultTo('sent');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('phone_number');
    table.index('message_id');
    table.index('status');
    table.index('created_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sms_logs');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('payouts');
  await knex.schema.dropTableIfExists('contributions');
  await knex.schema.dropTableIfExists('group_members');
  await knex.schema.dropTableIfExists('tontine_groups');
  await knex.schema.dropTableIfExists('users');
};
