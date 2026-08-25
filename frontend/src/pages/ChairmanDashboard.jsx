import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import {
  Shield,
  KeyRound,
  UserCheck,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  ShieldAlert,
  Info,
  Check,
  Search
} from "lucide-react";

export const ChairmanDashboard = () => {
  const { isChairman } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeSubTab, setActiveSubTab] = useState("roles"); // "roles" or "users"
  const [loading, setLoading] = useState(true);

  // Officer Roles State (F-10)
  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);

  // Users State (F-11)
  const [staffUsers, setStaffUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  // Create/Edit Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // null if creating, role object if editing
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [savingRole, setSavingRole] = useState(false);

  // Assign Role Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState(null);
  const [selectedRoleIdToAssign, setSelectedRoleIdToAssign] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isChairman) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        api.get("/officer-roles"),
        api.get("/permissions"),
        api.get("/officer-roles/users")
      ]);

      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (permsRes.success && permsRes.data) setPermissionsList(permsRes.data);
      if (usersRes.success && usersRes.data) setStaffUsers(usersRes.data);
    } catch (err) {
      toastError(err.message || "Failed to load governance data");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create Role Modal
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDesc("");
    setSelectedPermissions([]);
    setIsRoleModalOpen(true);
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setSelectedPermissions(role.permissions || []);
    setIsRoleModalOpen(true);
  };

  // Toggle permission key in checklist
  const togglePermissionKey = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Save Role (Create or Update Permissions)
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!editingRole && (!roleName.trim() || roleName.trim().length < 3)) {
      toastError("Role name must be at least 3 characters");
      return;
    }

    try {
      setSavingRole(true);
      if (editingRole) {
        // Update permissions (PUT /api/officer-roles/:id/permissions)
        const res = await api.put(`/officer-roles/${editingRole._id}/permissions`, {
          permissions: selectedPermissions
        });
        if (res.success) {
          success(`Permissions for "${editingRole.name}" updated successfully!`);
          setIsRoleModalOpen(false);
          fetchData();
        }
      } else {
        // Create new role (POST /api/officer-roles)
        const res = await api.post("/officer-roles", {
          name: roleName.trim(),
          description: roleDesc.trim(),
          permissions: selectedPermissions
        });
        if (res.success) {
          success(`Officer Role "${res.data.name}" created successfully!`);
          setIsRoleModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toastError(err.message || "Failed to save Officer Role");
    } finally {
      setSavingRole(false);
    }
  };

  // Open Assign Role Modal
  const handleOpenAssignModal = (user) => {
    setSelectedUserForAssignment(user);
    setSelectedRoleIdToAssign(user.officerRoleId?._id || "");
    setIsAssignModalOpen(true);
  };

  // Submit Role Assignment (F-11)
  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedUserForAssignment) return;

    try {
      setAssigning(true);
      const res = await api.post("/officer-roles/assign", {
        userId: selectedUserForAssignment._id,
        officerRoleId: selectedRoleIdToAssign || null
      });

      if (res.success) {
        success(res.message || "Role assignment updated successfully");
        setIsAssignModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toastError(err.message || "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  if (!isChairman) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Chairman Authority Required (BR-08)</h2>
        <p className="text-sm text-slate-600 mt-2">
          Only the Chairman holds the top authority to create roles, modify permission sets, and assign officer roles.
        </p>
      </div>
    );
  }

  const filteredUsers = staffUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Chairman Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
                Chairman Authority (BR-05, BR-08)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Officer Roles & Access Governance
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
              Define discrete Officer Roles, select exact permission keys, and assign roles to system operators. Permissions are dynamically resolved on every backend request.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/40 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-500/30">
            <button
              type="button"
              onClick={() => setActiveSubTab("roles")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "roles" ? "bg-emerald-600 text-white shadow" : "text-emerald-200 hover:text-white"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Officer Roles (F-10)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("users")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "users" ? "bg-emerald-600 text-white shadow" : "text-emerald-200 hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Assign Roles (F-11)
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: OFFICER ROLES & PERMISSIONS CHECKLIST (F-10) */}
      {activeSubTab === "roles" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Defined Officer Roles ({roles.length})</h2>
              <p className="text-xs text-slate-500">Each role holds a specific combination of stored permission keys.</p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateRole}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Officer Role (F-10)
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading roles...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div
                  key={role._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {role.assignedUserCount || 0} users assigned
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{role.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{role.description || "No description provided."}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                        Granted Permission Keys ({role.permissions?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map((permKey) => (
                            <span
                              key={permKey}
                              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              {permKey}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRole(role)}
                      className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Permissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ASSIGN ROLES TO USERS (F-11) */}
      {activeSubTab === "users" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Account Role Assignment (F-11)</h2>
              <p className="text-xs text-slate-500">Assign created Officer Roles or revoke staff privileges.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Filter by name or email..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">User Type</th>
                  <th className="py-3.5 px-4">Assigned Officer Role</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => {
                  const isUserChairman = u.userType === "CHAIRMAN";
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {u.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isUserChairman
                              ? "bg-amber-100 text-amber-800"
                              : u.userType === "OFFICER"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.userType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {isUserChairman ? (
                          <span className="text-amber-800 font-bold">Supreme Authority</span>
                        ) : u.officerRoleId ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                            {u.officerRoleId.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None (Regular Member)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isUserChairman ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(u)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border transition-colors"
                          >
                            Change Role
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ROLE MODAL (F-10) */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? `Edit Permissions for "${editingRole.name}"` : "Create Officer Role (F-10)"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-5">
          {!editingRole && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Senior Applications Reviewer"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Role Description
                </label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="e.g. Evaluates submitted corporate and individual applications"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* Tickable Permissions Checklist (F-10, Section 6.1) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Tick Permission Keys for this Role (F-10)
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {selectedPermissions.length} of {permissionsList.length} selected
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {permissionsList.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => togglePermissionKey(perm.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                        isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold">{perm.name}</span>
                        <code className="text-[10px] font-mono bg-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded">
                          {perm.key}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingRole}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingRole && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingRole ? "Save Permissions" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN ROLE MODAL (F-11) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Officer Role (F-11)"
        maxWidth="max-w-md"
      >
        {selectedUserForAssignment && (
          <form onSubmit={handleAssignRole} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Target User</p>
              <p className="font-bold text-slate-900 text-sm">{selectedUserForAssignment.fullName}</p>
              <p className="text-slate-500">{selectedUserForAssignment.email}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Officer Role
              </label>
              <select
                value={selectedRoleIdToAssign}
                onChange={(e) => setSelectedRoleIdToAssign(e.target.value)}
                aria-label="Select officer role to assign"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No Role (Revoke Privileges & Revert to Member) --</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.permissions?.length || 0} permissions)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {assigning && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm Role Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ChairmanDashboard;