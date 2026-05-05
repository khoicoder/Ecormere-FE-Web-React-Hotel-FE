import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/auth";
export const registerAPI = async (data) => {
    try{
        const response = await axios.post(`${API_BASE_URL}/register`, data);
        console.log("Register API response:", response);
        if(response.status === 201){
            console.log("Registration successful:", response.data);
        } else {
            console.error("Registration failed with status:", response.status);
        }

        return response.data;

    } catch (error) {
        console.error("lỗi auth của register:", error);
        throw error;
    }
    
    
}
export const loginAPI = async (data) => {
    try{
        const response = await axios.post(`${API_BASE_URL}/login`, data);
        console.log("Login API response:", response);
        return response.data;
    } catch (error) {
        console.error("lỗi auth của login:", error);
        throw error;
    }
}
