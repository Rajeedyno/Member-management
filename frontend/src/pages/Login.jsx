import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Shield, Lock, Mail, ArrowRight, Sparkles, Check } from "lucide-react";

export const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim() || !password) {
      setFormError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      success("Welcome back! Successfully logged in.");
    } catch (err) {
      setFormError(err.message || "Invalid credentials");
      toastError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setFormError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-950/40">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Member Management System
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-emerald-400 font-medium">
          Yarl Ventures Professional Association
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl shadow-black/40 rounded-3xl border border-slate-700/30">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Pills */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                1-Click Demo Logins (Seeded Accounts)
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials("chairman@yarlventures.com", "Chairman@2026")}
                className="p-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors"
              >
                <p className="font-bold text-amber-900 flex items-center gap-1">👑 Chairman</p>
                <p className="text-[10px] text-amber-700 truncate">Full System Authority</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("reviewer@yarlventures.com", "Officer@2026")}
                className="p-2 text-left rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors"
              >
                <p className="font-bold text-emerald-900 flex items-center gap-1">🛡️ Review Officer</p>
                <p className="text-[10px] text-emerald-700 truncate">Approve/Reject Perms</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("auditor@yarlventures.com", "Officer@2026")}
                className="p-2 text-left rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-colors"
              >
                <p className="font-bold text-sky-900 flex items-center gap-1">📊 Auditor</p>
                <p className="text-[10px] text-sky-700 truncate">Audit Logs View Only</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("kamal.perera@example.com", "Member@2026")}
                className="p-2 text-left rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors"
              >
                <p className="font-bold text-emerald-900 flex items-center gap-1">✅ Active Member</p>
                <p className="text-[10px] text-emerald-700 truncate">Card YV-2026-000001</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("anura.silva@example.com", "Member@2026")}
                className="p-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors"
              >
                <p className="font-bold text-amber-900 flex items-center gap-1">⏳ Pending Member</p>
                <p className="text-[10px] text-amber-700 truncate">Under Staff Review</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("nimal.fernando@example.com", "Member@2026")}
                className="p-2 text-left rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors"
              >
                <p className="font-bold text-rose-900 flex items-center gap-1">❌ Rejected Member</p>
                <p className="text-[10px] text-rose-700 truncate">With Rejection Reason</p>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              Applying for new membership?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                Register an account (F-01)
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;