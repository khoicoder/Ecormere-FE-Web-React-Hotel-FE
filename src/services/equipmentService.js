import api from "./api";

export const getEquipmentByHotel = async (hotelId) => {
  try {
    const res = await api.get(`/hotels/${hotelId}/equipment`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching equipment for hotel:", hotelId, error.message);
    return [];
  }
};

export const getEquipmentById = async (id) => {
  const res = await api.get(`/equipment/${id}`);
  return res.data;
};

export const createEquipment = async (data) => {
  const res = await api.patch("/equipment", data);
  return res.data;
};

export const updateEquipmentStatus = async (id, statusRequest) => {
  const res = await api.patch(`/equipment/${id}`, statusRequest);
  return res.data;
};

export const deleteEquipment = async (id) => {
  const res = await api.delete(`/equipment/${id}`);
  return res.data;
};
