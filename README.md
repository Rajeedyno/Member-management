# Member Management System (Mini)
> Professional Association Management Platform with Strict Role-Based Access Control (RBAC), Permission Enforcement, and Comprehensive Audit Trails.

Developed for **Yarl Ventures (PVT) Ltd.** Technical Assessment (MERN Stack).

---

## 🌟 Overview & Highlights

The **Member Management System (Mini)** is a production-grade full-stack web application designed for a professional association to manage its member applications, role hierarchies, active memberships, and audit trails.

- **Highest Weight Feature (F-12)**: Fine-grained backend permission middleware returning HTTP 403 when permissions are missing, coupled with dynamic UI authorization that hides unauthorized actions.
- **Single Highest Authority (Chairman)**: The Chairman holds supreme authority, bypasses individual permission key checks, and is the sole entity allowed to create roles, update permissions, and assign roles.
- **Dynamic Officer Roles**: Permissions are stored in the database (not hardcoded) and can be modified or assigned dynamically.
- **Application Lifecycle**: Handles full submission flow for **Individual** and **Company** applicants, status progression (`PENDING` &rarr; `APPROVED` with generated membership number like `YV-2026-000001`, or `REJECTED` with mandatory reason and resubmission).
- **Audit Logging (F-13)**: Immutable record of who did what, when, and from which IP address for all critical actions.
- **Zero-Configuration Setup**: Supports external MongoDB URIs or automatically starts an embedded in-memory MongoDB instance for instant execution on any developer or evaluator machine.
- **Modern Green Theme**: Designed with an Emerald / Forest Green corporate aesthetic using React, Tailwind CSS, and Lucide icons.

---

## 👥 User Roles & Permission Model (Section 6.1 & Section 8)

| Actor | Description | Authorization Mechanism |
| :--- | :--- | :--- |
| **👑 Chairman** | Single highest authority. Full access to everything. Created via seed script. | Bypasses all permission key checks (`BR-05`). Sole authority for role creation & assignment (`BR-08`). |
| **🛡️ Officer** | Staff user assigned to an Officer Role. | Strictly restricted to effective permissions granted in their assigned `OfficerRole` (`BR-06`, `BR-07`). |
| **👤 Member** | Individual person or Company entity. | Applies for membership, views own status, and views active membership credentials (`BR-11`). |
| **🌐 Visitor** | Unauthenticated guest. | Allowed to register and log in only. |

### Exact Permission Keys (Section 6.1)
- `member.view`: View member list and member details
- `application.view`: View membership applications list and details
- `application.approve`: Approve a pending application and issue unique membership number
- `application.reject`: Reject a pending application with recorded reason
- `role.manage`: Create Officer Roles, change permissions, assign roles (Chairman authority)
- `audit.view`: View system audit logs and action history

---

## 🔑 Test Credentials (Pre-seeded Accounts)

You can use the **1-Click Quick Fill** buttons on the Login page or use the credentials below:

| Role | Email | Password | Granted Permissions / Capabilities |
| :--- | :--- | :--- | :--- |
| **Chairman** | `chairman@yarlventures.com` | `Chairman@2026` | Full System Access (All permissions + Role Management) |
| **Review Officer** | `reviewer@yarlventures.com` | `Officer@2026` | `application.view`, `application.approve`, `application.reject`, `member.view` |
| **Auditor Officer** | `auditor@yarlventures.com` | `Officer@2026` | `audit.view`, `member.view` (Blocked from approving/rejecting) |
| **Approved Member** | `kamal.perera@example.com` | `Member@2026` | Active Member (Card: `YV-2026-000001`) |
| **Pending Member** | `anura.silva@example.com` | `Member@2026` | Application status `PENDING` |
| **Rejected Member** | `nimal.fernando@example.com` | `Member@2026` | Application status `REJECTED` (Displays reason & resubmit form) |

---

## 🚀 Quick Start (Local Run)

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Install Dependencies
From the project root:
```bash
npm run install:all
```
*(Or `npm install` inside `backend/` and `frontend/` respectively)*

### 2. Seed Database
Seeds the Chairman account, permission catalog, 3 membership tiers, sample roles, applications, and members:
```bash
npm run seed
```

### 3. Start Backend & Frontend
Run the development servers:
```bash
# Start Backend (Port 5000)
npm run server

# In a separate terminal, start Frontend (Port 5173)
npm run client
```
- Frontend Web App: **http://localhost:5173**
- Backend Health API: **http://localhost:5000/api/health**

### 4. Run Automated Unit Tests (Bonus)
Runs Jest test suite for permission middleware and authentication:
```bash
npm test
```

---

## 🗄️ Database Model (Mongoose Collections)

1. **`users`**: `fullName`, `email` (unique), `passwordHash` (hidden in responses), `userType` (`CHAIRMAN` | `OFFICER` | `MEMBER`), `applicantType` (`INDIVIDUAL` | `COMPANY`), `officerRoleId` (ref `OfficerRole`), `isActive`, timestamps.
2. **`officerRoles`**: `name` (unique), `description`, `permissions` (array of permission keys), `createdBy` (ref `User`), timestamps.
3. **`memberApplications`**: `userId` (ref `User`), `applicantType` (`INDIVIDUAL` | `COMPANY`), `fullName` or `companyName`, `nic` or `registrationNo`, `email`, `phone` (Sri Lankan format), `address`, `membershipTypeId` (ref `MembershipType`), `status` (`PENDING` | `APPROVED` | `REJECTED`), `rejectionReason`, `reviewedBy`, `reviewedAt`, timestamps.
4. **`memberships`**: `userId` (ref `User`), `applicationId` (ref `MemberApplication`), `membershipNumber` (unique, indexed, e.g. `YV-2026-000001`), `membershipTypeId`, `status` (`ACTIVE` | `EXPIRED`), `startDate`, `endDate`, timestamps.
5. **`membershipTypes`**: `name`, `applicableTo` (`INDIVIDUAL` | `COMPANY`), `annualFee` (in LKR), `isActive`, timestamps.
6. **`auditLogs`**: `actorUserId` (ref `User`), `action`, `entityType`, `entityId`, `details`, `ipAddress`, `createdAt`.

---

## 📡 API Endpoints Matrix

### Authentication
- `POST /api/auth/register` - Create member account (F-01)
- `POST /api/auth/login` - Authenticate & return JWT + effective permissions (F-02)
- `GET /api/auth/me` - Get current profile and effective permissions (F-03)
- `POST /api/auth/logout` - Clear token session (F-02)

### Membership Applications
- `POST /api/applications` - Submit membership application (F-04)
- `GET /api/applications/my` - View own application status & active membership (F-05)
- `GET /api/applications` - List applications with filters and pagination (F-06, requires `application.view`)
- `GET /api/applications/:id` - Get application details by ID
- `PATCH /api/applications/:id/approve` - Approve application and generate membership number (F-07, requires `application.approve`)
- `PATCH /api/applications/:id/reject` - Reject application with reason (F-08, requires `application.reject`)

### Member Directory
- `GET /api/members` - List members with search, status filter, pagination (F-09, requires `member.view`)
- `GET /api/members/my-membership` - Get own active membership pass
- `GET /api/members/stats` - Dashboard metric counts (Bonus)
- `GET /api/members/export` - Export member directory as CSV (Bonus, requires `member.view`)

### Officer Roles & Governance (Chairman Only)
- `POST /api/officer-roles` - Create Officer Role with ticked permissions (F-10, Chairman only)
- `GET /api/officer-roles` - List all defined roles
- `PUT /api/officer-roles/:id/permissions` - Update role permissions (F-10, Chairman only)
- `POST /api/officer-roles/assign` - Assign or revoke role for a user (F-11, Chairman only)
- `GET /api/officer-roles/users` - List users eligible for role assignment

### Permissions & System
- `GET /api/permissions` - List available permission keys & descriptions
- `GET /api/membership-types` - List active membership types and fees
- `GET /api/audit-logs` - View audit trail records (F-13, requires `audit.view`)
- `GET /api/health` - API health check

---

## 🛡️ Business Rules Compliance Matrix

- **BR-01 (Applicant Types)**: Visitors choose Individual vs Company during registration & application. Form fields adjust accordingly (NIC vs Business Reg No).
- **BR-02 (No Auto-Approval)**: Membership starts as `PENDING` and becomes active only upon explicit staff approval.
- **BR-03 (Single Pending Rule)**: Backend prevents a user from holding more than one `PENDING` application simultaneously (returns HTTP 409 Conflict).
- **BR-04 (Resubmission)**: Rejected applicants can correct and resubmit their application while preserving historical submission logs.
- **BR-05 (Chairman Full Access)**: Chairman bypasses all permission key checks automatically.
- **BR-06 (Officer Permissions)**: Officers receive access strictly based on the permission keys in their assigned `OfficerRole`.
- **BR-07 (No Default Full Access)**: Officer roles never receive full access automatically.
- **BR-08 (Chairman Exclusivity)**: Only the Chairman can create roles, change permissions, and assign roles.
- **BR-09 (Audit Logging)**: All approvals, rejections, permission modifications, and role assignments write to `auditLogs`.
- **BR-10 (Unique Membership Number)**: Sequential unique membership number generated in the format `YV-2026-000123`.
- **BR-11 (Data Privacy)**: Members can only access their own applications and memberships.
- **BR-12 (Server-Side Enforcement)**: Every route is protected by backend middleware; missing permissions strictly return HTTP 403.

---

## 🎁 Bonus Features Included
1. **Permission Middleware Unit Tests**: Full Jest/Supertest suite verifying 403 Forbidden, Chairman bypass, and role resolution.
2. **Export Member List as CSV**: Streamed CSV export of the member registry.
3. **Dashboard Summary Counts**: Real-time counters for pending applications, total members, active members, and approvals this month.
4. **Interactive 1-Click Demo Logins**: Instant credential autofill for all roles on the login page.

---
© 2026 Yarl Ventures (PVT) Ltd. All rights reserved.