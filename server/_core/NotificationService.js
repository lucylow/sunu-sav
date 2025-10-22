const dbManager = require('./database');
const i18n = require('./i18n');

class NotificationService {
  constructor() {
    this.db = dbManager.getDb();
  }

  async sendMemberJoinedNotification(groupId, newMemberId, inviterId) {
    try {
      // Get group details
      const group = await this.db('tontine_groups')
        .where({ id: groupId })
        .first();

      if (!group) return;

      // Get all group members except the new member
      const members = await this.db('group_members')
        .join('users', 'group_members.user_id', 'users.id')
        .where({ 
          'group_members.group_id': groupId, 
          'group_members.is_active': true,
          'group_members.user_id': '!=', newMemberId
        })
        .select('users.id', 'users.phone_number', 'users.language');

      // Send SMS to each member
      for (const member of members) {
        await this.sendSMS(
          member.phone_number,
          i18n.t('sms.member_joined', { 
            groupName: group.name,
            memberCount: members.length + 1
          }, member.language || 'fr')
        );
      }

      console.log(`📱 Sent member joined notifications for group ${groupId}`);
    } catch (error) {
      console.error('Failed to send member joined notifications:', error);
    }
  }

  async sendPaymentReceivedNotification(groupId, userId, amount) {
    try {
      // Get user details
      const user = await this.db('users')
        .where({ id: userId })
        .first();

      if (!user) return;

      // Send SMS to user
      await this.sendSMS(
        user.phone_number,
        i18n.t('sms.payment_received', { 
          amount: this.formatSats(amount)
        }, user.language || 'fr')
      );

      console.log(`📱 Sent payment received notification to user ${userId}`);
    } catch (error) {
      console.error('Failed to send payment received notification:', error);
    }
  }

  async sendPayoutNotification(groupId, winnerId, amount, cycleNumber) {
    try {
      // Get winner details
      const winner = await this.db('users')
        .where({ id: winnerId })
        .first();

      if (!winner) return;

      // Get group details
      const group = await this.db('tontine_groups')
        .where({ id: groupId })
        .first();

      // Send SMS to winner
      await this.sendSMS(
        winner.phone_number,
        i18n.t('sms.payout_won', { 
          amount: this.formatSats(amount),
          groupName: group.name,
          cycle: cycleNumber
        }, winner.language || 'fr')
      );

      // Notify other group members
      const otherMembers = await this.db('group_members')
        .join('users', 'group_members.user_id', 'users.id')
        .where({ 
          'group_members.group_id': groupId, 
          'group_members.is_active': true,
          'group_members.user_id': '!=', winnerId
        })
        .select('users.id', 'users.phone_number', 'users.language');

      for (const member of otherMembers) {
        await this.sendSMS(
          member.phone_number,
          i18n.t('sms.cycle_completed', { 
            groupName: group.name,
            cycle: cycleNumber,
            winnerAmount: this.formatSats(amount)
          }, member.language || 'fr')
        );
      }

      console.log(`📱 Sent payout notifications for group ${groupId}, cycle ${cycleNumber}`);
    } catch (error) {
      console.error('Failed to send payout notifications:', error);
    }
  }

  async sendContributionReminder(groupId, userId) {
    try {
      // Get user and group details
      const [user, group] = await Promise.all([
        this.db('users').where({ id: userId }).first(),
        this.db('tontine_groups').where({ id: groupId }).first()
      ]);

      if (!user || !group) return;

      // Check if user has already paid for current cycle
      const existingContribution = await this.db('contributions')
        .where({
          group_id: groupId,
          user_id: userId,
          cycle_number: group.current_cycle,
          status: 'paid'
        })
        .first();

      if (existingContribution) return; // Already paid

      // Send reminder SMS
      await this.sendSMS(
        user.phone_number,
        i18n.t('sms.contribution_reminder', { 
          groupName: group.name,
          amount: this.formatSats(group.contribution_amount_sats),
          cycle: group.current_cycle
        }, user.language || 'fr')
      );

      console.log(`📱 Sent contribution reminder to user ${userId}`);
    } catch (error) {
      console.error('Failed to send contribution reminder:', error);
    }
  }

  async sendSMS(phoneNumber, message, language = 'fr') {
    try {
      // In a real implementation, this would integrate with SMS providers like:
      // - Twilio
      // - AWS SNS
      // - Local SMS gateways
      // - USSD providers

      console.log(`📱 SMS to ${phoneNumber} (${language}): ${message}`);
      
      // Mock SMS sending - replace with actual SMS service
      const smsResult = {
        messageId: require('crypto').randomUUID(),
        status: 'sent',
        timestamp: new Date()
      };

      // Log SMS for audit purposes
      await this.logSMS(phoneNumber, message, smsResult);

      return smsResult;
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  async logSMS(phoneNumber, message, result) {
    try {
      await this.db('sms_logs').insert({
        phone_number: phoneNumber,
        message: message,
        message_id: result.messageId,
        status: result.status,
        sent_at: result.timestamp,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Failed to log SMS:', error);
    }
  }

  formatSats(sats) {
    return new Intl.NumberFormat('fr-FR').format(sats) + ' sats';
  }

  async sendUSSDMenu(phoneNumber, language = 'fr') {
    try {
      const menu = i18n.t('ussd.main_menu', {}, language);
      
      // In a real implementation, this would integrate with USSD providers
      console.log(`📱 USSD to ${phoneNumber} (${language}): ${menu}`);
      
      return {
        message: menu,
        status: 'sent'
      };
    } catch (error) {
      console.error('USSD sending failed:', error);
      throw error;
    }
  }

  async sendUSSDResponse(phoneNumber, userInput, language = 'fr') {
    try {
      let response = '';
      
      switch (userInput) {
        case '1':
          response = i18n.t('ussd.join_group', {}, language);
          break;
        case '2':
          response = i18n.t('ussd.make_contribution', {}, language);
          break;
        case '3':
          response = i18n.t('ussd.check_balance', {}, language);
          break;
        case '4':
          response = i18n.t('ussd.view_history', {}, language);
          break;
        default:
          response = i18n.t('ussd.invalid_selection', {}, language);
      }

      console.log(`📱 USSD Response to ${phoneNumber}: ${response}`);
      
      return {
        message: response,
        status: 'sent'
      };
    } catch (error) {
      console.error('USSD response failed:', error);
      throw error;
    }
  }

  async scheduleReminders() {
    try {
      // Find groups with upcoming cycle deadlines
      const upcomingDeadlines = await this.db('tontine_groups')
        .where('status', 'active')
        .where('cycle_ends_at', '<=', new Date(Date.now() + 24 * 60 * 60 * 1000)) // Next 24 hours
        .select('id', 'name', 'current_cycle', 'cycle_ends_at');

      for (const group of upcomingDeadlines) {
        // Get members who haven't paid for current cycle
        const unpaidMembers = await this.db('group_members')
          .join('users', 'group_members.user_id', 'users.id')
          .leftJoin('contributions', function() {
            this.on('contributions.user_id', '=', 'users.id')
              .andOn('contributions.group_id', '=', 'group_members.group_id')
              .andOn('contributions.cycle_number', '=', this.db.raw('?', [group.current_cycle]))
              .andOn('contributions.status', '=', this.db.raw('?', ['paid']));
          })
          .where({
            'group_members.group_id': group.id,
            'group_members.is_active': true
          })
          .whereNull('contributions.id')
          .select('users.id', 'users.phone_number', 'users.language');

        // Send reminders to unpaid members
        for (const member of unpaidMembers) {
          await this.sendContributionReminder(group.id, member.id);
        }
      }

      console.log(`📅 Processed ${upcomingDeadlines.length} groups for reminders`);
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
    }
  }
}

module.exports = NotificationService;
