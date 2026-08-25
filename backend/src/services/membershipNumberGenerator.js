const Membership = require("../models/Membership");

const generateMembershipNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `YV-${currentYear}-`;
  
  // Find highest number issued this year
  const lastMembership = await Membership.findOne({
    membershipNumber: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1, membershipNumber: -1 });

  let nextSequence = 1;

  if (lastMembership && lastMembership.membershipNumber) {
    const parts = lastMembership.membershipNumber.split("-");
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  // Format as YV-2026-000001
  const paddedSequence = String(nextSequence).padStart(6, "0");
  const membershipNumber = `${prefix}${paddedSequence}`;

  // Verify uniqueness just in case
  const exists = await Membership.findOne({ membershipNumber });
  if (exists) {
    // If collision, bump sequence
    const count = await Membership.countDocuments();
    const fallbackSeq = String(count + 1).padStart(6, "0");
    return `${prefix}${fallbackSeq}`;
  }

  return membershipNumber;
};

module.exports = {
  generateMembershipNumber
};