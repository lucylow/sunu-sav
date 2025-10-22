const dbManager = require('./database');

class AuditService {
  constructor() {
    this.db = dbManager.getDb();
  }

  async log(auditData, transaction = null) {
    const db = transaction || this.db;
    
    const auditLog = {
      action: auditData.action,
      resource_type: auditData.resourceType,
      resource_id: auditData.resourceId || null,
      user_id: auditData.userId || null,
      old_values: auditData.oldValues || null,
      new_values: auditData.newValues || null,
      metadata: auditData.metadata || null,
      ip_address: auditData.ipAddress || null,
      user_agent: auditData.userAgent || null,
      created_at: new Date()
    };

    // Remove any PII from metadata before storing
    if (auditLog.metadata) {
      auditLog.metadata = this.scrubPII(auditLog.metadata);
    }
    if (auditLog.old_values) {
      auditLog.old_values = this.scrubPII(auditLog.old_values);
    }
    if (auditLog.new_values) {
      auditLog.new_values = this.scrubPII(auditLog.new_values);
    }

    try {
      await db('audit_logs').insert(auditLog);
    } catch (error) {
      // Don't throw error from audit logging to avoid breaking main operations
      console.error('Audit logging failed:', error);
    }
  }

  scrubPII(data) {
    if (typeof data !== 'object' || data === null) return data;

    const scrubbed = { ...data };
    const piiFields = [
      'phone_number', 'email', 'address', 'public_key', 
      'payment_request', 'private_key', 'password'
    ];

    for (const field of piiFields) {
      if (scrubbed[field]) {
        scrubbed[field] = '[REDACTED]';
      }
    }

    // Recursively scrub nested objects
    for (const key in scrubbed) {
      if (typeof scrubbed[key] === 'object' && scrubbed[key] !== null) {
        scrubbed[key] = this.scrubPII(scrubbed[key]);
      }
    }

    return scrubbed;
  }

  async queryLogs(filters = {}, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    let query = this.db('audit_logs')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (filters.action) {
      query = query.where('action', filters.action);
    }
    if (filters.resourceType) {
      query = query.where('resource_type', filters.resourceType);
    }
    if (filters.resourceId) {
      query = query.where('resource_id', filters.resourceId);
    }
    if (filters.userId) {
      query = query.where('user_id', filters.userId);
    }
    if (filters.startDate) {
      query = query.where('created_at', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('created_at', '<=', filters.endDate);
    }

    const [logs, total] = await Promise.all([
      query,
      this._getTotalCount(filters)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  async _getTotalCount(filters) {
    let query = this.db('audit_logs').count('id as count');

    if (filters.action) {
      query = query.where('action', filters.action);
    }
    if (filters.resourceType) {
      query = query.where('resource_type', filters.resourceType);
    }

    return query.first();
  }
}

module.exports = AuditService;
