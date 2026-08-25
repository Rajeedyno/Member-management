import React from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Conditionally renders UI elements based on user permissions or Chairman role.
 * F-12: UI hides actions the logged-in user has no permission for.
 */
export const PermissionGate = ({ permission, fallback = null, children }) => {
  const { hasPermission } = useAuth();

  if (!permission || hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;