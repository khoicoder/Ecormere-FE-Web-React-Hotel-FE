import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutAPI } from "../../services/authService";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("accessToken") || null);
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [role, setRole] = useState(localStorage.getItem("userRole") || null);

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("accessToken"));
      setUsername(localStorage.getItem("username"));
      setRole(localStorage.getItem("userRole"));
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const handleLogoClick = () => {
    window.dispatchEvent(new Event("reset-hotel-selection"));
  };

  const handleLogout = async () => {
    await logoutAPI();
    setToken(null);
    setUsername(null);
    setRole(null);
    setOpen(false);
    navigate("/login");
  };

  const isStaffOrAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "RECEPTIONIST";

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-md backdrop-blur-md bg-opacity-95">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition">
            H
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-indigo-400 transition">
            Ecormere<span className="text-indigo-400">Hotel</span>
          </span>
        </Link>

        <span className="hidden lg:inline-block bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          Smart Booking
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <span>🏨</span>
          <span>Khách Sạn & Chọn Phòng</span>
        </Link>

        <Link
          to="/profile"
          className="text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <span>👤</span>
          <span>Hồ Sơ & Đơn Của Tôi</span>
        </Link>

        {/* Shortcut to Management Console for Staff / Admins */}
        {isStaffOrAdmin && (
          <Link
            to={role === "RECEPTIONIST" ? "/receptionist/dashboard" : "/admin/dashboard"}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <span>📊</span>
            <span>
              {role === "SUPER_ADMIN"
                ? "Vào Super Admin Hub"
                : role === "RECEPTIONIST"
                ? "Vào Bàn Lễ Tân"
                : "Vào Bảng Quản Trị"}
            </span>
          </Link>
        )}
      </nav>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {!token ? (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 rounded-xl hover:bg-slate-800 transition">
                Đăng Nhập
              </button>
            </Link>
            <Link to="/register">
              <button className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition">
                Đăng Ký
              </button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition focus:outline-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">@{username}</p>
                <p className="text-[10px] text-slate-400 capitalize">{role.toLowerCase()}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {username?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <span className="text-slate-400 text-xs pr-1">▼</span>
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white">@{username}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{role}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  👤 Hồ Sơ & Lịch Sử Đặt Phòng
                </Link>

                {isStaffOrAdmin && (
                  <Link
                    to={role === "RECEPTIONIST" ? "/receptionist/dashboard" : "/admin/dashboard"}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-xs font-bold text-indigo-400 hover:bg-slate-800 transition"
                  >
                    📊 Chuyển Sang Bảng Quản Trị
                  </Link>
                )}

                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition"
                  >
                    🚪 Đăng Xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
