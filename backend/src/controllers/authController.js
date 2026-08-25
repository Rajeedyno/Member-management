const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OfficerRole = require("../models/OfficerRole");
const { USER_TYPES, APPLICANT_TYPES, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } = require("../constants/roles");
const { PERMISSION_KEYS } = require("../constants/permissions");
const ApiResponse = require("../utils/apiResponse");
const { logAudit } = require("../services/auditService");

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "yarl_ventures_super_secret_jwt_key_2026";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ userId }, secret, { expiresIn });
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, applicantType } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.conflict(res, "An account with this email address already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      userType: USER_TYPES.MEMBER,
      applicantType: applicantType || APPLICANT_TYPES.INDIVIDUAL,
      isActive: true
    });

    await user.save();

    const token = generateToken(user._id);
    const effectivePermissions = [];

    await logAudit({
      actorUserId: user._id,
      action: AUDIT_ACTIONS.USER_REGISTERED,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: user._id,
      details: { email: user.email, applicantType: user.applicantType },
      req
    });

    return ApiResponse.success(
      res,
      {
        token,
        user: user.toJSON(),
        effectivePermissions
      },
      "Registration successful",
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).populate("officerRoleId");
    if (!user) {
      return ApiResponse.unauthorized(res, "Invalid email or password");
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, "Your account has been deactivated. Please contact support.");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, "Invalid email or password");
    }

    const token = generateToken(user._id);

    let effectivePermissions = [];
    if (user.userType === USER_TYPES.CHAIRMAN) {
      effectivePermissions = Object.values(PERMISSION_KEYS);
    } else if (user.userType === USER_TYPES.OFFICER && user.officerRoleId) {
      effectivePermissions = user.officerRoleId.permissions || [];
    }

    return ApiResponse.success(
      res,
      {
        token,
        user: user.toJSON(),
        effectivePermissions
      },
      "Login successful"
    );
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  return ApiResponse.success(
    res,
    {
      user: req.user.toJSON(),
      effectivePermissions: req.user.effectivePermissions || []
    },
    "User profile fetched successfully"
  );
};

const logout = async (req, res) => {
  return ApiResponse.success(res, null, "Logged out successfully");
};

module.exports = {
  register,
  login,
  getMe,
  logout
};