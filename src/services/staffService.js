import api from "./api";

export const getHotelAdminsAPI = async () => {
  const response = await api.get("/admin/hotel-admins");
  return response.data;
};

export const createHotelAdminAPI = async (data) => {
  const response = await api.post("/admin/hotel-admins", data);
  return response.data;
};

export const assignHotelAdminAPI = async (hotelId, adminUserId) => {
  const response = await api.put(`/admin/hotel-admins/${hotelId}/assign/${adminUserId}`);
  return response.data;
};

export const getReceptionistsAPI = async (hotelId = null) => {
  const url = hotelId ? `/admin/receptionists?hotelId=${hotelId}` : "/admin/receptionists";
  const response = await api.get(url);
  return response.data;
};

export const createReceptionistAPI = async (data) => {
  const response = await api.post("/admin/receptionists", data);
  return response.data;
};

export const toggleReceptionistStatusAPI = async (userId) => {
  const response = await api.patch(`/admin/receptionists/${userId}/status`);
  return response.data;
};

export const resetReceptionistPasswordAPI = async (userId, newPassword) => {
  const response = await api.post(`/admin/receptionists/${userId}/reset-password`, {
    newPassword,
  });
  return response.data;
};
