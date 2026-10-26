import api from "./api";
import { syncHotelWithBookings } from "./bookingService";

export const getHotels = async () => {
  try {
    const res = await api.get("/hotels");
    const rawList = Array.isArray(res.data) ? res.data : [];
    const syncedList = rawList.map(h => syncHotelWithBookings(h));
    return { data: syncedList };
  } catch (error) {
    console.warn("Backend /hotels not reachable:", error.message);
    return { data: [] };
  }
};

export const getAdminHotels = async () => {
  try {
    const res = await api.get("/admin/hotels");
    const rawList = Array.isArray(res.data) ? res.data : [];
    const syncedList = rawList.map(h => syncHotelWithBookings(h));
    return { data: syncedList };
  } catch (error) {
    console.warn("Backend /admin/hotels not reachable, falling back to /hotels:", error.message);
    return getHotels();
  }
};

export const getHotelById = async (id) => {
  try {
    const res = await api.get(`/hotels/${id}`);
    const rawHotel = res.data;
    return { data: syncHotelWithBookings(rawHotel) };
  } catch (error) {
    console.warn("Backend /hotels/:id error:", error.message);
    return { data: null };
  }
};

export const createHotel = async (hotelData) => {
  try {
    return await api.post("/hotels", hotelData);
  } catch (error) {
    console.error("Error creating hotel:", error.message);
    throw error;
  }
};

export const updateHotel = async (id, hotelData) => {
  try {
    return await api.put(`/hotels/${id}`, hotelData);
  } catch (error) {
    console.error("Error updating hotel:", error.message);
    throw error;
  }
};

export const deleteHotel = async (id) => {
  try {
    return await api.delete(`/hotels/${id}`);
  } catch (error) {
    console.error("Error deleting hotel:", error.message);
    throw error;
  }
};
