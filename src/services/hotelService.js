import api from "./api";
export const getHotels = async () => {
     return api.get("/hotels");
};

export const getHotelById = async (id) => {
     return api.get(`/hotels/${id}`);
};