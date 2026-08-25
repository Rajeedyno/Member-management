const OfficerRole = require("../models/OfficerRole");
const User = require("../models/User");
const { USER_TYPES, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } = require("../constants/roles");
const ApiResponse = require("../utils/apiResponse");
const { logAudit } = require("../services/auditService");

const createOfficerRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const existingRole = await OfficerRole.findOne({ name: name.trim() });
    if (existingRole) {
      return ApiResponse.conflict(res, `An Officer Role named "${name}" already exists.`);
    }

    const role = new OfficerRole({
      name: name.trim(),
      description: description || "",
      permissions: permissions || [],
      createdBy: req.user._id
    });

    await role.save();

    await logAudit({
      actorUserId: req.user._id,
      action: AUDIT_ACTIONS.ROLE_CREATED,
      entityType: AUDIT_ENTITY_TYPES.OFFICER_ROLE,
      entityId: role._id,
      details: {
        roleName: role.name,
        permissions: role.permissions
      },
      req
    });

    return ApiResponse.success(res, role, "Officer Role created successfully", 201);
  } catch (err) {
    next(err);
  }
};

const getOfficerRoles = async (req, res, next) => {
  try {
    const roles = await OfficerRole.find().populate("createdBy", "fullName email").sort({ createdAt: -1 });

    // Also attach count of assigned users
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const assignedUserCount = await User.countDocuments({ officerRoleId: role._id });
        return {
          ...role.toObject(),
          assignedUserCount
        };
      })
    );

    return ApiResponse.success(res, rolesWithCounts, "Officer roles retrieved");
  } catch (err) {
    next(err);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const role = await OfficerRole.findById(id);
    if (!role) {
      return ApiResponse.notFound(res, "Officer Role not found");
    }

    const oldPermissions = [...role.permissions];
    role.permissions = permissions;
    await role.save();

    await logAudit({
      actorUserId: req.user._id,
      action: AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.OFFICER_ROLE,
      entityId: role._id,
      details: {
        roleName: role.name,
        oldPermissions,
        newPermissions: permissions
      },
      req
    });

    return ApiResponse.success(res, role, "Role permissions updated successfully");
  } catch (err) {
    next(err);
  }
};

const assignRoleToUser = async (req, res, next) => {
  try {
    const { id: paramRoleId } = req.params;
    const { userId, officerRoleId } = req.body;

    const targetRoleId = officerRoleId !== undefined ? officerRoleId : paramRoleId;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return ApiResponse.notFound(res, "Target user not found");
    }

    // Do not allow reassigning the Chairman to a normal officer or member
    if (targetUser.userType === USER_TYPES.CHAIRMAN) {
      return ApiResponse.forbidden(res, "Cannot modify the Chairman account role");
    }

    let roleName = "None (Revoked)";
    if (targetRoleId) {
      const role = await OfficerRole.findById(targetRoleId);
      if (!role) {
        return ApiResponse.notFound(res, "Selected Officer Role not found");
      }
      targetUser.officerRoleId = role._id;
      targetUser.userType = USER_TYPES.OFFICER;
      roleName = role.name;
    } else {
      // Role revoked -> revert to member
      targetUser.officerRoleId = null;
      targetUser.userType = USER_TYPES.MEMBER;
    }

    await targetUser.save();
    const updatedUser = await User.findById(targetUser._id).populate("officerRoleId");

    await logAudit({
      actorUserId: req.user._id,
      action: AUDIT_ACTIONS.ROLE_ASSIGNED,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetUser._id,
      details: {
        userEmail: targetUser.email,
        assignedRole: roleName,
        userType: targetUser.userType
      },
      req
    });

    return ApiResponse.success(
      res,
      updatedUser,
      `Role successfully ${targetRoleId ? "assigned" : "revoked"} for ${targetUser.fullName}`
    );
  } catch (err) {
    next(err);
  }
};

const getStaffUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      userType: { $in: [USER_TYPES.CHAIRMAN, USER_TYPES.OFFICER, USER_TYPES.MEMBER] }
    })
      .populate("officerRoleId")
      .select("-passwordHash")
      .sort({ userType: 1, fullName: 1 });

    return ApiResponse.success(res, users, "Users list for role assignment retrieved");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOfficerRole,
  getOfficerRoles,
  updateRolePermissions,
  assignRoleToUser,
  getStaffUsers
};