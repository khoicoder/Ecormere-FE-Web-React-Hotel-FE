const API_BASE_URL = "http://localhost:8080/api";
import api from "./api";


export const getUserProfile =async () => {
        try {
            const response = await api.get(`${API_BASE_URL}/profile`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
}
export const updateUserProfile = async (data) => {
    try {        
      const response = await api.put(`${API_BASE_URL}/profile-update`, data);
      return response.data;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }}