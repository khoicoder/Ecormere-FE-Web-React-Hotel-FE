import { useState } from "react";
import { loginAPI } from "../../services/authService.js";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleQuickFill = (roleType) => {
    if (roleType === "user") {
      setForm({ username: "khachhang_vip", password: "Admin123@" });
    } else if (roleType === "super") {
      setForm({ username: "admin", password: "Admin123@" });
    } else {
      setForm({ username: "khoi", password: "Admin123@" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Vui lòng nhập tên tài khoản và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const response = await loginAPI(form);

      // Dispatch event to update Header instantly
      window.dispatchEvent(new Event("auth-changed"));

      if (response.role === "ADMIN" || response.role === "SUPER_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto my-12">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-red-600/40 mb-3">
          H
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Đăng Nhập Tài Khoản</h2>
        <p className="text-slate-400 text-xs mt-1">Trải nghiệm ứng dụng đặt phòng khách sạn thông minh Cinema Style</p>
      </div>

      {/* Quick Fill Buttons for testing */}
      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 mb-6 text-center">
        <span className="text-[11px] text-slate-400 block font-semibold mb-2">⚡ Thử nghiệm nhanh các vai trò:</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("super")}
            className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-amber-700/60 transition"
          >
            👑 Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("hotel")}
            className="bg-blue-950/80 hover:bg-blue-900 text-blue-300 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-blue-700/60 transition"
          >
            🏨 Hotel Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("user")}
            className="bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold py-1.5 px-2 rounded-xl border border-slate-600 transition"
          >
            👤 Khách Hàng
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Tên đăng nhập / Username</label>
          <input
            name="username"
            value={form.username}
            placeholder="Nhập tên đăng nhập (VD: user hoặc admin)"
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
          <input
            type="password"
            name="password"
            value={form.password}
            placeholder="Nhập mật khẩu"
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
          />
        </div>

        {error && <p className="text-red-400 text-xs font-medium bg-red-950/50 p-3 rounded-xl border border-red-800">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition text-sm tracking-wide mt-2"
        >
          {loading ? "Đang xử lý..." : "Đăng Nhập Ngay"}
        </button>
      </form>
    </div>
  );
}