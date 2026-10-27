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

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xl backdrop-blur-lg bg-opacity-95">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-red-600 to-rose-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/40 group-hover:scale-105 transition duration-300">
            H
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-red-400 transition">
            Ecormere<span className="text-red-500">Hotel</span>
          </span>
        </Link>

        <span className="hidden sm:inline-block bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-500/30">
          🎬 Cinema Grid Active
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-semibold">
        <Link to="/" onClick={handleLogoClick} className="text-slate-300 hover:text-red-400 transition flex items-center gap-1.5">
          <span>🏠 Khách Sạn & Chọn Phòng</span>
        </Link>
        <Link to="/profile" className="text-slate-300 hover:text-red-400 transition flex items-center gap-1.5">
          <span>👤 Hồ Sơ & Đặt Phòng</span>
        </Link>
        {/* Receptionist Navigation */}
        {role === "RECEPTIONIST" && (
          <div className="flex items-center gap-4 border-l border-slate-700 pl-5">
            <Link to="/receptionist/dashboard" className="text-emerald-400 font-bold hover:text-emerald-300 transition flex items-center gap-1">
              🛎️ Bàn Lễ Tân (Front Desk)
            </Link>
            <Link to="/admin/hotels" className="text-slate-300 hover:text-emerald-400 transition">
              🏨 Sơ Đồ Phòng
            </Link>
            <Link to="/admin/maintenance" className="text-slate-300 hover:text-emerald-400 transition">
              🛠️ Báo Sự Cố
            </Link>
          </div>
        )}

        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <div className="flex items-center gap-4 border-l border-slate-700 pl-5">
            <Link to="/admin/dashboard" className="text-red-400 font-bold hover:text-red-300 transition flex items-center gap-1">
              📊 {role === "SUPER_ADMIN" ? "Super Hub" : "Admin Hub"}
            </Link>
            {role === "SUPER_ADMIN" && (
              <Link to="/admin/hotel-admins" className="text-purple-400 font-bold hover:text-purple-300 transition flex items-center gap-1">
                👑 Admin Khách Sạn
              </Link>
            )}
            <Link to="/admin/receptionists" className="text-indigo-400 font-bold hover:text-indigo-300 transition flex items-center gap-1">
              👥 {role === "SUPER_ADMIN" ? "Tất Cả Lễ Tân" : "Lễ Tân Của Bạn"}
            </Link>
            <Link to="/receptionist/dashboard" className="text-emerald-400 font-bold hover:text-emerald-300 transition flex items-center gap-1">
              🛎️ Bàn Lễ Tân
            </Link>
            <Link to="/admin/hotels" className="text-slate-300 hover:text-red-400 transition">
              🏨 Khách Sạn
            </Link>
            <Link to="/admin/equipment" className="text-slate-300 hover:text-red-400 transition">
              🔧 Thiết Bị
            </Link>
            <Link to="/admin/maintenance" className="text-slate-300 hover:text-red-400 transition">
              🛠️ Bảo Trì
            </Link>
          </div>
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
              <button className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-lg shadow-red-600/30 transition">
                Đăng Ký
              </button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700/80 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-white line-clamp-1">{username}</span>
                <span className="block text-[10px] text-red-400 font-semibold">{role || "USER"}</span>
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 py-1.5 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs text-slate-400">Đăng nhập với tư cách</p>
                  <p className="text-sm font-bold text-white">{username}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-800 hover:text-red-400 transition"
                >
                  👤 Trang Hồ Sơ Cá Nhân
                </Link>

                {role === "RECEPTIONIST" && (
                  <>
                    <Link
                      to="/receptionist/dashboard"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-slate-800 transition"
                    >
                      🛎️ Bàn Lễ Tân (Front Desk)
                    </Link>
                    <Link
                      to="/admin/hotels"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-800 hover:text-emerald-400 transition"
                    >
                      🏨 Sơ Đồ Phòng Khách Sạn
                    </Link>
                    <Link
                      to="/admin/maintenance"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-800 hover:text-emerald-400 transition"
                    >
                      🛠️ Phiếu Sự Cố Kỹ Thuật
                    </Link>
                  </>
                )}

                {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-slate-800 transition"
                    >
                      📊 Bảng Quản Trị ({role === "SUPER_ADMIN" ? "Super Admin" : "Hotel Admin"})
                    </Link>
                    {role === "SUPER_ADMIN" && (
                      <Link
                        to="/admin/hotel-admins"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 text-xs font-bold text-purple-400 hover:bg-slate-800 transition"
                      >
                        👑 Phân Quyền Admin Khách Sạn
                      </Link>
                    )}
                    <Link
                      to="/admin/receptionists"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-indigo-400 hover:bg-slate-800 transition"
                    >
                      👥 Quản Lý & Tạo Tài Khoản Lễ Tân
                    </Link>
                    <Link
                      to="/receptionist/dashboard"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-slate-800 transition"
                    >
                      🛎️ Bàn Điều Hành Lễ Tân
                    </Link>
                    <Link
                      to="/admin/hotels"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-800 hover:text-red-400 transition"
                    >
                      🏨 Quản Lý Khách Sạn
                    </Link>
                    <Link
                      to="/admin/equipment"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-800 hover:text-red-400 transition"
                    >
                      🔧 Quản Lý Thiết Bị
                    </Link>
                    <Link
                      to="/admin/maintenance"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-xs font-medium hover:bg-slate-800 hover:text-red-400 transition"
                    >
                      🛠️ Quản Lý Bảo Trì
                    </Link>
                  </>
                )}


                <div className="border-t border-slate-800 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/40 transition"
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