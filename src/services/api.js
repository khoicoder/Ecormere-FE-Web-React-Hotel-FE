import axios from "axios";

const api = axios.create({
  baseURL: "https://api.yourdomain.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your_token_here",
  },
});

export default api;
