// backend/routes/tontine.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock in-memory storage for demo
let groups = [];
let members = [];
let contributions = [];

// Groups routes
router.post('/groups', async (req, res) => {
  try {
    const { name, description, contributionAmountSats, cycleDays, maxMembers, createdBy } = req.body;
    
    if (!name || !contributionAmountSats || !cycleDays || !maxMembers || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const group = {
      id: uuidv4(),
      name,
      description,
      contribution_amount_sats: contributionAmountSats,
      cycle_days: cycleDays,
      max_members: maxMembers,
      current_cycle: 1,
      status: 'active',
      created_by: createdBy,
      created_at: new Date().toISOString()
    };

    groups.push(group);
    
    // Add creator as admin member
    members.push({
      id: uuidv4(),
      group_id: group.id,
      user_id: createdBy,
      role: 'admin',
      joined_at: new Date().toISOString()
    });
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.get('/groups/:id', async (req, res) => {
  try {
    const group = groups.find(g => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Members routes
router.post('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, inviterId } = req.body;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is already a member
    const existingMember = members.find(m => m.group_id === groupId && m.user_id === userId);
    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    const member = {
      id: uuidv4(),
      group_id: groupId,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString()
    };

    members.push(member);
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Invoice routes
router.get('/groups/:groupId/invoice', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    const member = members.find(m => m.group_id === groupId && m.user_id === userId);
    if (!member) {
      return res.status(403).json({ error: 'User is not a member of this group' });
    }

    // Create mock invoice
    const paymentHash = uuidv4().replace(/-/g, '');
    const paymentRequest = `mock_lnbc${group.contribution_amount_sats}n1p${paymentHash}`;
    
    const invoice = {
      payment_request: paymentRequest,
      payment_hash: paymentHash,
      amount_sats: group.contribution_amount_sats,
      memo: `Tontine ${group.name} - Cycle ${group.current_cycle}`,
      expiry: 3600,
      created_at: new Date().toISOString()
    };

    // Store contribution
    contributions.push({
      id: uuidv4(),
      group_id: groupId,
      user_id: userId,
      cycle_number: group.current_cycle,
      amount_sats: group.contribution_amount_sats,
      payment_request: paymentRequest,
      payment_hash: paymentHash,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Status routes
router.get('/groups/:groupId/status', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const groupMembers = members.filter(m => m.group_id === groupId);
    const groupContributions = contributions.filter(c => c.group_id === groupId);
    const paidContributions = groupContributions.filter(c => c.status === 'paid');
    
    const totalContributions = paidContributions.reduce((sum, c) => sum + c.amount_sats, 0);
    const groupBalance = totalContributions;

    res.json({
      currentCycle: group.current_cycle,
      totalMembers: groupMembers.length,
      paidMembersCount: paidContributions.length,
      totalContributions,
      groupBalance,
      contributions: groupContributions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get group status' });
  }
});

module.exports = router;
