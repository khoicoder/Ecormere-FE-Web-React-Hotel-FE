import { useState } from "react";
import { registerAPI } from "../../services/authService.js";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER"
  });

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.password || !form.confirmPassword || !form.email) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không trùng khớp!");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("Mật khẩu tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await registerAPI({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role
      });

      setSuccess("🎉 Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Registration failed:", err);
      const message = err.response?.data?.message || err.response?.data || "Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã tồn tại.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
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
        <h2 className="text-2xl font-black tracking-tight text-white">Đăng Ký Tài Khoản</h2>
        <p className="text-slate-400 text-xs mt-1">Gia nhập hệ thống đặt phòng khách sạn thông minh Cinema Style</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-slate-300 mb-1">Tên đăng nhập / Username *</label>
          <input
            name="username"
            placeholder="VD: nguyenvana"
            value={form.username}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">Địa chỉ Email *</label>
          <input
            type="email"
            name="email"
            placeholder="VD: nguyenvana@gmail.com"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">Mật khẩu *</label>
          <input
            type="password"
            name="password"
            placeholder="Tối thiểu 6 ký tự (Hoa, thường, số, ký tự đặc biệt)"
            value={form.password}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1">Xác nhận mật khẩu *</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs font-medium bg-red-950/60 p-3 rounded-xl border border-red-800 animate-fadeIn">
            ❌ {error}
          </p>
        )}

        {success && (
          <p className="text-emerald-400 text-xs font-bold bg-emerald-950/60 p-3 rounded-xl border border-emerald-800 animate-fadeIn">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition text-sm tracking-wide mt-2"
        >
          {loading ? "Đang xử lý đăng ký..." : "Đăng Ký Ngay"}
        </button>

        <div className="text-center pt-2">
          <span className="text-slate-400">Đã có tài khoản? </span>
          <Link to="/login" className="text-red-400 font-bold hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </form>
    </div>
  );
}

        
        
        