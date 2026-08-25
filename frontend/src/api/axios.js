import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalized error extraction & auto-logout on 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.response?.data?.message || "An unexpected error occurred",
      code: error.response?.data?.error?.code || "UNKNOWN_ERROR",
      details: error.response?.data?.error?.details || [],
      status: error.response?.status || 500
    };

    if (error.response?.status === 401) {
      // Clear token if unauthorized / expired
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Dispatch custom event for session expiry
        window.dispatchEvent(new Event("auth:session-expired"));
      }
    }

    return Promise.reject(customError);
  }
);

export default api;