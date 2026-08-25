const MemberApplication = require("../models/MemberApplication");
const Membership = require("../models/Membership");
const MembershipType = require("../models/MembershipType");
const { APPLICATION_STATUS, MEMBERSHIP_STATUS, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, USER_TYPES } = require("../constants/roles");
const ApiResponse = require("../utils/apiResponse");
const { generateMembershipNumber } = require("../services/membershipNumberGenerator");
const { logAudit } = require("../services/auditService");

const submitApplication = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      applicantType,
      fullName,
      companyName,
      nic,
      registrationNo,
      email,
      phone,
      address,
      membershipTypeId
    } = req.body;

    // BR-03: A user can hold only one PENDING application at a time
    const existingPending = await MemberApplication.findOne({
      userId,
      status: APPLICATION_STATUS.PENDING
    });

    if (existingPending) {
      return ApiResponse.conflict(
        res,
        "You already have a pending membership application under review. Please wait until it is processed."
      );
    }

    // Verify membership type exists and matches applicant type
    const membershipType = await MembershipType.findById(membershipTypeId);
    if (!membershipType || !membershipType.isActive) {
      return ApiResponse.validationError(res, [
        { field: "membershipTypeId", message: "Selected membership type is invalid or inactive" }
      ]);
    }

    if (membershipType.applicableTo !== applicantType) {
      return ApiResponse.validationError(res, [
        { field: "membershipTypeId", message: `Selected membership type is only valid for ${membershipType.applicableTo} applicants` }
      ]);
    }

    const application = new MemberApplication({
      userId,
      applicantType,
      fullName: applicantType === "INDIVIDUAL" ? fullName : undefined,
      companyName: applicantType === "COMPANY" ? companyName : undefined,
      nic: applicantType === "INDIVIDUAL" ? nic : undefined,
      registrationNo: applicantType === "COMPANY" ? registrationNo : undefined,
      email: email.toLowerCase(),
      phone,
      address,
      membershipTypeId,
      status: APPLICATION_STATUS.PENDING
    });

    await application.save();
    const populated = await MemberApplication.findById(application._id).populate("membershipTypeId");

    await logAudit({
      actorUserId: userId,
      action: AUDIT_ACTIONS.APPLICATION_SUBMITTED,
      entityType: AUDIT_ENTITY_TYPES.APPLICATION,
      entityId: application._id,
      details: {
        applicantType,
        applicantName: fullName || companyName,
        membershipType: membershipType.name
      },
      req
    });

    return ApiResponse.success(
      res,
      populated,
      "Membership application submitted successfully. It is now pending review.",
      201
    );
  } catch (err) {
    next(err);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const applications = await MemberApplication.find({ userId })
      .populate("membershipTypeId")
      .populate("reviewedBy", "fullName email")
      .sort({ createdAt: -1 });

    const activeMembership = await Membership.findOne({
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).populate("membershipTypeId");

    return ApiResponse.success(
      res,
      {
        applications,
        activeMembership
      },
      "Your membership application status retrieved"
    );
  } catch (err) {
    next(err);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status.toUpperCase();
    }
    if (req.query.applicantType) {
      query.applicantType = req.query.applicantType.toUpperCase();
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { companyName: searchRegex },
        { email: searchRegex },
        { nic: searchRegex },
        { registrationNo: searchRegex },
        { phone: searchRegex }
      ];
    }

    const [applications, total] = await Promise.all([
      MemberApplication.find(query)
        .populate("userId", "fullName email")
        .populate("membershipTypeId")
        .populate("reviewedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MemberApplication.countDocuments(query)
    ]);

    return ApiResponse.success(
      res,
      {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      "Applications retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await MemberApplication.findById(id)
      .populate("userId", "fullName email")
      .populate("membershipTypeId")
      .populate("reviewedBy", "fullName email");

    if (!application) {
      return ApiResponse.notFound(res, "Application not found");
    }

    // Owner or Staff with permission
    const isOwner = application.userId && application.userId._id.toString() === req.user._id.toString();
    const isStaff = req.user.userType === USER_TYPES.CHAIRMAN || (req.user.effectivePermissions && req.user.effectivePermissions.includes("application.view"));

    if (!isOwner && !isStaff) {
      return ApiResponse.forbidden(res, "Access denied to this application record");
    }

    return ApiResponse.success(res, application, "Application details retrieved");
  } catch (err) {
    next(err);
  }
};

const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await MemberApplication.findById(id).populate("membershipTypeId");

    if (!application) {
      return ApiResponse.notFound(res, "Application not found");
    }

    if (application.status !== APPLICATION_STATUS.PENDING) {
      return ApiResponse.conflict(
        res,
        `Cannot approve application. Current status is ${application.status}.`
      );
    }

    // Generate unique membership number
    const membershipNumber = await generateMembershipNumber();

    // Validity: 1 year from now
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const membership = new Membership({
      userId: application.userId,
      applicationId: application._id,
      membershipNumber,
      membershipTypeId: application.membershipTypeId._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
      startDate,
      endDate
    });

    await membership.save();

    application.status = APPLICATION_STATUS.APPROVED;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.rejectionReason = null;
    await application.save();

    const populatedApp = await MemberApplication.findById(application._id)
      .populate("userId", "fullName email")
      .populate("membershipTypeId")
      .populate("reviewedBy", "fullName email");

    await logAudit({
      actorUserId: req.user._id,
      action: AUDIT_ACTIONS.APPLICATION_APPROVED,
      entityType: AUDIT_ENTITY_TYPES.APPLICATION,
      entityId: application._id,
      details: {
        applicantName: application.fullName || application.companyName,
        membershipNumber,
        membershipType: application.membershipTypeId.name,
        annualFee: application.membershipTypeId.annualFee
      },
      req
    });

    return ApiResponse.success(
      res,
      {
        application: populatedApp,
        membership
      },
      `Application approved successfully. Membership number issued: ${membershipNumber}`
    );
  } catch (err) {
    next(err);
  }
};

const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await MemberApplication.findById(id).populate("membershipTypeId");
    if (!application) {
      return ApiResponse.notFound(res, "Application not found");
    }

    if (application.status !== APPLICATION_STATUS.PENDING) {
      return ApiResponse.conflict(
        res,
        `Cannot reject application. Current status is ${application.status}.`
      );
    }

    application.status = APPLICATION_STATUS.REJECTED;
    application.rejectionReason = reason;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    const populatedApp = await MemberApplication.findById(application._id)
      .populate("userId", "fullName email")
      .populate("membershipTypeId")
      .populate("reviewedBy", "fullName email");

    await logAudit({
      actorUserId: req.user._id,
      action: AUDIT_ACTIONS.APPLICATION_REJECTED,
      entityType: AUDIT_ENTITY_TYPES.APPLICATION,
      entityId: application._id,
      details: {
        applicantName: application.fullName || application.companyName,
        rejectionReason: reason
      },
      req
    });

    return ApiResponse.success(
      res,
      populatedApp,
      "Application has been rejected with the specified reason"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  getMyApplications,
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
};