const PERMISSION_KEYS = {
  MEMBER_VIEW: "member.view",
  APPLICATION_VIEW: "application.view",
  APPLICATION_APPROVE: "application.approve",
  APPLICATION_REJECT: "application.reject",
  ROLE_MANAGE: "role.manage",
  AUDIT_VIEW: "audit.view"
};

const PERMISSIONS_LIST = [
  {
    key: PERMISSION_KEYS.MEMBER_VIEW,
    name: "View Members",
    description: "View member list and member details",
    category: "Member Management"
  },
  {
    key: PERMISSION_KEYS.APPLICATION_VIEW,
    name: "View Applications",
    description: "View membership applications list and details",
    category: "Application Management"
  },
  {
    key: PERMISSION_KEYS.APPLICATION_APPROVE,
    name: "Approve Applications",
    description: "Approve a pending membership application and generate membership number",
    category: "Application Management"
  },
  {
    key: PERMISSION_KEYS.APPLICATION_REJECT,
    name: "Reject Applications",
    description: "Reject a pending membership application with a recorded reason",
    category: "Application Management"
  },
  {
    key: PERMISSION_KEYS.ROLE_MANAGE,
    name: "Manage Roles",
    description: "Create Officer Roles, change permissions, and assign roles",
    category: "Role Management"
  },
  {
    key: PERMISSION_KEYS.AUDIT_VIEW,
    name: "View Audit Logs",
    description: "View system audit logs and action history",
    category: "System & Governance"
  }
];

module.exports = {
  PERMISSION_KEYS,
  PERMISSIONS_LIST
};