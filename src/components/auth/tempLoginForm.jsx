import { useState } from "react";
import { loginAPI } from "../../services/authService.js";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button.js";
import Input from "../common/Input.js";

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
    } else if (roleType === "hotel") {
      setForm({ username: "khoi", password: "Admin123@" });
    } else if (roleType === "receptionist") {
      setForm({ username: "letan", password: "Admin123@" });
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

      if (response.role === "SUPER_ADMIN" || response.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (response.role === "RECEPTIONIST") {
        navigate("/receptionist/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin tài khoản hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto my-12">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-md shadow-indigo-600/30 mb-3">
          EH
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Đăng Nhập Hệ Thống</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Cổng đăng nhập Quản Trị Khách Sạn & Khách Hàng</p>
      </div>

      {/* Quick Fill Buttons for testing */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-6 text-center">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold mb-2">⚡ Thử nghiệm nhanh các vai trò:</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("super")}
            className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold py-1.5 px-2 rounded-lg border border-amber-200 dark:border-amber-700/60 transition text-left"
          >
            👑 Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("hotel")}
            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-xs font-semibold py-1.5 px-2 rounded-lg border border-blue-200 dark:border-blue-700/60 transition text-left"
          >
            🏨 Hotel Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("receptionist")}
            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold py-1.5 px-2 rounded-lg border border-emerald-200 dark:border-emerald-700/60 transition text-left"
          >
            🛎️ Lễ Tân
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("user")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-600/60 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-600 transition text-left"
          >
            👤 Khách Hàng
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập / Username</label>
          <Input
            name="username"
            value={form.username}
            placeholder="Nhập tên đăng nhập"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
          <Input
            type="password"
            name="password"
            value={form.password}
            placeholder="Nhập mật khẩu"
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="w-full justify-center py-2.5 mt-2"
        >
          {loading ? "Đang xử lý đăng nhập..." : "Đăng Nhập"}
        </Button>
      </form>
    </div>
  );
}
