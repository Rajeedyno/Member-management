import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import StatsCard from "../components/StatsCard";
import ConfirmModal from "../components/ConfirmModal";
import RejectModal from "../components/RejectModal";
import Modal from "../components/Modal";
import PermissionGate from "../components/PermissionGate";
import {
  Users,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

export const StaffDashboard = () => {
  const { user, isChairman, hasPermission } = useAuth();
  const { success, error: toastError } = useToast();

  const canViewApplications = isChairman || hasPermission("application.view");
  const canViewMembers = isChairman || hasPermission("member.view");
  const [activeTab, setActiveTab] = useState(canViewApplications ? "applications" : "members");

  useEffect(() => {
    if (!canViewApplications && canViewMembers) {
      setActiveTab("members");
    } else if (canViewApplications && !canViewMembers) {
      setActiveTab("applications");
    }
  }, [canViewApplications, canViewMembers]);

  // Summary Metrics
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingApplications: 0,
    approvedThisMonth: 0,
    totalApplications: 0
  });

  // Applications State
  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState("PENDING");
  const [appTypeFilter, setAppTypeFilter] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [appPage, setAppPage] = useState(1);
  const [appPagination, setAppPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Members State
  const [members, setMembers] = useState([]);
  const [memLoading, setMemLoading] = useState(false);
  const [memStatusFilter, setMemStatusFilter] = useState("");
  const [memSearch, setMemSearch] = useState("");
  const [memPage, setMemPage] = useState(1);
  const [memPagination, setMemPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/members/stats");
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.warn("Stats fetch failed:", e.message);
    }
  }, []);

  // Fetch Applications (F-06)
  const fetchApplications = useCallback(async () => {
    if (!isChairman && !hasPermission("application.view")) return;
    try {
      setAppLoading(true);
      const params = {
        page: appPage,
        limit: 10
      };
      if (appStatusFilter && appStatusFilter !== "ALL") params.status = appStatusFilter;
      if (appTypeFilter) params.applicantType = appTypeFilter;
      if (appSearch.trim()) params.search = appSearch.trim();

      const res = await api.get("/applications", { params });
      if (res.success && res.data) {
        setApplications(res.data.applications || []);
        setAppPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toastError(err.message || "Failed to fetch applications");
    } finally {
      setAppLoading(false);
    }
  }, [appPage, appStatusFilter, appTypeFilter, appSearch, isChairman, hasPermission, toastError]);

  // Fetch Members (F-09)
  const fetchMembers = useCallback(async () => {
    if (!isChairman && !hasPermission("member.view")) return;
    try {
      setMemLoading(true);
      const params = {
        page: memPage,
        limit: 10
      };
      if (memStatusFilter && memStatusFilter !== "ALL") params.status = memStatusFilter;
      if (memSearch.trim()) params.search = memSearch.trim();

      const res = await api.get("/members", { params });
      if (res.success && res.data) {
        setMembers(res.data.members || []);
        setMemPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toastError(err.message || "Failed to fetch members directory");
    } finally {
      setMemLoading(false);
    }
  }, [memPage, memStatusFilter, memSearch, isChairman, hasPermission, toastError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else {
      fetchMembers();
    }
  }, [activeTab, fetchApplications, fetchMembers]);

  // Approve Application Handler (F-07, F-12)
  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/applications/${selectedApp._id}/approve`);
      if (res.success) {
        success(`Application approved! Membership #${res.data.membership?.membershipNumber} generated.`);
        setIsApproveOpen(false);
        setIsDetailsOpen(false);
        fetchApplications();
        fetchStats();
      }
    } catch (err) {
      toastError(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Application Handler (F-08, F-12)
  const handleReject = async (reason) => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/applications/${selectedApp._id}/reject`, { reason });
      if (res.success) {
        success("Application rejected and reason saved with record.");
        setIsRejectOpen(false);
        setIsDetailsOpen(false);
        fetchApplications();
        fetchStats();
      }
    } catch (err) {
      toastError(err.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV Handler (Bonus)
  const handleExportCsv = () => {
    const token = localStorage.getItem("token");
    window.open(`/api/members/export?token=${token}`, "_blank");
    success("CSV export initiated.");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Staff Operations Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Application Review & Member Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluate incoming membership submissions and manage the active association register.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl">
          {canViewApplications && (
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "applications"
                ? "bg-white text-emerald-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            Applications ({stats.pendingApplications} Pending)
          </button>
          )}

          {(isChairman || hasPermission("member.view")) && (
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "members"
                  ? "bg-white text-emerald-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Member Directory ({stats.totalMembers})
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards (Bonus counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingApplications}
          icon={Clock}
          description="Awaiting staff approval (F-06)"
        />
        <StatsCard
          title="Active Members"
          value={stats.activeMembers}
          icon={ShieldCheck}
          description="Currently registered"
        />
        <StatsCard
          title="Approved This Month"
          value={stats.approvedThisMonth}
          icon={Award}
          description="New memberships issued"
        />
        <StatsCard
          title="Total Applications"
          value={stats.totalApplications}
          icon={FileText}
          description="Lifetime submissions"
        />
      </div>

      {/* TAB 1: APPLICATIONS LIST (F-06, F-07, F-08) */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => {
                  setAppSearch(e.target.value);
                  setAppPage(1);
                }}
                placeholder="Search by name, company, email, phone, NIC or Reg No..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setAppStatusFilter(status);
                    setAppPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    appStatusFilter === status
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Applicant Type Filter */}
            <select
              value={appTypeFilter}
              onChange={(e) => {
                setAppTypeFilter(e.target.value);
                setAppPage(1);
              }}
              aria-label="Filter applications by applicant type"
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Type & ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Tier</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions (F-12)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {app.fullName || app.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400">{app.address}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{app.applicantType}</span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {app.nic || app.registrationNo}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{app.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{app.phone}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {app.membershipTypeId?.name}
                        <div className="text-[11px] text-emerald-700">
                          LKR {app.membershipTypeId?.annualFee?.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {app.status === "PENDING" && (
                            <>
                              {/* Approve Button (F-12: hidden if no application.approve permission) */}
                              {(isChairman || hasPermission("application.approve")) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setIsApproveOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                                  title="Approve Application"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                              )}

                              {/* Reject Button (F-12: hidden if no application.reject permission) */}
                              {(isChairman || hasPermission("application.reject")) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setIsRejectOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors"
                                  title="Reject Application"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {appPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span>
                Page <strong>{appPagination.page}</strong> of <strong>{appPagination.totalPages}</strong> ({appPagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={appPage <= 1}
                  onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={appPage >= appPagination.totalPages}
                  onClick={() => setAppPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBER DIRECTORY (F-09) */}
      {activeTab === "members" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memSearch}
                onChange={(e) => {
                  setMemSearch(e.target.value);
                  setMemPage(1);
                }}
                placeholder="Search member by name, email, or membership number (e.g. YV-2026-000001)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              {["ALL", "ACTIVE", "EXPIRED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setMemStatusFilter(st);
                    setMemPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    (memStatusFilter === st || (!memStatusFilter && st === "ALL"))
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
                title="Export member directory as CSV (Bonus)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Membership Number</th>
                  <th className="py-3.5 px-4">Member Name / Entity</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Membership Tier</th>
                  <th className="py-3.5 px-4">Validity Range</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {memLoading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading member directory...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  members.map((mem) => {
                    const app = mem.applicationId || {};
                    const name = app.fullName || app.companyName || mem.userId?.fullName || "N/A";
                    return (
                      <tr key={mem._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                          {mem.membershipNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{name}</div>
                          <div className="text-[11px] text-slate-400">{app.email || mem.userId?.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {app.applicantType || mem.userId?.applicantType}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{mem.membershipTypeId?.name}</span>
                          <div className="text-[11px] text-slate-500">
                            LKR {mem.membershipTypeId?.annualFee?.toLocaleString()} / yr
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {new Date(mem.startDate).toLocaleDateString()} &rarr; {new Date(mem.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={mem.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Members Pagination */}
          {memPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span>
                Page <strong>{memPagination.page}</strong> of <strong>{memPagination.totalPages}</strong> ({memPagination.total} total members)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={memPage <= 1}
                  onClick={() => setMemPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={memPage >= memPagination.totalPages}
                  onClick={() => setMemPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Membership Application Details">
        {selectedApp && (
          <div className="space-y-5 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Application Status</p>
                <div className="mt-1"><StatusBadge status={selectedApp.status} /></div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Submitted Date</p>
                <p className="font-mono font-semibold text-slate-900">{new Date(selectedApp.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Applicant Name / Company</p>
                <p className="font-bold text-sm text-slate-900">{selectedApp.fullName || selectedApp.companyName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Applicant Type</p>
                <p className="font-semibold text-slate-900">{selectedApp.applicantType}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">NIC / Reg Number</p>
                <p className="font-mono font-bold text-slate-900">{selectedApp.nic || selectedApp.registrationNo}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Membership Tier</p>
                <p className="font-semibold text-emerald-800">{selectedApp.membershipTypeId?.name} (LKR {selectedApp.membershipTypeId?.annualFee?.toLocaleString()})</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{selectedApp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold font-mono">{selectedApp.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{selectedApp.address}</span>
              </div>
            </div>

            {selectedApp.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <p className="font-bold uppercase tracking-wider text-[10px] text-rose-700">Rejection Reason</p>
                <p className="mt-0.5">{selectedApp.rejectionReason}</p>
              </div>
            )}

            {selectedApp.reviewedBy && (
              <div className="text-[11px] text-slate-400 border-t pt-2">
                Reviewed by: <strong>{selectedApp.reviewedBy?.fullName || "Staff"}</strong> on {new Date(selectedApp.reviewedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* APPROVE CONFIRMATION MODAL (F-07) */}
      <ConfirmModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
        title="Approve Membership Application (F-07)"
        message={`Are you sure you want to approve ${selectedApp?.fullName || selectedApp?.companyName}? This action will create an active membership and generate a unique membership number (e.g. YV-2026-000XXX).`}
        confirmText="Confirm Approval"
        confirmColor="emerald"
        loading={actionLoading}
      />

      {/* REJECT WITH REASON MODAL (F-08) */}
      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onReject={handleReject}
        applicantName={selectedApp?.fullName || selectedApp?.companyName}
        loading={actionLoading}
      />
    </div>
  );
};

export default StaffDashboard;