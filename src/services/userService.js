
import api from "./api";
export const getUserProfile =async () => {
        try {
            const response = await api.get("/profile");
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
}
export const updateUserProfile = async (data) => {
    try {        
      const response = await api.put("/profile-update", data);
      return response.data;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }}