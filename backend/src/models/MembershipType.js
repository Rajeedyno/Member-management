const mongoose = require("mongoose");
const { APPLICANT_TYPES } = require("../constants/roles");

const membershipTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    applicableTo: {
      type: String,
      enum: Object.values(APPLICANT_TYPES),
      required: true
    },
    annualFee: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const MembershipType = mongoose.model("MembershipType", membershipTypeSchema);
module.exports = MembershipType;