const mongoose = require("mongoose");
const { MEMBERSHIP_STATUS } = require("../constants/roles");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MemberApplication",
      required: true
    },
    membershipNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    membershipTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipType",
      required: true
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
      index: true
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Membership = mongoose.model("Membership", membershipSchema);
module.exports = Membership;