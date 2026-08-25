const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const OfficerRole = require("../src/models/OfficerRole");
const MembershipType = require("../src/models/MembershipType");
const MemberApplication = require("../src/models/MemberApplication");
const Membership = require("../src/models/Membership");
const AuditLog = require("../src/models/AuditLog");
const { USER_TYPES, APPLICANT_TYPES, APPLICATION_STATUS, MEMBERSHIP_STATUS } = require("../src/constants/roles");
const { PERMISSION_KEYS } = require("../src/constants/permissions");
const bcrypt = require("bcryptjs");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    OfficerRole.deleteMany({}),
    MembershipType.deleteMany({}),
    MemberApplication.deleteMany({}),
    Membership.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
});

describe("Authentication & Permission Enforcement (F-12)", () => {
  let chairmanToken, reviewerToken, auditorToken, memberToken;
  let testMembershipType, testApplication;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash("Password@123", 10);

    // Seed Membership Type
    testMembershipType = await MembershipType.create({
      name: "Individual Standard",
      applicableTo: APPLICANT_TYPES.INDIVIDUAL,
      annualFee: 15000,
      isActive: true
    });

    // Seed Chairman
    const chairman = await User.create({
      fullName: "Dr. Chairman",
      email: "chairman@test.com",
      passwordHash,
      userType: USER_TYPES.CHAIRMAN,
      isActive: true
    });

    // Seed Officer Roles
    const reviewerRole = await OfficerRole.create({
      name: "Reviewer",
      permissions: [PERMISSION_KEYS.APPLICATION_VIEW, PERMISSION_KEYS.APPLICATION_APPROVE, PERMISSION_KEYS.APPLICATION_REJECT, PERMISSION_KEYS.MEMBER_VIEW],
      createdBy: chairman._id
    });

    const auditorRole = await OfficerRole.create({
      name: "Auditor",
      permissions: [PERMISSION_KEYS.AUDIT_VIEW, PERMISSION_KEYS.MEMBER_VIEW],
      createdBy: chairman._id
    });

    // Seed Officers
    const reviewer = await User.create({
      fullName: "Officer Reviewer",
      email: "reviewer@test.com",
      passwordHash,
      userType: USER_TYPES.OFFICER,
      officerRoleId: reviewerRole._id,
      isActive: true
    });

    const auditor = await User.create({
      fullName: "Officer Auditor",
      email: "auditor@test.com",
      passwordHash,
      userType: USER_TYPES.OFFICER,
      officerRoleId: auditorRole._id,
      isActive: true
    });

    // Seed Member
    const member = await User.create({
      fullName: "Regular Member",
      email: "member@test.com",
      passwordHash,
      userType: USER_TYPES.MEMBER,
      isActive: true
    });

    // Seed Pending Application
    testApplication = await MemberApplication.create({
      userId: member._id,
      applicantType: APPLICANT_TYPES.INDIVIDUAL,
      fullName: "Regular Member",
      nic: "199012345678",
      email: "member@test.com",
      phone: "0771234567",
      address: "123 Test Street",
      membershipTypeId: testMembershipType._id,
      status: APPLICATION_STATUS.PENDING
    });

    // Login each user to get tokens
    const chairmanLogin = await request(app).post("/api/auth/login").send({
      email: "chairman@test.com",
      password: "Password@123"
    });
    chairmanToken = chairmanLogin.body.data.token;

    const reviewerLogin = await request(app).post("/api/auth/login").send({
      email: "reviewer@test.com",
      password: "Password@123"
    });
    reviewerToken = reviewerLogin.body.data.token;

    const auditorLogin = await request(app).post("/api/auth/login").send({
      email: "auditor@test.com",
      password: "Password@123"
    });
    auditorToken = auditorLogin.body.data.token;

    const memberLogin = await request(app).post("/api/auth/login").send({
      email: "member@test.com",
      password: "Password@123"
    });
    memberToken = memberLogin.body.data.token;
  });

  test("F-01 & F-02: Member registration and login issuing JWT", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "New Applicant",
      email: "newapplicant@test.com",
      password: "Applicant@123",
      applicantType: "INDIVIDUAL"
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("newapplicant@test.com");
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never return password hash!
  });

  test("F-12: Chairman bypasses all permission checks", async () => {
    // Chairman accessing application list
    const resAppList = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${chairmanToken}`);
    expect(resAppList.status).toBe(200);
    expect(resAppList.body.success).toBe(true);

    // Chairman accessing audit logs
    const resAudit = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${chairmanToken}`);
    expect(resAudit.status).toBe(200);
    expect(resAudit.body.success).toBe(true);
  });

  test("F-12: Officer with application.approve CAN approve pending application (F-07)", async () => {
    const res = await request(app)
      .patch(`/api/applications/${testApplication._id}/approve`)
      .set("Authorization", `Bearer ${reviewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.application.status).toBe(APPLICATION_STATUS.APPROVED);
    expect(res.body.data.membership.membershipNumber).toMatch(/^YV-\d{4}-\d{6}$/);

    // Check audit log was created (F-13)
    const auditLogs = await AuditLog.find({ entityId: testApplication._id.toString() });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs[0].action).toBe("APPLICATION_APPROVED");
  });

  test("F-12: Officer WITHOUT application.approve returns 403 Forbidden on approve", async () => {
    const res = await request(app)
      .patch(`/api/applications/${testApplication._id}/approve`)
      .set("Authorization", `Bearer ${auditorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("F-12: Member cannot view all applications or audit logs (returns 403 Forbidden)", async () => {
    const resApp = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(resApp.status).toBe(403);

    const resAudit = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(resAudit.status).toBe(403);
  });

  test("BR-03: Member cannot submit duplicate pending applications", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        applicantType: "INDIVIDUAL",
        fullName: "Regular Member",
        nic: "199012345678",
        email: "member@test.com",
        phone: "0771234567",
        address: "123 Test Street",
        membershipTypeId: testMembershipType._id.toString()
      });

    expect(res.status).toBe(409); // Conflict: already holds a pending application
    expect(res.body.success).toBe(false);
  });

  test("F-08 & F-12: Rejecting application requires reason and returns updated status", async () => {
    const res = await request(app)
      .patch(`/api/applications/${testApplication._id}/reject`)
      .set("Authorization", `Bearer ${reviewerToken}`)
      .send({
        reason: "Invalid NIC number submitted"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(APPLICATION_STATUS.REJECTED);
    expect(res.body.data.rejectionReason).toBe("Invalid NIC number submitted");
  });

  test("BR-08: Only Chairman can create officer roles and assign roles", async () => {
    // Non-chairman attempt
    const resNonChairman = await request(app)
      .post("/api/officer-roles")
      .set("Authorization", `Bearer ${reviewerToken}`)
      .send({
        name: "Unauthorized Role",
        permissions: [PERMISSION_KEYS.MEMBER_VIEW]
      });
    expect(resNonChairman.status).toBe(403);

    // Chairman attempt
    const resChairman = await request(app)
      .post("/api/officer-roles")
      .set("Authorization", `Bearer ${chairmanToken}`)
      .send({
        name: "Finance Manager",
        description: "Manages financial auditing",
        permissions: [PERMISSION_KEYS.MEMBER_VIEW, PERMISSION_KEYS.AUDIT_VIEW]
      });
    expect(resChairman.status).toBe(201);
    expect(resChairman.body.data.name).toBe("Finance Manager");
  });
});