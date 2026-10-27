import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Bearer JWT without leaking secrets in console
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Response Interceptor: Centralized Error & Session Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // If 401 Unauthorized occurs on an authenticated endpoint (not during login)
    if (status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register")) {
      const hadToken = !!localStorage.getItem("accessToken");
      if (hadToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        window.dispatchEvent(new Event("auth-changed"));

        // Only redirect if not already on an authentication route
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = "/login?expired=1";
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from an Axios error object
 */
export const extractErrorMessage = (error, fallback = "Đã xảy ra lỗi kết nối máy chủ.") => {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (typeof error.response?.data === "string" && error.response.data.length < 150) {
    return error.response.data;
  }
  if (error.message === "Network Error") {
    return "Không thể kết nối đến máy chủ Backend (Network Error). Vui lòng kiểm tra lại dịch vụ.";
  }
  return fallback;
};

export default api;
