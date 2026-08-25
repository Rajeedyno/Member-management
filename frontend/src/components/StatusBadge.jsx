import React from "react";
import { CheckCircle2, Clock, XCircle, ShieldCheck, AlertTriangle } from "lucide-react";

export const StatusBadge = ({ status, size = "md" }) => {
  const normalized = (status || "").toUpperCase();

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  switch (normalized) {
    case "APPROVED":
    case "ACTIVE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {normalized}
        </span>
      );
    case "PENDING":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          {normalized}
        </span>
      );
    case "REJECTED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          {normalized}
        </span>
      );
    case "EXPIRED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
          {normalized}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

export default StatusBadge;