const { USER_TYPES } = require("../constants/roles");
const ApiResponse = require("../utils/apiResponse");

/**
 * Enforces permission check for a given permission key.
 * Chairman bypasses all permission checks (BR-05).
 * Officers must possess the specified key in their assigned role.
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    // Chairman bypasses all permission checks
    if (req.user.userType === USER_TYPES.CHAIRMAN) {
      return next();
    }

    // Check if user has permission in effective permissions
    const permissions = req.user.effectivePermissions || [];
    if (permissions.includes(permissionKey)) {
      return next();
    }

    // 403 Forbidden when missing permission
    return ApiResponse.forbidden(
      res,
      `Access denied. Missing required permission: ${permissionKey}`
    );
  };
};

module.exports = {
  requirePermission
};