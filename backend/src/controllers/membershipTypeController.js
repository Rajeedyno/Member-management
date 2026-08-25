const MembershipType = require("../models/MembershipType");
const ApiResponse = require("../utils/apiResponse");

const getMembershipTypes = async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.query.applicableTo) {
      query.applicableTo = req.query.applicableTo.toUpperCase();
    }
    const types = await MembershipType.find(query).sort({ annualFee: 1 });
    return ApiResponse.success(res, types, "Membership types retrieved");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMembershipTypes
};