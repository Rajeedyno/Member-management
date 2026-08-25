const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OfficerRole = require("../models/OfficerRole");
const { USER_TYPES } = require("../constants/roles");
const { PERMISSION_KEYS } = require("../constants/permissions");
const ApiResponse = require("../utils/apiResponse");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, "Authorization token is required");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return ApiResponse.unauthorized(res, "Invalid token format");
    }

    const secret = process.env.JWT_SECRET || "yarl_ventures_super_secret_jwt_key_2026";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return ApiResponse.unauthorized(res, "Token expired or invalid");
    }

    const user = await User.findById(decoded.userId).populate("officerRoleId");
    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, "User account not found or deactivated");
    }

    // Resolve effective permissions
    let effectivePermissions = [];
    if (user.userType === USER_TYPES.CHAIRMAN) {
      effectivePermissions = Object.values(PERMISSION_KEYS);
    } else if (user.userType === USER_TYPES.OFFICER && user.officerRoleId) {
      effectivePermissions = user.officerRoleId.permissions || [];
    } else {
      effectivePermissions = [];
    }

    req.user = user;
    req.user.effectivePermissions = effectivePermissions;
    req.token = token;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return ApiResponse.error(res, "AUTH_ERROR", "Authentication failed", err.message, 401);
  }
};

module.exports = {
  requireAuth
};