import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Users,
  FileText,
  KeyRound,
  History,
  User,
  LogOut,
  Sparkles,
  ChevronRight
} from "lucide-react";

export const Navbar = ({ activeTab, onTabChange }) => {
  const { user, isChairman, isOfficer, isMember, hasPermission, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  Yarl<span className="text-emerald-600">Ventures</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  MMS Mini
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Professional Association Member System</p>
            </div>
          </div>

          {/* Navigation Links (Permission-Aware F-12) */}
          <nav className="hidden md:flex items-center gap-1">
            {isMember && (
              <button
                onClick={() => onTabChange("member-dashboard")}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "member-dashboard"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-4 h-4" />
                My Application & Membership
              </button>
            )}

            {(isChairman || hasPermission("application.view") || hasPermission("member.view")) && (
              <button
                onClick={() => onTabChange("staff-dashboard")}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "staff-dashboard"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" />
                Staff Operations
              </button>
            )}

            {isChairman && (
              <button
                onClick={() => onTabChange("chairman-dashboard")}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "chairman-dashboard"
                    ? "bg-emerald-900 text-white font-bold shadow-sm shadow-emerald-900/30"
                    : "text-emerald-800 hover:bg-emerald-50 font-medium"
                }`}
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Chairman Governance
              </button>
            )}

            {(isChairman || hasPermission("audit.view")) && (
              <button
                onClick={() => onTabChange("audit-logs")}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "audit-logs"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <History className="w-4 h-4" />
                Audit Logs
              </button>
            )}
          </nav>

          {/* User Profile & Logout Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange("profile")}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all ${
                activeTab === "profile"
                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}
              title="View your profile and effective permissions"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">{user?.fullName}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                  isChairman
                    ? "bg-amber-100 text-amber-800"
                    : isOfficer
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {isChairman ? "Chairman" : isOfficer ? (user?.officerRoleId?.name || "Officer") : "Member"}
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center gap-1 pb-2.5 overflow-x-auto">
          {isMember && (
            <button
              onClick={() => onTabChange("member-dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === "member-dashboard" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              My Membership
            </button>
          )}
          {(isChairman || hasPermission("application.view") || hasPermission("member.view")) && (
            <button
              onClick={() => onTabChange("staff-dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === "staff-dashboard" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Staff Operations
            </button>
          )}
          {isChairman && (
            <button
              onClick={() => onTabChange("chairman-dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === "chairman-dashboard" ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Chairman Governance
            </button>
          )}
          {(isChairman || hasPermission("audit.view")) && (
            <button
              onClick={() => onTabChange("audit-logs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === "audit-logs" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Audit Logs
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;