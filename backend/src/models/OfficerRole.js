const mongoose = require("mongoose");

const officerRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    permissions: {
      type: [String],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  {
    timestamps: true
  }
);

const OfficerRole = mongoose.model("OfficerRole", officerRoleSchema);
module.exports = OfficerRole;