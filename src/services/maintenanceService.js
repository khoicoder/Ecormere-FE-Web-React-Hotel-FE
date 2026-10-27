import api from "./api";

export const getAllMaintenance = async () => {
  try {
    const res = await api.get("/maintenance");
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching all maintenance:", error.message);
    return [];
  }
};

export const getMaintenanceByHotel = async (hotelId) => {
  try {
    const res = await api.get(`/hotels/${hotelId}/maintenance`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching maintenance for hotel:", hotelId, error.message);
    return [];
  }
};

export const createMaintenanceTicket = async (ticketData) => {
  const res = await api.post("/maintenance", ticketData);
  return res.data;
};

export const updateMaintenanceStatus = async (hotelId, maintenanceId, status) => {
  const normalizedStatus = status === "RESOLVED" ? "COMPLETED" : (status === "OPEN" ? "PENDING" : status);
  try {
    const res = await api.put(`/maintenance/${maintenanceId}/status`, { status: normalizedStatus });
    return res.data;
  } catch (error) {
    const res = await api.put(`/${hotelId}/status`, { status: normalizedStatus }, {
      params: { maintenainceId: maintenanceId }
    });
    return res.data;
  }
};

export const updateMaintenance = async (hotelId, maintenanceId, updateData) => {
  const res = await api.put(`/hotels/${hotelId}/maintenance/${maintenanceId}`, updateData);
  return res.data;
};
