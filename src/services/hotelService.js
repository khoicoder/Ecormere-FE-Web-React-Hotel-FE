import api from "./api";
export const getHotels = async () => {
     return api.get("/api/hotels");
};

export const getHotelById = async (id) => {
     return api.get(`/api/hotels/${id}`);
};