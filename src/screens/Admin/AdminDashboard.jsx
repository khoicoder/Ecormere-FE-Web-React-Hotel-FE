import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboard,
  getAllUsers,
  lockUser,
  unlockUser,
  changeRole,
  getUserSessions,
  getAdminBookings
} from "../../services/adminService";
import { cancelBooking, updateBookingStatus, updateBookingPayment } from "../../services/bookingService";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const formatBookingTime = (isoString) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `lúc ${hours}h${minutes !== "00" ? minutes : ""} (${day}/${month}/${year})`;
    } catch (e) {
      return null;
    }
  };
  const [users, setUsers] = useState([]);
  const [systemBookings, setSystemBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // Filters for Users CRUD
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedActive, setSelectedActive] = useState("");

  // Modal Session Inspector
  const [inspectUser, setInspectUser] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const dash = await getDashboard();
      setStats(dash.stats);

      const [userList, bookingsList] = await Promise.all([
        getAllUsers(searchKeyword, selectedRole, selectedActive),
        getAdminBookings()
      ]);

      setUsers(Array.isArray(userList) ? userList : dash.recentUsers || []);
      setSystemBookings(Array.isArray(bookingsList) ? bookingsList : []);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = async () => {
      const bookingsList = await getAdminBookings();
      setSystemBookings(bookingsList);
    };

    window.addEventListener("booking-updated", handleSync);
    return () => window.removeEventListener("booking-updated", handleSync);
  }, [searchKeyword, selectedRole, selectedActive]);

  const handleToggleLock = async (user) => {
    if (stats?.roleScope !== "SUPER_ADMIN") {
      alert("Chỉ SUPER ADMIN mới có quyền khóa hoặc mở khóa tài khoản.");
      return;
    }
    try {
      if (user.active) {
        await lockUser(user.id);
        setActionMsg(`🔒 Đã khóa tài khoản ${user.username}`);
      } else {
        await unlockUser(user.id);
        setActionMsg(`🔓 Đã mở khóa tài khoản ${user.username}`);
      }
      setUsers(users.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    } catch (err) {
      setActionMsg("❌ Lỗi khi thao tác tài khoản: " + (err.response?.data?.message || err.message));
    }
    setTimeout(() => setActionMsg(""), 3500);
  };

  const handleChangeUserRole = async (user, newRole) => {
    if (stats?.roleScope !== "SUPER_ADMIN") {
      alert("Chỉ SUPER ADMIN mới có quyền thay đổi phân quyền hệ thống.");
      return;
    }
    try {
      await changeRole(user.id, { role: newRole });
      setActionMsg(`⭐ Đã cập nhật quyền của ${user.username} thành "${newRole}"`);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      setActionMsg("❌ Lỗi thay đổi quyền: " + (err.response?.data?.message || err.message));
    }
    setTimeout(() => setActionMsg(""), 3500);
  };

  const handleInspectSessions = async (user) => {
    setInspectUser(user);
    setLoadingSessions(true);
    const sessions = await getUserSessions(user.id);
    setUserSessions(sessions);
    setLoadingSessions(false);
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await updateBookingStatus(bookingId, "CONFIRMED");
      setActionMsg(`✅ Đã chấp nhận và duyệt đơn đặt phòng #${bookingId}`);
      const updated = await getAdminBookings();
      setSystemBookings(updated);
    } catch (err) {
      setActionMsg("Lỗi khi chấp nhận: " + (err.response?.data?.message || err.message));
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleTogglePayment = async (bookingId, currentPayment) => {
    const nextStatus = currentPayment === "PAID" ? "UNPAID" : "PAID";
    try {
      await updateBookingPayment(bookingId, nextStatus);
      setActionMsg(`💵 Đã cập nhật trạng thái thanh toán đơn #${bookingId} sang "${nextStatus}"`);
      const updated = await getAdminBookings();
      setSystemBookings(updated);
    } catch (err) {
      setActionMsg("Lỗi khi cập nhật thanh toán: " + (err.response?.data?.message || err.message));
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleCancelBooking = async (bookingId, roomNum) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt phòng #${bookingId} (Phòng ${roomNum})?`)) {
      try {
        await cancelBooking(bookingId);
        const updated = await getAdminBookings();
        setSystemBookings(updated);
        setActionMsg(`Đã hủy thành công đơn đặt phòng #${bookingId}`);
      } catch (err) {
        setActionMsg("Lỗi khi hủy đơn: " + (err.response?.data?.message || err.message));
      }
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-slate-600 font-bold text-lg animate-pulse">Đang tải bảng quản trị từ Databases Real...</div>
      </div>
    );
  }

  const isSuperAdmin = stats?.roleScope === "SUPER_ADMIN";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Role Scoping Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-7 rounded-3xl shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-black uppercase px-3.5 py-1 rounded-full shadow-sm ${
              isSuperAdmin
                ? "bg-amber-400 text-slate-900 border border-amber-300"
                : "bg-emerald-400 text-slate-900 border border-emerald-300"
            }`}>
              {isSuperAdmin ? "👑 SUPER ADMIN (TỔNG ĐIỀU HÀNH)" : `🏨 ADMIN KHÁCH SẠN: ${stats?.hotelName || "Chủ Khách Sạn"}`}
            </span>
            <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
              {isSuperAdmin ? "Phạm vi: Toàn bộ hệ thống khách sạn" : `Phạm vi: Riêng khách sạn ID #${stats?.hotelId || 1}`}
            </span>
          </div>

          <h1 className="text-3xl font-black mt-2">
            {isSuperAdmin ? "Bảng Điều Hành Toàn Bộ Hệ Thống" : `Quản Trị: ${stats?.hotelName}`}
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            {isSuperAdmin
              ? "Bạn có toàn quyền xem các chỉ số THỰC lũy kế từ toàn bộ cơ sở dữ liệu của tất cả khách sạn trong hệ thống."
              : `Bạn đang xem chỉ số THỰC được tính toán riêng biệt cho khách sạn của bạn từ Database Real.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Link
            to="/receptionist/dashboard"
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black px-4 py-3 rounded-2xl transition flex items-center gap-1.5 shadow-lg"
          >
            <span>🛎️</span> Bàn Lễ Tân
          </Link>
          <button
            onClick={loadData}
            className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg"
          >
            <span>🔄</span> Làm Mới Dữ Liệu Real
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 animate-fadeIn flex items-center gap-2">
          <span>ℹ️</span> {actionMsg}
        </div>
      )}

      {/* KPI Stats Cards - Calculated from REAL Database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isSuperAdmin ? "Tổng Người Dùng Hệ Thống" : "Khách Hàng Đặt Phòng"}</span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {isSuperAdmin ? `${stats?.totalAdmins || 0} Admin` : "Khách Của Bạn"}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{stats?.totalUsers || 0}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-2.5 block">
            🟢 {stats?.activeSessions || 0} phiên bảo mật đang online
          </span>
        </div>

        {/* Bookings Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isSuperAdmin ? "Đơn Đặt Phòng Toàn Hệ Thống" : "Đơn Đặt Phòng Của Bạn"}</span>
            <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold">
              +{systemBookings.length} trong DB
            </span>
          </div>
          <div className="text-3xl font-black text-red-600 mt-3">{systemBookings.length || stats?.totalBookings || 0}</div>
          <div className="flex items-center gap-2 mt-2.5 text-[10px] font-bold text-slate-500">
            <span className="text-emerald-600">{stats?.confirmedBookings || 0} giữ chỗ</span> •
            <span className="text-blue-600">{stats?.checkedInBookings || 0} đang ở</span> •
            <span className="text-red-500">{stats?.cancelledBookings || 0} đã hủy</span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isSuperAdmin ? "Doanh Thu Thực Toàn Hệ Thống" : "Doanh Thu Thực Của Bạn"}</span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Real DB</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-3">{stats?.totalRevenue || "0 đ"}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-2.5 block">
            {isSuperAdmin ? "Tính tổng trên tất cả khách sạn" : `Tính trên đơn ${stats?.hotelName || ""}`}
          </span>
        </div>

        {/* Hotels Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isSuperAdmin ? "Tổng Chuỗi Khách Sạn" : "Khách Sạn Quản Lý"}</span>
            <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
              {isSuperAdmin ? "Hệ Thống" : "Chủ Sở Hữu"}
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-3">{stats?.totalHotels || 1}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-2.5 block truncate">
            {isSuperAdmin ? "TP.HCM, Đà Nẵng, Đà Lạt" : (stats?.hotelName || "Khách sạn của bạn")}
          </span>
        </div>
      </div>

      {/* Real-time System Bookings: AI ĐANG ĐẶT PHÒNG NÀO */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl font-bold text-slate-900">
                {isSuperAdmin
                  ? "Danh Sách Đơn Đặt Phòng Toàn Bộ Khách Sạn (Real Bookings DB)"
                  : `Danh Sách Đơn Đặt Phòng Của ${stats?.hotelName || "Khách Sạn Bạn"}`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dữ liệu đơn đặt phòng được truy vấn trực tiếp từ bảng <code>bookings</code> của MySQL
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
            Tổng cộng: {systemBookings.length} đơn
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Mã Đơn</th>
                <th className="py-3.5 px-6">Khách Hàng (Booked By)</th>
                <th className="py-3.5 px-6">Phòng & Khách Sạn</th>
                <th className="py-3.5 px-6">Thời Gian Lưu Trú</th>
                <th className="py-3.5 px-6">Tổng Chi Phí</th>
                <th className="py-3.5 px-6">Trạng Thái</th>
                <th className="py-3.5 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {systemBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400 text-xs italic">
                    Chưa có đơn đặt phòng nào trong phạm vi quyền hạn của bạn.
                  </td>
                </tr>
              ) : (
                systemBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                      #{b.id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-xs flex items-center justify-center">
                          {(b.userName || b.username || b.customerName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            @{b.userName || b.username || b.customerName || "Khách"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {b.email || b.phone || "Khách hàng"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="font-extrabold text-red-600">
                        🚪 Phòng {b.roomNumber || b.roomId}
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {b.hotelName || `Khách sạn #${b.hotelId}`}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <span className="font-bold text-slate-800 block">
                        📅 {b.checkInDate} ➔ {b.checkOutDate}
                      </span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {b.createdAt && (
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-100 rounded-md px-1.5 py-0.5 inline-block w-fit">
                            🕒 Đặt {formatBookingTime(b.createdAt)}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          👥 {b.guestCount || 1} khách
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs font-black text-slate-900">
                      <div>
                        {typeof b.totalPrice === "number" ? b.totalPrice.toLocaleString("vi-VN") : b.totalPrice} đ
                      </div>
                      <div className="mt-1">
                        <button
                          onClick={() => handleTogglePayment(b.id, b.paymentStatus)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                            b.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Bấm để đổi trạng thái thanh toán"
                        >
                          {b.paymentStatus === "PAID" ? "● ĐÃ THANH TOÁN" : "○ CHƯA THANH TOÁN"}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "CHECKED_IN"
                            ? "bg-blue-100 text-blue-800"
                            : b.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status === "CONFIRMED"
                          ? "● Đã Giữ Phòng"
                          : b.status === "CHECKED_IN"
                          ? "● Đang Lưu Trú"
                          : b.status === "CANCELLED"
                          ? "× Đã Hủy"
                          : "⏳ Chờ Duyệt"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "PENDING" && (
                          <button
                            onClick={() => handleConfirmBooking(b.id)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                            title="Chấp nhận đơn đặt phòng"
                          >
                            ✓ Duyệt
                          </button>
                        )}
                        {b.status !== "CANCELLED" ? (
                          <button
                            onClick={() => handleCancelBooking(b.id, b.roomNumber || b.roomId)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition shadow-sm"
                          >
                            Hủy
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Đã giải phóng</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management Section */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isSuperAdmin
                ? "Quản Lý Tài Khoản Người Dùng (All Users CRUD - Super Admin)"
                : `Khách Hàng Đã Đặt Phòng Tại ${stats?.hotelName || "Khách Sạn Bạn"}`}
            </h2>
            <span className="text-xs text-slate-500">
              {isSuperAdmin
                ? `Hiển thị ${users.length} tài khoản trong toàn bộ hệ thống`
                : `Hiển thị ${users.length} tài khoản khách hàng liên kết với khách sạn của bạn`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm username hoặc email..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 w-52 sm:w-64 focus:outline-none focus:border-red-500 transition font-medium"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none"
            >
              <option value="">Tất cả Role</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>

            <select
              value={selectedActive}
              onChange={(e) => setSelectedActive(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none"
            >
              <option value="">Tất cả Trạng Thái</option>
              <option value="true">Hoạt Động</option>
              <option value="false">Đã Khóa</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">ID & Username</th>
                <th className="py-3.5 px-6">Email & Liên Hệ</th>
                <th className="py-3.5 px-6">Phân Quyền (Role)</th>
                <th className="py-3.5 px-6">Trạng Thái</th>
                <th className="py-3.5 px-6 text-right">Thao Tác Bảo Mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 text-xs italic">
                    Không tìm thấy tài khoản người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-black text-xs flex items-center justify-center shadow-sm">
                          {u.username ? u.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">#{u.id} {u.username}</span>
                          <span className="text-[11px] text-slate-400">{u.address || "Hệ thống"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <span className="text-slate-700 font-medium block">{u.email}</span>
                      <span className="text-slate-400 text-[11px]">{u.phone || "09xx xxx xxx"}</span>
                    </td>
                    <td className="py-4 px-6">
                      {isSuperAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u, e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg text-xs font-extrabold px-2.5 py-1 text-slate-800 shadow-sm outline-none cursor-pointer"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      ) : (
                        <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {u.active ? "● Hoạt động" : "🔒 Bị khóa"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleInspectSessions(u)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                          title="Xem phiên đăng nhập"
                        >
                          📱 Phiên
                        </button>
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleToggleLock(u)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                              u.active
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {u.active ? "Khóa" : "Mở Khóa"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Quyền xem</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sessions Modal Inspector */}
      {inspectUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn">
            <button
              onClick={() => setInspectUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold"
            >
              ×
            </button>

            <h3 className="text-xl font-black text-slate-900 border-b pb-3">
              Phiên Đăng Nhập: {inspectUser.username}
            </h3>

            <div className="mt-4 space-y-3">
              {loadingSessions ? (
                <p className="text-slate-500 text-xs italic text-center py-4">Đang truy xuất phiên...</p>
              ) : userSessions.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center py-4">Không tìm thấy phiên làm việc nào.</p>
              ) : (
                userSessions.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">💻 {s.deviceName || "Web Client"}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">IP: {s.ipAddress || "127.0.0.1"} • {s.createAt || "Gần đây"}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.revokedAt == null ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {s.revokedAt == null ? "ĐANG ONLINE" : "ĐÃ REVOKE"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
