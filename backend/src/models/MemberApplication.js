const mongoose = require("mongoose");
const { APPLICANT_TYPES, APPLICATION_STATUS } = require("../constants/roles");

const memberApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    applicantType: {
      type: String,
      enum: Object.values(APPLICANT_TYPES),
      required: true
    },
    fullName: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    companyName: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    nic: {
      type: String,
      trim: true
    },
    registrationNo: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
    },
    membershipTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipType",
      required: true
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING,
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const MemberApplication = mongoose.model("MemberApplication", memberApplicationSchema);
module.exports = MemberApplication;