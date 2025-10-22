const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const dbManager = require('./database');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class TontineService extends EventEmitter {
  constructor() {
    super();
    this.db = dbManager.getDb();
    this.auditService = new AuditService();
    this.notificationService = new NotificationService();
  }

  async createGroup(groupData, creatorId, ipAddress = '') {
    const trx = await this.db.transaction();
    
    try {
      // Validate creator exists and is active
      const creator = await trx('users')
        .where({ id: creatorId, is_active: true })
        .first();
      
      if (!creator) {
        throw new Error('Creator user not found or inactive');
      }

      // Calculate cycle end date
      const cycleEndsAt = new Date();
      cycleEndsAt.setDate(cycleEndsAt.getDate() + groupData.cycleDays);

      // Create group
      const [group] = await trx('tontine_groups')
        .insert({
          ...groupData,
          created_by: creatorId,
          cycle_ends_at: cycleEndsAt,
          status: 'active'
        })
        .returning('*');

      // Add creator as admin member
      await trx('group_members').insert({
        group_id: group.id,
        user_id: creatorId,
        role: 'admin'
      });

      // Audit log
      await this.auditService.log({
        action: 'CREATE_GROUP',
        resourceType: 'TONTINE_GROUP',
        resourceId: group.id,
        userId: creatorId,
        newValues: group,
        ipAddress,
        metadata: { cycle_days: groupData.cycleDays }
      }, trx);

      await trx.commit();

      // Emit event for potential external integrations
      this.emit('group_created', { group, creatorId });

      return group;

    } catch (error) {
      await trx.rollback();
      
      await this.auditService.log({
        action: 'CREATE_GROUP_FAILED',
        resourceType: 'TONTINE_GROUP',
        userId: creatorId,
        metadata: { error: error.message, groupData },
        ipAddress
      });

      throw error;
    }
  }

  async addMember(groupId, userId, inviterId, ipAddress = '') {
    const trx = await this.db.transaction();
    
    try {
      // Validate group exists and is active
      const group = await trx('tontine_groups')
        .where({ id: groupId, status: 'active' })
        .first();
      
      if (!group) {
        throw new Error('Group not found or inactive');
      }

      // Validate user exists and is active
      const user = await trx('users')
        .where({ id: userId, is_active: true })
        .first();
      
      if (!user) {
        throw new Error('User not found or inactive');
      }

      // Check if user is already a member
      const existingMember = await trx('group_members')
        .where({ group_id: groupId, user_id: userId })
        .first();
      
      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      // Check group capacity
      const memberCount = await trx('group_members')
        .where({ group_id: groupId, is_active: true })
        .count('id as count')
        .first();
      
      if (memberCount.count >= group.max_members) {
        throw new Error('Group has reached maximum member capacity');
      }

      // Add member
      const [member] = await trx('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member'
        })
        .returning('*');

      // Audit log
      await this.auditService.log({
        action: 'ADD_MEMBER',
        resourceType: 'GROUP_MEMBER',
        resourceId: member.id,
        userId: inviterId,
        newValues: member,
        ipAddress,
        metadata: { group_id: groupId, added_user_id: userId }
      }, trx);

      await trx.commit();

      // Send notifications
      await this.notificationService.sendMemberJoinedNotification(groupId, userId, inviterId);

      this.emit('member_added', { groupId, userId, inviterId });

      return member;

    } catch (error) {
      await trx.rollback();
      
      await this.auditService.log({
        action: 'ADD_MEMBER_FAILED',
        resourceType: 'GROUP_MEMBER',
        userId: inviterId,
        metadata: { error: error.message, group_id: groupId, user_id: userId },
        ipAddress
      });

      throw error;
    }
  }

  async createContributionInvoice(groupId, userId, ipAddress = '') {
    const trx = await this.db.transaction();
    
    try {
      // Validate membership
      const membership = await trx('group_members')
        .where({
          group_id: groupId,
          user_id: userId,
          is_active: true
        })
        .first();
      
      if (!membership) {
        throw new Error('User is not an active member of this group');
      }

      // Get group details
      const group = await trx('tontine_groups')
        .where({ id: groupId, status: 'active' })
        .first();
      
      if (!group) {
        throw new Error('Group not found or inactive');
      }

      // Check for existing pending contribution in current cycle
      const existingContribution = await trx('contributions')
        .where({
          group_id: groupId,
          user_id: userId,
          cycle_number: group.current_cycle,
          status: 'pending'
        })
        .first();
      
      if (existingContribution) {
        await trx.commit();
        return {
          payment_request: existingContribution.payment_request,
          payment_hash: existingContribution.payment_hash,
          amount_sats: existingContribution.amount_sats,
          expires_at: new Date(Date.now() + 3600 * 1000) // 1 hour
        };
      }

      // Create Lightning invoice (mock for now)
      const lightningService = require('./LightningService');
      const invoice = await lightningService.createInvoice(
        group.contribution_amount_sats,
        `Tontine ${group.name} - Cycle ${group.current_cycle}`
      );

      // Create contribution record
      const [contribution] = await trx('contributions')
        .insert({
          group_id: groupId,
          user_id: userId,
          cycle_number: group.current_cycle,
          amount_sats: group.contribution_amount_sats,
          payment_request: invoice.payment_request,
          payment_hash: invoice.payment_hash,
          status: 'pending'
        })
        .returning('*');

      // Audit log
      await this.auditService.log({
        action: 'CREATE_INVOICE',
        resourceType: 'CONTRIBUTION',
        resourceId: contribution.id,
        userId: userId,
        newValues: {
          amount_sats: contribution.amount_sats,
          payment_hash: contribution.payment_hash
        },
        ipAddress,
        metadata: { group_id: groupId, cycle_number: group.current_cycle }
      }, trx);

      await trx.commit();

      this.emit('invoice_created', { contribution, userId });

      return {
        payment_request: invoice.payment_request,
        payment_hash: invoice.payment_hash,
        amount_sats: contribution.amount_sats,
        expires_at: new Date(Date.now() + 3600 * 1000)
      };

    } catch (error) {
      await trx.rollback();
      
      await this.auditService.log({
        action: 'CREATE_INVOICE_FAILED',
        resourceType: 'CONTRIBUTION',
        userId: userId,
        metadata: { error: error.message, group_id: groupId },
        ipAddress
      });

      throw error;
    }
  }

  async processPayment(paymentHash, ipAddress = '') {
    const trx = await this.db.transaction();
    
    try {
      // Find contribution
      const contribution = await trx('contributions')
        .where({ payment_hash: paymentHash })
        .first();
      
      if (!contribution) {
        throw new Error('Contribution not found');
      }

      if (contribution.status === 'paid') {
        await trx.commit();
        return contribution; // Already paid
      }

      // Verify payment with Lightning service
      const lightningService = require('./LightningService');
      const paymentStatus = await lightningService.checkInvoiceStatus(paymentHash);
      
      if (!paymentStatus.settled) {
        throw new Error('Payment not settled');
      }

      // Update contribution status
      const [updatedContribution] = await trx('contributions')
        .where({ id: contribution.id })
        .update({
          status: 'paid',
          paid_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Get group info
      const group = await trx('tontine_groups')
        .where({ id: contribution.group_id })
        .first();

      // Check if cycle should complete
      await this._checkCycleCompletion(group.id, trx);

      // Audit log
      await this.auditService.log({
        action: 'PAYMENT_RECEIVED',
        resourceType: 'CONTRIBUTION',
        resourceId: contribution.id,
        userId: contribution.user_id,
        oldValues: { status: contribution.status },
        newValues: { status: 'paid', paid_at: updatedContribution.paid_at },
        ipAddress,
        metadata: { amount_sats: contribution.amount_sats }
      }, trx);

      await trx.commit();

      // Send notifications
      await this.notificationService.sendPaymentReceivedNotification(
        contribution.group_id,
        contribution.user_id,
        contribution.amount_sats
      );

      this.emit('payment_received', { contribution: updatedContribution });

      return updatedContribution;

    } catch (error) {
      await trx.rollback();
      
      await this.auditService.log({
        action: 'PAYMENT_PROCESSING_FAILED',
        resourceType: 'CONTRIBUTION',
        metadata: { error: error.message, payment_hash: paymentHash },
        ipAddress
      });

      throw error;
    }
  }

  async _checkCycleCompletion(groupId, trx) {
    const group = await trx('tontine_groups')
      .where({ id: groupId })
      .first();

    if (!group) return;

    // Count paid contributions for current cycle
    const paidContributions = await trx('contributions')
      .where({
        group_id: groupId,
        cycle_number: group.current_cycle,
        status: 'paid'
      })
      .count('id as count')
      .first();

    const activeMembers = await trx('group_members')
      .where({ group_id: groupId, is_active: true })
      .count('id as count')
      .first();

    // Complete cycle if all active members have paid
    if (parseInt(paidContributions.count) === parseInt(activeMembers.count)) {
      await this._completeCycle(groupId, trx);
    }
  }

  async _completeCycle(groupId, trx) {
    const group = await trx('tontine_groups')
      .where({ id: groupId })
      .first();

    // Calculate total amount for payout
    const totalResult = await trx('contributions')
      .where({
        group_id: groupId,
        cycle_number: group.current_cycle,
        status: 'paid'
      })
      .sum('amount_sats as total')
      .first();

    const totalAmount = parseInt(totalResult.total) || 0;

    // Select random winner from paid contributors
    const winnerContribution = await trx('contributions')
      .where({
        group_id: groupId,
        cycle_number: group.current_cycle,
        status: 'paid'
      })
      .orderByRaw('RANDOM()')
      .first();

    if (!winnerContribution) {
      throw new Error('No paid contributions found for cycle completion');
    }

    // Create payout record
    const [payout] = await trx('payouts')
      .insert({
        group_id: groupId,
        cycle_number: group.current_cycle,
        winner_user_id: winnerContribution.user_id,
        amount_sats: totalAmount,
        status: 'pending'
      })
      .returning('*');

    // Update group for next cycle
    const nextCycleEnds = new Date();
    nextCycleEnds.setDate(nextCycleEnds.getDate() + group.cycle_days);

    await trx('tontine_groups')
      .where({ id: groupId })
      .update({
        current_cycle: group.current_cycle + 1,
        cycle_ends_at: nextCycleEnds,
        updated_at: new Date()
      });

    // Process payout
    await this._processPayout(payout, trx);

    this.emit('cycle_completed', { groupId, cycle: group.current_cycle, winner: winnerContribution.user_id, amount: totalAmount });
  }

  async _processPayout(payout, trx) {
    try {
      // In a real implementation, this would create a Lightning invoice from the winner
      // and pay it. For now, we'll simulate the payment.
      
      const lightningService = require('./LightningService');
      
      // Get winner's Lightning address (in real app, this would be stored in user profile)
      const winner = await trx('users')
        .where({ id: payout.winner_user_id })
        .first();

      // Simulate payment
      const paymentResult = await lightningService.payInvoice(
        `mock_invoice_from_${winner.phone_number}`,
        payout.amount_sats
      );

      // Update payout status
      await trx('payouts')
        .where({ id: payout.id })
        .update({
          status: 'paid',
          paid_at: new Date(),
          payment_hash: paymentResult.payment_hash
        });

      // Send notification to winner
      await this.notificationService.sendPayoutNotification(
        payout.group_id,
        payout.winner_user_id,
        payout.amount_sats,
        payout.cycle_number
      );

    } catch (error) {
      console.error('Payout processing failed:', error);
      // In production, you might want to retry or alert administrators
    }
  }

  async getGroupStatus(groupId, userId) {
    const db = this.db;
    
    // Verify user is member of group
    const membership = await db('group_members')
      .where({ group_id: groupId, user_id: userId, is_active: true })
      .first();
    
    if (!membership) {
      throw new Error('Access denied: Not a member of this group');
    }

    const group = await db('tontine_groups')
      .where({ id: groupId })
      .first();

    const members = await db('group_members')
      .join('users', 'group_members.user_id', 'users.id')
      .where({ 'group_members.group_id': groupId, 'group_members.is_active': true })
      .select(
        'users.id',
        'users.phone_number',
        'group_members.role',
        'group_members.joined_at'
      );

    const contributions = await db('contributions')
      .where({ group_id: groupId, cycle_number: group.current_cycle })
      .select('user_id', 'status', 'amount_sats', 'paid_at');

    const totalContributions = await db('contributions')
      .where({ group_id: groupId, status: 'paid' })
      .sum('amount_sats as total')
      .first();

    const paidMembers = contributions.filter(c => c.status === 'paid').length;
    const totalAmount = parseInt(totalContributions.total) || 0;

    return {
      group: {
        id: group.id,
        name: group.name,
        current_cycle: group.current_cycle,
        cycle_ends_at: group.cycle_ends_at,
        status: group.status
      },
      members: {
        total: members.length,
        paid: paidMembers,
        list: members.map(m => ({
          id: m.id,
          phone_number: m.phone_number, // In production, mask this
          role: m.role,
          has_paid: contributions.some(c => c.user_id === m.id && c.status === 'paid'),
          joined_at: m.joined_at
        }))
      },
      finances: {
        contribution_amount: group.contribution_amount_sats,
        total_collected: totalAmount,
        current_cycle_collected: contributions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + c.amount_sats, 0)
      },
      next_payout: {
        estimated_amount: group.contribution_amount_sats * members.length,
        eligible_members: members.length
      }
    };
  }
}

module.exports = TontineService;
