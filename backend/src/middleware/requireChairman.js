const { USER_TYPES } = require("../constants/roles");
const ApiResponse = require("../utils/apiResponse");

/**
 * Enforces that only Chairman can execute this route (BR-08).
 */
const requireChairman = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, "Authentication required");
  }

  if (req.user.userType === USER_TYPES.CHAIRMAN) {
    return next();
  }

  return ApiResponse.forbidden(
    res,
    "Access denied. Only the Chairman can perform role creation, permission modification, and role assignment."
  );
};

module.exports = {
  requireChairman
};