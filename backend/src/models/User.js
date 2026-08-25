const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_TYPES, APPLICANT_TYPES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"]
    },
    userType: {
      type: String,
      enum: Object.values(USER_TYPES),
      default: USER_TYPES.MEMBER,
      index: true
    },
    applicantType: {
      type: String,
      enum: Object.values(APPLICANT_TYPES),
      default: APPLICANT_TYPES.INDIVIDUAL
    },
    officerRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OfficerRole",
      default: null
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

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  return userObj;
};

const User = mongoose.model("User", userSchema);
module.exports = User;