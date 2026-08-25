import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberDashboard from "./pages/MemberDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ChairmanDashboard from "./pages/ChairmanDashboard";
import AuditLogsPage from "./pages/AuditLogsPage";
import ProfilePage from "./pages/ProfilePage";

const MainLayout = () => {
  const { user, loading, isChairman, isOfficer, isMember } = useAuth();
  const [authView, setAuthView] = useState("login"); // "login" or "register"
  const [activeTab, setActiveTab] = useState("member-dashboard");

  const { hasPermission } = useAuth();
  useEffect(() => {
    if (user) {
      if (isChairman) {
        setActiveTab("chairman-dashboard");
      } else if (isOfficer) {
        if (hasPermission("application.view") || hasPermission("member.view")) {
          setActiveTab("staff-dashboard");
        } else if (hasPermission("audit.view")) {
          setActiveTab("audit-logs");
        } else {
          setActiveTab("profile");
        }
      } else {
        setActiveTab("member-dashboard");
      }
    }
  }, [user, isChairman, isOfficer, hasPermission]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-emerald-400">Loading Member Management Portal...</p>
      </div>
    );
  }

  if (!user) {
    if (authView === "register") {
      return <Register onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <Login onSwitchToRegister={() => setAuthView("register")} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 pb-16">
        {activeTab === "member-dashboard" && <MemberDashboard />}
        {activeTab === "staff-dashboard" && <StaffDashboard />}
        {activeTab === "chairman-dashboard" && <ChairmanDashboard />}
        {activeTab === "audit-logs" && <AuditLogsPage />}
        {activeTab === "profile" && <ProfilePage />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Yarl Ventures (PVT) Ltd. Member Management System. Confidential.</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-emerald-800">RBAC & F-12 Active</span>
            <span>•</span>
            <span>MERN Stack</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;