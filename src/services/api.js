import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
try{
  api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if(token){
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  })
}catch(err){
  console.error("API initialization error:", err);
  console.error("API interceptor setup failed. Requests may not include auth token.");
}

export default api;
