const mongoose = require("mongoose");
const { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } = require("../constants/roles");

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: Object.values(AUDIT_ENTITY_TYPES),
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1"
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;