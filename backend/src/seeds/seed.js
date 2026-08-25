const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const { connectDB, disconnectDB } = require("../config/db");
const User = require("../models/User");
const OfficerRole = require("../models/OfficerRole");
const MembershipType = require("../models/MembershipType");
const MemberApplication = require("../models/MemberApplication");
const Membership = require("../models/Membership");
const AuditLog = require("../models/AuditLog");
const { USER_TYPES, APPLICANT_TYPES, APPLICATION_STATUS, MEMBERSHIP_STATUS, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } = require("../constants/roles");
const { PERMISSION_KEYS } = require("../constants/permissions");

const seedDatabase = async () => {
  try {
    console.log("--------------------------------------------------");
    console.log(" Starting Database Seeding (F-14)...");
    console.log("--------------------------------------------------");

    await connectDB();

    // Clean up existing data for fresh seed
    await Promise.all([
      User.deleteMany({}),
      OfficerRole.deleteMany({}),
      MembershipType.deleteMany({}),
      MemberApplication.deleteMany({}),
      Membership.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log("✓ Cleared existing collections");

    // 1. Seed Chairman Account (F-14, BR-05)
    const chairmanSalt = await bcrypt.genSalt(10);
    const chairmanPasswordHash = await bcrypt.hash("Chairman@2026", chairmanSalt);

    const chairman = new User({
      fullName: "Dr. K. Sivalingam (Chairman)",
      email: "chairman@yarlventures.com",
      passwordHash: chairmanPasswordHash,
      userType: USER_TYPES.CHAIRMAN,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      isActive: true
    });
    await chairman.save();
    console.log("✓ Created Chairman account: chairman@yarlventures.com / Chairman@2026");

    // 2. Seed Membership Types (F-14: At least 3 types)
    const membershipTypesData = [
      {
        name: "Individual Standard",
        applicableTo: APPLICANT_TYPES.INDIVIDUAL,
        annualFee: 15000,
        isActive: true
      },
      {
        name: "Individual Life",
        applicableTo: APPLICANT_TYPES.INDIVIDUAL,
        annualFee: 75000,
        isActive: true
      },
      {
        name: "Corporate Premium",
        applicableTo: APPLICANT_TYPES.COMPANY,
        annualFee: 150000,
        isActive: true
      }
    ];

    const [typeIndivStd, typeIndivLife, typeCorpPrem] = await MembershipType.insertMany(membershipTypesData);
    console.log("✓ Seeded 3 Membership Types (Individual Standard, Individual Life, Corporate Premium)");

    // 3. Seed Officer Roles (F-10)
    const reviewerRole = new OfficerRole({
      name: "Membership Reviewer",
      description: "Can view, approve, and reject membership applications, and view member directory",
      permissions: [
        PERMISSION_KEYS.APPLICATION_VIEW,
        PERMISSION_KEYS.APPLICATION_APPROVE,
        PERMISSION_KEYS.APPLICATION_REJECT,
        PERMISSION_KEYS.MEMBER_VIEW
      ],
      createdBy: chairman._id
    });
    await reviewerRole.save();

    const auditorRole = new OfficerRole({
      name: "System Auditor",
      description: "Can inspect audit logs and view member directory",
      permissions: [
        PERMISSION_KEYS.AUDIT_VIEW,
        PERMISSION_KEYS.MEMBER_VIEW
      ],
      createdBy: chairman._id
    });
    await auditorRole.save();

    const viewerRole = new OfficerRole({
      name: "Viewer Officer",
      description: "Read-only access to view members and applications",
      permissions: [
        PERMISSION_KEYS.MEMBER_VIEW,
        PERMISSION_KEYS.APPLICATION_VIEW
      ],
      createdBy: chairman._id
    });
    await viewerRole.save();
    console.log("✓ Seeded 3 Officer Roles (Membership Reviewer, System Auditor, Viewer Officer)");

    // 4. Seed Officer Accounts (F-11)
    const officerSalt = await bcrypt.genSalt(10);
    const officerPasswordHash = await bcrypt.hash("Officer@2026", officerSalt);

    const reviewerUser = new User({
      fullName: "Suresh Kumar (Review Officer)",
      email: "reviewer@yarlventures.com",
      passwordHash: officerPasswordHash,
      userType: USER_TYPES.OFFICER,
      officerRoleId: reviewerRole._id,
      isActive: true
    });
    await reviewerUser.save();

    const auditorUser = new User({
      fullName: "Priyanka Jayawardena (Auditor)",
      email: "auditor@yarlventures.com",
      passwordHash: officerPasswordHash,
      userType: USER_TYPES.OFFICER,
      officerRoleId: auditorRole._id,
      isActive: true
    });
    await auditorUser.save();
    console.log("✓ Seeded 2 Officer Accounts (reviewer@yarlventures.com, auditor@yarlventures.com)");

    // 5. Seed Member Accounts (F-01)
    const memberSalt = await bcrypt.genSalt(10);
    const memberPasswordHash = await bcrypt.hash("Member@2026", memberSalt);

    const member1 = new User({
      fullName: "Kamal Perera",
      email: "kamal.perera@example.com",
      passwordHash: memberPasswordHash,
      userType: USER_TYPES.MEMBER,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      isActive: true
    });
    await member1.save();

    const member2 = new User({
      fullName: "TechCorp Solutions (Pvt) Ltd",
      email: "techcorp@example.com",
      passwordHash: memberPasswordHash,
      userType: USER_TYPES.MEMBER,
      applicantType: APPLICANT_TYPES.COMPANY,
      isActive: true
    });
    await member2.save();

    const member3 = new User({
      fullName: "Anura Silva",
      email: "anura.silva@example.com",
      passwordHash: memberPasswordHash,
      userType: USER_TYPES.MEMBER,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      isActive: true
    });
    await member3.save();

    const member4 = new User({
      fullName: "Nimal Fernando",
      email: "nimal.fernando@example.com",
      passwordHash: memberPasswordHash,
      userType: USER_TYPES.MEMBER,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      isActive: true
    });
    await member4.save();
    console.log("✓ Seeded 4 Member Accounts");

    // 6. Seed Applications & Memberships (F-04, F-05, F-07, F-08)
    // App 1: Kamal Perera (APPROVED)
    const app1 = new MemberApplication({
      userId: member1._id,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      fullName: "Kamal Perera",
      nic: "198512345678",
      email: "kamal.perera@example.com",
      phone: "0771234567",
      address: "No. 45, Temple Road, Colombo 03",
      membershipTypeId: typeIndivStd._id,
      status: APPLICATION_STATUS.APPROVED,
      reviewedBy: reviewerUser._id,
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    await app1.save();

    const mem1 = new Membership({
      userId: member1._id,
      applicationId: app1._id,
      membershipNumber: "YV-2026-000001",
      membershipTypeId: typeIndivStd._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000)
    });
    await mem1.save();

    // App 2: TechCorp Solutions (APPROVED)
    const app2 = new MemberApplication({
      userId: member2._id,
      applicantType: APPLICANT_TYPES.COMPANY,
      companyName: "TechCorp Solutions (Pvt) Ltd",
      registrationNo: "PV-00234591",
      email: "techcorp@example.com",
      phone: "0719876543",
      address: "Level 12, World Trade Center, Colombo 01",
      membershipTypeId: typeCorpPrem._id,
      status: APPLICATION_STATUS.APPROVED,
      reviewedBy: chairman._id,
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await app2.save();

    const mem2 = new Membership({
      userId: member2._id,
      applicationId: app2._id,
      membershipNumber: "YV-2026-000002",
      membershipTypeId: typeCorpPrem._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 363 * 24 * 60 * 60 * 1000)
    });
    await mem2.save();

    // App 3: Anura Silva (PENDING)
    const app3 = new MemberApplication({
      userId: member3._id,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      fullName: "Anura Silva",
      nic: "199278901234",
      email: "anura.silva@example.com",
      phone: "0777654321",
      address: "12/A, Galle Road, Mount Lavinia",
      membershipTypeId: typeIndivLife._id,
      status: APPLICATION_STATUS.PENDING
    });
    await app3.save();

    // App 4: Nimal Fernando (REJECTED)
    const app4 = new MemberApplication({
      userId: member4._id,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      fullName: "Nimal Fernando",
      nic: "197890123456",
      email: "nimal.fernando@example.com",
      phone: "0751122334",
      address: "88, Kandy Road, Kiribathgoda",
      membershipTypeId: typeIndivStd._id,
      status: APPLICATION_STATUS.REJECTED,
      rejectionReason: "NIC number does not match submitted address proof documents. Please correct and re-apply.",
      reviewedBy: reviewerUser._id,
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
    await app4.save();
    console.log("✓ Seeded sample Applications & active Memberships");

    // 7. Seed Initial Audit Logs (F-13)
    const initialLogs = [
      {
        actorUserId: chairman._id,
        action: AUDIT_ACTIONS.ROLE_CREATED,
        entityType: AUDIT_ENTITY_TYPES.OFFICER_ROLE,
        entityId: reviewerRole._id.toString(),
        details: { roleName: "Membership Reviewer", permissions: reviewerRole.permissions },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        actorUserId: chairman._id,
        action: AUDIT_ACTIONS.ROLE_ASSIGNED,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: reviewerUser._id.toString(),
        details: { userEmail: reviewerUser.email, assignedRole: reviewerRole.name },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        actorUserId: reviewerUser._id,
        action: AUDIT_ACTIONS.APPLICATION_APPROVED,
        entityType: AUDIT_ENTITY_TYPES.APPLICATION,
        entityId: app1._id.toString(),
        details: { applicantName: app1.fullName, membershipNumber: "YV-2026-000001", annualFee: 15000 },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        actorUserId: reviewerUser._id,
        action: AUDIT_ACTIONS.APPLICATION_REJECTED,
        entityType: AUDIT_ENTITY_TYPES.APPLICATION,
        entityId: app4._id.toString(),
        details: { applicantName: app4.fullName, rejectionReason: app4.rejectionReason },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    await AuditLog.insertMany(initialLogs);
    console.log("✓ Seeded initial Audit Log history (F-13)");

    console.log("==================================================");
    console.log(" Database Seeding Complete!");
    console.log(" Test Credentials:");
    console.log(" Chairman: chairman@yarlventures.com / Chairman@2026");
    console.log(" Review Officer: reviewer@yarlventures.com / Officer@2026");
    console.log(" Auditor Officer: auditor@yarlventures.com / Officer@2026");
    console.log(" Approved Member: kamal.perera@example.com / Member@2026");
    console.log(" Pending Member: anura.silva@example.com / Member@2026");
    console.log(" Rejected Member: nimal.fernando@example.com / Member@2026");
    console.log("==================================================");

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedDatabase();