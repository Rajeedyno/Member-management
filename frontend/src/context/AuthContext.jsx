import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [effectivePermissions, setEffectivePermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.success && response.data) {
        setUser(response.data.user);
        setEffectivePermissions(response.data.effectivePermissions || []);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.warn("Failed to fetch current user session:", err.message);
      setToken(null);
      setUser(null);
      setEffectivePermissions([]);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      setEffectivePermissions([]);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.success && res.data) {
      const { token: newToken, user: newUser, effectivePermissions: newPerms } = res.data;
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setEffectivePermissions(newPerms || []);
      return newUser;
    }
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    if (res.success && res.data) {
      const { token: newToken, user: newUser, effectivePermissions: newPerms } = res.data;
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setEffectivePermissions(newPerms || []);
      return newUser;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setEffectivePermissions([]);
    }
  };

  const refreshUser = async () => {
    return fetchCurrentUser();
  };

  const hasPermission = useCallback((permissionKey) => {
    if (!user) return false;
    if (user.userType === "CHAIRMAN") return true; // Chairman has full access (BR-05)
    return effectivePermissions.includes(permissionKey);
  }, [user, effectivePermissions]);

  const isChairman = user?.userType === "CHAIRMAN";
  const isOfficer = user?.userType === "OFFICER";
  const isMember = user?.userType === "MEMBER";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        effectivePermissions,
        hasPermission,
        isChairman,
        isOfficer,
        isMember,
        login,
        register,
        logout,
        refreshUser,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};