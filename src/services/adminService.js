import api from "./api";

const formatVND = (val) => {
  if (val === null || val === undefined) return "0 đ";
  if (typeof val === "number") return val.toLocaleString("vi-VN") + " đ";
  if (typeof val === "string" && !isNaN(Number(val))) return Number(val).toLocaleString("vi-VN") + " đ";
  return val;
};

export const getDashboard = async () => {
  const res = await api.get("/admin/dashboard");
  const raw = res.data?.stats ? res.data.stats : res.data;
  return {
    stats: {
      ...raw,
      totalRevenue: formatVND(raw?.totalRevenue),
      rawRevenue: raw?.totalRevenue || 0,
      roleScope: raw?.roleScope || localStorage.getItem("userRole") || "ADMIN",
      hotelId: raw?.hotelId || null,
      hotelName: raw?.hotelName || "Toàn Hệ Thống Khách Sạn"
    },
    recentUsers: res.data?.recentUsers || []
  };
};

export const getAdminBookings = async () => {
  const res = await api.get("/admin/bookings");
  return Array.isArray(res.data) ? res.data : [];
};

export const getAdminHotels = async () => {
  const res = await api.get("/admin/hotels");
  return Array.isArray(res.data) ? res.data : [];
};

export const getAllUsers = async (keyword = "", role = "", active = null, page = 0, size = 10) => {
  let url = `/admin/users?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`;
  if (role) url += `&role=${role}`;
  if (active !== null && active !== undefined && active !== "") url += `&active=${active}`;
  const res = await api.get(url);
  if (res.data?.content && Array.isArray(res.data.content)) {
    return res.data.content;
  }
  return Array.isArray(res.data) ? res.data : [];
};

export const changeRole = async (userId, roleRequest) => {
  const res = await api.patch(`/admin/users/${userId}/role`, roleRequest);
  return res.data;
};

export const lockUser = async (userId) => {
  const res = await api.patch(`/admin/users/${userId}/lock`);
  return res.data;
};

export const unlockUser = async (userId) => {
  const res = await api.patch(`/admin/users/${userId}/unlock`);
  return res.data;
};

export const getUserSessions = async (userId) => {
  const res = await api.get(`/admin/users/${userId}/all-sessions`);
  return Array.isArray(res.data) ? res.data : [];
};
