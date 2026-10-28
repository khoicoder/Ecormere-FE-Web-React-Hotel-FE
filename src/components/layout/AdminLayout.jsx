import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutAPI } from "../../services/authService";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const role = localStorage.getItem("userRole") || "ADMIN";
  const username = localStorage.getItem("username") || "Quản Trị Viên";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isReceptionist = role === "RECEPTIONIST";

  // Close menus on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutAPI();
    navigate("/login");
  };

  // Define Navigation Items based on Role
  const navItems = [
    // Dashboard overview
    {
      label: isSuperAdmin ? "Bảng Điều Hành Hệ Thống" : isReceptionist ? "Bàn Điều Hành Lễ Tân" : "Tổng Quan Khách Sạn",
      to: isReceptionist ? "/receptionist/dashboard" : "/admin/dashboard",
      icon: "📊",
      visible: true,
    },
    // Super Admin specific: Hotel Admins management
    {
      label: "Phân Quyền Admin Khách Sạn",
      to: "/admin/hotel-admins",
      icon: "👑",
      visible: isSuperAdmin,
      badge: "Super",
    },
    // Staff: Receptionists management (Hotel Admin manages their hotel; Super Admin manages all)
    {
      label: isSuperAdmin ? "Quản Lý Lễ Tân Toàn Quốc" : "Lễ Tân Cơ Sở Của Bạn",
      to: "/admin/receptionists",
      icon: "👥",
      visible: isSuperAdmin || role === "ADMIN",
    },
    // Receptionist desk
    {
      label: "Bàn Lễ Tân (Front Desk)",
      to: "/receptionist/dashboard",
      icon: "🛎️",
      visible: isSuperAdmin || role === "ADMIN",
    },
    // Room Inventory & Hotels
    {
      label: isSuperAdmin ? "Quản Lý Khách Sạn" : isReceptionist ? "Sơ Đồ Phòng Theo Tầng" : "Sơ Đồ Phòng Cơ Sở",
      to: "/admin/hotels",
      icon: isReceptionist ? "🏢" : "🏨",
      visible: true,
    },
    // Facility: Equipment
    {
      label: "Quản Lý Thiết Bị",
      to: "/admin/equipment",
      icon: "🔧",
      visible: isSuperAdmin || role === "ADMIN",
    },
    // Facility: Maintenance
    {
      label: isReceptionist ? "Báo Sự Cố Kỹ Thuật" : "Quản Lý Bảo Trì",
      to: "/admin/maintenance",
      icon: "🛠️",
      visible: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 border-r border-slate-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
                H
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block">
                  Ecormere<span className="text-indigo-400">Hotel</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block -mt-0.5">
                  Management Console
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 text-lg"
            >
              ✕
            </button>
          </div>

          {/* Role Status Tag */}
          <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSuperAdmin ? "bg-amber-400" : isReceptionist ? "bg-emerald-400" : "bg-indigo-400"
                }`}
              />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                {isSuperAdmin
                  ? "Super Admin Toàn Quốc"
                  : isReceptionist
                  ? "Bàn Lễ Tân Điều Hành"
                  : "Quản Trị Viên Khách Sạn"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              Tài khoản: <span className="font-bold text-white">@{username}</span>
            </p>
          </div>

          {/* Nav Items List */}
          <nav className="p-4 space-y-1.5 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 py-2">
              Menu Vận Hành & Quản Trị
            </div>

            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base group-hover:scale-110 transition">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-400/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition mb-1"
          >
            <span>🏠</span>
            <span>Về Cổng Khách Hàng</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 p-2 rounded-xl hover:bg-rose-950/30 transition text-left"
          >
            <span>🚪</span>
            <span>Đăng Xuất Khỏi Hệ Thống</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Management Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Toggle & Scope Tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
              aria-label="Mở menu quản trị"
            >
              ☰
            </button>

            {/* Scope Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="text-sm">
                {isSuperAdmin ? "🌐" : isReceptionist ? "🛎️" : "🏨"}
              </span>
              <span className="text-xs font-bold text-slate-700">
                {isSuperAdmin
                  ? "Phạm vi: Toàn Hệ Thống Toàn Quốc"
                  : isReceptionist
                  ? "Bàn Lễ Tân Cơ Sở"
                  : "Phạm vi: Quản Trị Khách Sạn Cơ Sở"}
              </span>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition"
            >
              <span>🏠</span>
              <span>Cổng Đặt Phòng</span>
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">@{username}</p>
                  <p className="text-[10px] font-semibold text-slate-400 capitalize">
                    {role.toLowerCase()}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {username.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-slate-400 text-xs pr-1">▼</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">@{username}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{role}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    👤 Hồ Sơ Cá Nhân
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    🏠 Xem Trang Khách Hàng
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      🚪 Đăng Xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
