import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  History,
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Code,
  Globe,
  User,
  Clock
} from "lucide-react";

export const AuditLogsPage = () => {
  const { isChairman, hasPermission } = useAuth();
  const { error: toastError } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!isChairman && !hasPermission("audit.view")) { setLoading(false); return; }
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15
      };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.get("/audit-logs", { params });
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toastError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, isChairman, hasPermission, toastError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColorBadge = (action) => {
    switch (action) {
      case "APPLICATION_APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "APPLICATION_REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "ROLE_CREATED":
      case "ROLE_PERMISSIONS_UPDATED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ROLE_ASSIGNED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              System & Governance (F-13)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            System Audit Log Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable timeline of critical events: approvals, rejections, permission updates, and role assignments.
          </p>
        </div>

        {/* Filter Selectors */}
        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter audit logs by action type"
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Action Types</option>
            <option value="APPLICATION_APPROVED">Application Approved</option>
            <option value="APPLICATION_REJECTED">Application Rejected</option>
            <option value="ROLE_CREATED">Role Created</option>
            <option value="ROLE_PERMISSIONS_UPDATED">Permissions Updated</option>
            <option value="ROLE_ASSIGNED">Role Assigned</option>
            <option value="APPLICATION_SUBMITTED">Application Submitted</option>
            <option value="USER_REGISTERED">User Registered</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No audit records found matching your filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {log.actorUserId?.fullName || "System / Guest"}
                          </div>
                          <div className="text-[11px] text-slate-400">{log.actorUserId?.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getActionColorBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{log.entityType}</span>
                          <div className="text-[10px] text-slate-400 font-mono">{log.entityId}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {log.ipAddress}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-900 text-emerald-300">
                          <td colSpan="6" className="p-4 font-mono text-xs">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                              Payload Details:
                            </p>
                            <pre className="overflow-x-auto bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                              {JSON.stringify(log.details || {}, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;