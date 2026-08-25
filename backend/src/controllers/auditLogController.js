const AuditLog = require("../models/AuditLog");
const ApiResponse = require("../utils/apiResponse");

const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.action) {
      query.action = req.query.action;
    }
    if (req.query.entityType) {
      query.entityType = req.query.entityType;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("actorUserId", "fullName email userType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query)
    ]);

    return ApiResponse.success(
      res,
      {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      "Audit logs retrieved"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs
};