import api from "./api";

export const loginAPI = async (data) => {
  const res = await api.post("/auth/login", data);
  if (res.data?.token || res.data?.accessToken) {
    localStorage.setItem("accessToken", res.data.token || res.data.accessToken);
    localStorage.setItem("userRole", res.data.role || "USER");
    localStorage.setItem("username", data.username);
  }
  return res.data;
};

export const registerAPI = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const logoutAPI = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.warn("Logout error:", error.message);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  }
};

export const logoutAllAPI = async () => {
  try {
    await api.post("/auth/logout-all");
  } catch (error) {
    console.warn("Logout all error:", error.message);
  } finally {
    localStorage.clear();
  }
};
