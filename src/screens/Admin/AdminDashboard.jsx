import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboard,
  getAllUsers,
  lockUser,
  unlockUser,
  changeRole,
  getUserSessions,
  getAdminBookings,
} from "../../services/adminService";
import {
  cancelBooking,
  updateBookingStatus,
  updateBookingPayment,
} from "../../services/bookingService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader, CardBody, StatCard } from "../../components/ui/Card";
import Button from "../../components/ui/FormControls";
import { Input, Select } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
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

  const loadData = async () => {
    try {
      setLoading(true);
      const dash = await getDashboard();
      setStats(dash.stats);

      const [userList, bookingsList] = await Promise.all([
        getAllUsers(searchKeyword, selectedRole, selectedActive),
        getAdminBookings(),
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
      setUsers(users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)));
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
      setUsers(users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
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
    return <LoadingState message="Đang tải dữ liệu trung tâm điều hành..." />;
  }

  const isSuperAdmin = stats?.roleScope === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title={isSuperAdmin ? "Trung Tâm Điều Hành Hệ Thống" : `Quản Trị: ${stats?.hotelName || "Khách Sạn"}`}
        subtitle={
          isSuperAdmin
            ? "Tổng hợp toàn diện chỉ số kinh doanh, tài khoản và đơn đặt phòng toàn quốc."
            : stats?.hotelName
            ? `Giám sát hoạt động kinh doanh, khách hàng và đặt phòng tại ${stats.hotelName} (Mã cơ sở: #${stats.hotelId}).`
            : "Tài khoản của bạn hiện chưa được phân công quản lý khách sạn nào."
        }
        badge={isSuperAdmin ? "Super Admin" : "Hotel Admin"}
        badgeVariant={isSuperAdmin ? "warning" : "info"}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/receptionist/dashboard">
              <Button variant="secondary" size="sm" icon={<span>🛎️</span>}>
                Bàn Lễ Tân
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={loadData}
            >
              Làm Mới
            </Button>
          </div>
        }
      />

      {actionMsg && (
        <Alert
          type="info"
          message={actionMsg}
          onClose={() => setActionMsg("")}
        />
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isSuperAdmin ? "Tổng Người Dùng" : "Khách Hàng"}
          value={stats?.totalUsers || 0}
          icon="👥"
          trend={`${stats?.activeSessions || 0} phiên online`}
          trendType="neutral"
        />
        <StatCard
          title={isSuperAdmin ? "Tổng Đơn Đặt Phòng" : "Đơn Đặt Tại Khách Sạn"}
          value={systemBookings.length || stats?.totalBookings || 0}
          icon="📋"
          trend={`${stats?.confirmedBookings || 0} đã duyệt • ${stats?.checkedInBookings || 0} đang ở`}
          trendType="positive"
        />
        <StatCard
          title="Doanh Thu Thực Tế"
          value={stats?.totalRevenue || "0 đ"}
          icon="💳"
          trend={isSuperAdmin ? "Toàn bộ chuỗi" : "Tại cơ sở này"}
          trendType="positive"
        />
        <StatCard
          title={isSuperAdmin ? "Chuỗi Khách Sạn" : "Cơ Sở Hoạt Động"}
          value={stats?.totalHotels ?? 0}
          icon="🏨"
          trend={isSuperAdmin ? "Hệ thống toàn quốc" : stats?.hotelName || "Chưa gán khách sạn"}
          trendType="neutral"
        />
      </div>

      {/* Real-time System Bookings Table */}
      <Card>
        <CardHeader
          title={
            isSuperAdmin
              ? "Danh Sách Đơn Đặt Toàn Bộ Hệ Thống"
              : `Đơn Đặt Phòng Của ${stats?.hotelName || "Khách Sạn"}`
          }
          subtitle={`Truy xuất thời gian thực từ cơ sở dữ liệu (${systemBookings.length} đơn)`}
          action={
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
              {systemBookings.length} đơn đặt
            </span>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Phòng & Khách Sạn</th>
                <th className="py-3 px-4">Thời Gian Lưu Trú</th>
                <th className="py-3 px-4">Tổng Tiền & Thanh Toán</th>
                <th className="py-3 px-4">Trạng Thái Đơn</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {systemBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8">
                    <EmptyState
                      icon="📋"
                      title="Chưa có đơn đặt phòng nào"
                      description="Chưa có khách hàng nào đặt phòng trong phạm vi quản lý của bạn."
                    />
                  </td>
                </tr>
              ) : (
                systemBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      #{b.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {(b.userName || b.username || b.customerName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                            @{b.userName || b.username || b.customerName || "Khách"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {b.email || b.phone || "Khách hàng"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        🚪 Phòng {b.roomNumber || b.roomId}
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {b.hotelName || `Khách sạn #${b.hotelId}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        📅 {b.checkInDate} ➔ {b.checkOutDate}
                      </span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {b.createdAt && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                            🕒 Đặt {formatBookingTime(b.createdAt)}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          👥 {b.guestCount || 1} khách
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {typeof b.totalPrice === "number" ? b.totalPrice.toLocaleString("vi-VN") : b.totalPrice} đ
                      </div>
                      <div className="mt-1">
                        <button
                          onClick={() => handleTogglePayment(b.id, b.paymentStatus)}
                          className="focus:outline-none"
                          title="Bấm để đổi nhanh trạng thái thanh toán"
                        >
                          <StatusBadge status={b.paymentStatus || "UNPAID"} type="payment" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} type="booking" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleConfirmBooking(b.id)}
                          >
                            Duyệt
                          </Button>
                        )}
                        {b.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancelBooking(b.id, b.roomNumber || b.roomId)}
                          >
                            Hủy
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users Management Section */}
      <Card>
        <CardHeader
          title={
            isSuperAdmin
              ? "Quản Lý Tài Khoản Người Dùng Toàn Hệ Thống"
              : `Khách Hàng Tại ${stats?.hotelName || "Khách Sạn"}`
          }
          subtitle={
            isSuperAdmin
              ? `Tổng ${users.length} tài khoản trong hệ thống`
              : `Tổng ${users.length} tài khoản khách hàng liên kết với khách sạn của bạn`
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-48 sm:w-60">
                <Input
                  placeholder="Tìm username/email..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="w-32">
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  options={[
                    { value: "", label: "Tất cả Role" },
                    { value: "USER", label: "USER" },
                    { value: "ADMIN", label: "ADMIN" },
                    { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
                  ]}
                />
              </div>

              <div className="w-36">
                <Select
                  value={selectedActive}
                  onChange={(e) => setSelectedActive(e.target.value)}
                  options={[
                    { value: "", label: "Trạng Thái" },
                    { value: "true", label: "Hoạt Động" },
                    { value: "false", label: "Đã Khóa" },
                  ]}
                />
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tài Khoản</th>
                <th className="py-3 px-4">Email & Liên Hệ</th>
                <th className="py-3 px-4">Vai Trò (Role)</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác Bảo Mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8">
                    <EmptyState
                      icon="👥"
                      title="Không tìm thấy tài khoản"
                      description="Không có tài khoản nào khớp với bộ lọc tìm kiếm hiện tại."
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                          {u.username ? u.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                            #{u.id} {u.username}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {u.address || "Hệ thống"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium block">{u.email}</span>
                      <span className="text-slate-400 text-[11px]">{u.phone || "Chưa cập nhật"}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {isSuperAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold px-2.5 py-1 text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      ) : (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.active ? "ACTIVE" : "INACTIVE"} type="hotel" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleInspectSessions(u)}
                        >
                          Phiên
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant={u.active ? "danger" : "primary"}
                            onClick={() => handleToggleLock(u)}
                          >
                            {u.active ? "Khóa" : "Mở Khóa"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sessions Modal Inspector */}
      <Modal
        isOpen={!!inspectUser}
        onClose={() => setInspectUser(null)}
        title={`Phiên Đăng Nhập: ${inspectUser?.username}`}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setInspectUser(null)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-3">
          {loadingSessions ? (
            <LoadingState message="Đang truy xuất phiên hoạt động..." />
          ) : userSessions.length === 0 ? (
            <EmptyState
              icon="📱"
              title="Không có phiên hoạt động"
              description="Tài khoản này hiện không có phiên đăng nhập nào được lưu."
            />
          ) : (
            userSessions.map((s, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    💻 {s.deviceName || "Web Client"}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    IP: {s.ipAddress || "127.0.0.1"} • {s.createAt || "Gần đây"}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.revokedAt == null
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {s.revokedAt == null ? "ĐANG ONLINE" : "ĐÃ REVOKE"}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
