const { PERMISSIONS_LIST } = require("../constants/permissions");
const ApiResponse = require("../utils/apiResponse");

const getPermissions = async (req, res) => {
  return ApiResponse.success(res, PERMISSIONS_LIST, "Available permission keys retrieved");
};

module.exports = {
  getPermissions
};