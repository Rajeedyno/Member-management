const Membership = require("../models/Membership");
const MemberApplication = require("../models/MemberApplication");
const User = require("../models/User");
const { MEMBERSHIP_STATUS, APPLICATION_STATUS } = require("../constants/roles");
const ApiResponse = require("../utils/apiResponse");

const getMembers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status.toUpperCase();
    }

    if (req.query.membershipTypeId) {
      query.membershipTypeId = req.query.membershipTypeId;
    }

    let userMatches = null;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      
      // Match users or applications by name/email
      const [matchedUsers, matchedApps] = await Promise.all([
        User.find({
          $or: [{ fullName: searchRegex }, { email: searchRegex }]
        }).select("_id"),
        MemberApplication.find({
          $or: [
            { fullName: searchRegex },
            { companyName: searchRegex },
            { email: searchRegex },
            { nic: searchRegex },
            { registrationNo: searchRegex }
          ]
        }).select("_id")
      ]);

      const userIds = matchedUsers.map((u) => u._id);
      const appIds = matchedApps.map((a) => a._id);

      query.$or = [
        { membershipNumber: searchRegex },
        { userId: { $in: userIds } },
        { applicationId: { $in: appIds } }
      ];
    }

    const [memberships, total] = await Promise.all([
      Membership.find(query)
        .populate("userId", "fullName email applicantType")
        .populate("applicationId")
        .populate("membershipTypeId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Membership.countDocuments(query)
    ]);

    return ApiResponse.success(
      res,
      {
        members: memberships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      "Members list retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
};

const getMyMembership = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const membership = await Membership.findOne({
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE
    })
      .populate("membershipTypeId")
      .populate("applicationId");

    return ApiResponse.success(res, membership, "Membership information retrieved");
  } catch (err) {
    next(err);
  }
};

const getMemberStats = async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMembers,
      pendingApplications,
      approvedThisMonth,
      totalApplications
    ] = await Promise.all([
      Membership.countDocuments(),
      Membership.countDocuments({ status: MEMBERSHIP_STATUS.ACTIVE }),
      MemberApplication.countDocuments({ status: APPLICATION_STATUS.PENDING }),
      Membership.countDocuments({ createdAt: { $gte: startOfMonth } }),
      MemberApplication.countDocuments()
    ]);

    return ApiResponse.success(
      res,
      {
        totalMembers,
        activeMembers,
        pendingApplications,
        approvedThisMonth,
        totalApplications
      },
      "Dashboard statistics retrieved"
    );
  } catch (err) {
    next(err);
  }
};

const exportMembersCsv = async (req, res, next) => {
  try {
    const memberships = await Membership.find()
      .populate("userId", "fullName email applicantType")
      .populate("applicationId")
      .populate("membershipTypeId")
      .sort({ createdAt: -1 });

    const header = "Membership Number,Applicant Name,Applicant Type,Email,Phone,NIC/RegNo,Membership Type,Status,Start Date,End Date\n";
    const rows = memberships.map((m) => {
      const app = m.applicationId || {};
      const name = app.fullName || app.companyName || m.userId?.fullName || "";
      const type = app.applicantType || m.userId?.applicantType || "";
      const email = app.email || m.userId?.email || "";
      const phone = app.phone || "";
      const idNo = app.nic || app.registrationNo || "";
      const typeName = m.membershipTypeId?.name || "";
      const status = m.status;
      const start = m.startDate ? new Date(m.startDate).toISOString().split("T")[0] : "";
      const end = m.endDate ? new Date(m.endDate).toISOString().split("T")[0] : "";

      return `"${m.membershipNumber}","${name.replace(/"/g, )}","${type}","${email}","${phone}","${idNo}","${typeName}","${status}","${start}","${end}"`;
    });

    const csvContent = header + rows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="members_export_${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMembers,
  getMyMembership,
  getMemberStats,
  exportMembersCsv
};