import { useState } from "react";
import { loginAPI } from "../../services/authService.js";
import { useNavigate } from "react-router-dom";

function getDeviceId() {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}

export default function LoginForm() {

const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    try {
      const deviceId = getDeviceId();
      
      const response = await loginAPI({
        ...form,
          deviceId: deviceId,

      });

    

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("username", form.username);
      localStorage.setItem("role", response.role);
      localStorage.setItem("deviceId", deviceId);
      console.log("Login successful:", response);
      
      navigate("/");

    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />

        <button className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Login
        </button>
      </form>
    </div>
  );
}