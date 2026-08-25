const Joi = require("joi");
const { APPLICANT_TYPES, APPLICATION_STATUS, MEMBERSHIP_STATUS } = require("../constants/roles");
const { PERMISSION_KEYS } = require("../constants/permissions");

const validPermissionKeys = Object.values(PERMISSION_KEYS);

// Sri Lankan phone number regex: accepts 07xxxxxxxx or +947xxxxxxxx
const sriLankanPhoneRegex = /^(?:0|\+94)7[0-9]{8}$/;

const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Full Name / Organization Name is required",
    "string.min": "Full Name must be at least 3 characters",
    "string.max": "Full Name must not exceed 100 characters"
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address"
  }),
  password: Joi.string().min(6).max(100).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters"
  }),
  applicantType: Joi.string().valid(...Object.values(APPLICANT_TYPES)).default(APPLICANT_TYPES.INDIVIDUAL)
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required"
  })
});

const submitApplicationSchema = Joi.object({
  applicantType: Joi.string().valid(...Object.values(APPLICANT_TYPES)).required().messages({
    "any.only": "Applicant type must be INDIVIDUAL or COMPANY"
  }),
  fullName: Joi.when("applicantType", {
    is: APPLICANT_TYPES.INDIVIDUAL,
    then: Joi.string().trim().min(3).max(100).required().messages({
      "string.empty": "Full Name is required for individual applicant",
      "string.min": "Full Name must be at least 3 characters",
      "string.max": "Full Name must not exceed 100 characters"
    }),
    otherwise: Joi.forbidden()
  }),
  companyName: Joi.when("applicantType", {
    is: APPLICANT_TYPES.COMPANY,
    then: Joi.string().trim().min(3).max(100).required().messages({
      "string.empty": "Company Name is required for company applicant",
      "string.min": "Company Name must be at least 3 characters",
      "string.max": "Company Name must not exceed 100 characters"
    }),
    otherwise: Joi.forbidden()
  }),
  nic: Joi.when("applicantType", {
    is: APPLICANT_TYPES.INDIVIDUAL,
    then: Joi.string().trim().min(9).max(20).required().messages({
      "string.empty": "National Identity Card (NIC) number is required for individuals"
    }),
    otherwise: Joi.forbidden()
  }),
  registrationNo: Joi.when("applicantType", {
    is: APPLICANT_TYPES.COMPANY,
    then: Joi.string().trim().min(2).max(30).required().messages({
      "string.empty": "Business Registration Number is required for companies"
    }),
    otherwise: Joi.forbidden()
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address"
  }),
  phone: Joi.string().trim().pattern(sriLankanPhoneRegex).required().messages({
    "string.empty": "Phone number is required",
    "string.pattern.base": "Phone number must be a valid Sri Lankan format (e.g. 0771234567 or +94771234567)"
  }),
  address: Joi.string().trim().min(5).max(250).required().messages({
    "string.empty": "Address is required",
    "string.min": "Address must be at least 5 characters",
    "string.max": "Address must not exceed 250 characters"
  }),
  membershipTypeId: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "Membership Type is required",
    "string.length": "Invalid Membership Type ID"
  })
});

const rejectApplicationSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required().messages({
    "string.empty": "Rejection reason is required",
    "string.min": "Rejection reason must be at least 3 characters",
    "string.max": "Rejection reason must not exceed 500 characters"
  })
});

const createOfficerRoleSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Role name is required",
    "string.min": "Role name must be at least 3 characters",
    "string.max": "Role name cannot exceed 50 characters"
  }),
  description: Joi.string().trim().max(255).allow("").default(""),
  permissions: Joi.array().items(Joi.string().valid(...validPermissionKeys)).unique().required().messages({
    "array.base": "Permissions must be an array of permission keys",
    "any.only": "Invalid permission key specified"
  })
});

const updateRolePermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string().valid(...validPermissionKeys)).unique().required().messages({
    "array.base": "Permissions must be an array of permission keys",
    "any.only": "Invalid permission key specified"
  })
});

const assignRoleSchema = Joi.object({
  userId: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "User ID is required",
    "string.length": "Invalid User ID"
  }),
  officerRoleId: Joi.string().trim().hex().length(24).allow(null).required().messages({
    "any.required": "Officer Role ID is required (or null to revoke)"
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  submitApplicationSchema,
  rejectApplicationSchema,
  createOfficerRoleSchema,
  updateRolePermissionsSchema,
  assignRoleSchema
};