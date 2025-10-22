const Joi = require('joi');
const TontineService = require('./TontineService');
const { validateRequest, asyncHandler } = require('./validation');

class TontineController {
  constructor() {
    this.tontineService = new TontineService();
    this.initializeRoutes = this.initializeRoutes.bind(this);
    
    // Define validation schemas
    this.schemas = {
      createGroup: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).optional(),
        contributionAmountSats: Joi.number().integer().min(1000).max(1000000).required(),
        cycleDays: Joi.number().integer().min(1).max(30).required(),
        maxMembers: Joi.number().integer().min(2).max(20).required()
      }),
      
      addMember: Joi.object({
        userId: Joi.string().uuid().required()
      }),
      
      contributionInvoice: Joi.object({
        groupId: Joi.string().uuid().required()
      })
    };
  }

  initializeRoutes(router) {
    // Group management
    router.post(
      '/groups',
      validateRequest(this.schemas.createGroup, 'body'),
      asyncHandler(this.createGroup.bind(this))
    );
    
    router.get(
      '/groups',
      asyncHandler(this.listGroups.bind(this))
    );
    
    router.get(
      '/groups/:groupId',
      validateRequest({ groupId: Joi.string().uuid().required() }, 'params'),
      asyncHandler(this.getGroup.bind(this))
    );

    // Member management
    router.post(
      '/groups/:groupId/members',
      validateRequest({ groupId: Joi.string().uuid().required() }, 'params'),
      validateRequest(this.schemas.addMember, 'body'),
      asyncHandler(this.addMember.bind(this))
    );

    // Contributions
    router.get(
      '/groups/:groupId/invoice',
      validateRequest({ groupId: Joi.string().uuid().required() }, 'params'),
      asyncHandler(this.createContributionInvoice.bind(this))
    );

    // Group status
    router.get(
      '/groups/:groupId/status',
      validateRequest({ groupId: Joi.string().uuid().required() }, 'params'),
      asyncHandler(this.getGroupStatus.bind(this))
    );

    return router;
  }

  async createGroup(req, res) {
    const { body, user, ip } = req;
    
    const group = await this.tontineService.createGroup(
      {
        name: body.name,
        description: body.description,
        contribution_amount_sats: body.contributionAmountSats,
        cycle_days: body.cycleDays,
        max_members: body.maxMembers
      },
      user.id,
      ip
    );

    res.status(201).json({
      success: true,
      data: group,
      message: 'Tontine group created successfully'
    });
  }

  async listGroups(req, res) {
    const { user } = req;
    const { page = 1, limit = 10, status } = req.query;

    const db = require('./database').getDb();
    
    let query = db('tontine_groups')
      .select('tontine_groups.*')
      .join('group_members', 'tontine_groups.id', 'group_members.group_id')
      .where('group_members.user_id', user.id)
      .where('group_members.is_active', true)
      .orderBy('tontine_groups.created_at', 'desc');

    if (status) {
      query = query.where('tontine_groups.status', status);
    }

    const [groups, total] = await Promise.all([
      query.clone()
        .limit(limit)
        .offset((page - 1) * limit),
      query.clone().count('tontine_groups.id as count').first()
    ]);

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        totalPages: Math.ceil(total.count / limit)
      }
    });
  }

  async getGroup(req, res) {
    const { groupId } = req.params;
    const { user } = req;

    const db = require('./database').getDb();
    
    const group = await db('tontine_groups')
      .select('tontine_groups.*')
      .join('group_members', 'tontine_groups.id', 'group_members.group_id')
      .where({
        'tontine_groups.id': groupId,
        'group_members.user_id': user.id,
        'group_members.is_active': true
      })
      .first();

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found or access denied'
      });
    }

    res.json({
      success: true,
      data: group
    });
  }

  async addMember(req, res) {
    const { groupId } = req.params;
    const { userId } = req.body;
    const { user: inviter, ip } = req;

    const member = await this.tontineService.addMember(
      groupId,
      userId,
      inviter.id,
      ip
    );

    res.status(201).json({
      success: true,
      data: member,
      message: 'Member added successfully'
    });
  }

  async createContributionInvoice(req, res) {
    const { groupId } = req.params;
    const { user, ip } = req;

    const invoice = await this.tontineService.createContributionInvoice(
      groupId,
      user.id,
      ip
    );

    res.json({
      success: true,
      data: invoice
    });
  }

  async getGroupStatus(req, res) {
    const { groupId } = req.params;
    const { user } = req;

    const status = await this.tontineService.getGroupStatus(groupId, user.id);

    res.json({
      success: true,
      data: status
    });
  }
}

module.exports = TontineController;
