import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Building2,
  Lock
} from "lucide-react";

export const ProfilePage = () => {
  const { user, effectivePermissions, isChairman, isOfficer, isMember } = useAuth();
  const [allPermissions, setAllPermissions] = useState([]);

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const res = await api.get("/permissions");
        if (res.success && res.data) {
          setAllPermissions(res.data);
        }
      } catch (e) {}
    };
    fetchPerms();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          User Account (F-03)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Profile & Effective Permissions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          View your authenticated account details and active authorization capabilities.
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-800/20 shrink-0">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isChairman
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : isOfficer
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-slate-100 text-slate-800 border border-slate-300"
                }`}
              >
                {isChairman ? "👑 Chairman" : isOfficer ? `🛡️ ${user?.officerRoleId?.name || "Officer"}` : "👤 Member"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {user?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-slate-400 uppercase font-bold text-[10px]">Applicant / Entity Type</p>
            <p className="font-bold text-slate-900 mt-0.5">{user?.applicantType || "INDIVIDUAL"}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-slate-400 uppercase font-bold text-[10px]">Account Status</p>
            <p className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-slate-400 uppercase font-bold text-[10px]">Assigned Role ID</p>
            <p className="font-mono text-slate-700 mt-0.5 truncate">
              {user?.officerRoleId?._id || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Effective Permissions Grid (F-03, F-12) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Effective Permission Matrix (F-03)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isChairman
              ? "As Chairman, you hold supreme authority and bypass all individual permission keys."
              : "Permissions inherited from your assigned Officer Role."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {allPermissions.map((perm) => {
            const hasThisPerm = isChairman || (effectivePermissions && effectivePermissions.includes(perm.key));
            return (
              <div
                key={perm.key}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  hasThisPerm
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                    : "bg-slate-50/60 border-slate-200 text-slate-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    hasThisPerm ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {hasThisPerm ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${hasThisPerm ? "text-slate-900" : "text-slate-500"}`}>
                      {perm.name}
                    </p>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        hasThisPerm ? "bg-emerald-200/80 text-emerald-900 font-bold" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {perm.key}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;