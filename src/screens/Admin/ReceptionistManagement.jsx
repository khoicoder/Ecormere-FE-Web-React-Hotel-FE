import React, { useState, useEffect } from "react";
import {
  getReceptionistsAPI,
  createReceptionistAPI,
  toggleReceptionistStatusAPI,
  resetReceptionistPasswordAPI
} from "../../services/staffService";

export default function ReceptionistManagement() {
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State: Create Receptionist
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    address: ""
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Modal State: Reset Password
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");

  const userRole = localStorage.getItem("userRole");

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReceptionistsAPI();
      setReceptionists(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải danh sách lễ tân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setError(null);
      await createReceptionistAPI(formData);
      setSuccessMsg(`Đã tạo thành công tài khoản lễ tân: @${formData.username}`);
      setShowCreateModal(false);
      setFormData({
        username: "",
        password: "",
        email: "",
        phone: "",
        address: ""
      });
      fetchReceptionists();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Lỗi khi tạo tài khoản lễ tân");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentUsername, currentActive) => {
    const confirmAction = window.confirm(
      `Bạn có chắc chắn muốn ${currentActive ? "KHÓA" : "MỞ KHÓA"} tài khoản lễ tân @${currentUsername}?`
    );
    if (!confirmAction) return;

    try {
      await toggleReceptionistStatusAPI(id);
      setSuccessMsg(`Đã ${currentActive ? "khóa" : "kích hoạt"} tài khoản @${currentUsername}`);
      fetchReceptionists();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err?.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    try {
      setResetLoading(true);
      await resetReceptionistPasswordAPI(selectedStaff.id, newPassword);
      setSuccessMsg(`Đã đổi mật khẩu thành công cho lễ tân @${selectedStaff.username}`);
      setShowResetModal(false);
      setNewPassword("");
      setSelectedStaff(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setResetLoading(false);
    }
  };

  const filteredStaff = receptionists.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.username?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.phone?.includes(term) ||
      r.hotelName?.toLowerCase().includes(term)
    );
  });

  const hotelNameHeader = receptionists[0]?.hotelName || "Khách Sạn Của Bạn";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              🛎️ Phân Hệ Quản Trị Nhân Sự
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Quản Lý & Tạo Tài Khoản Lễ Tân
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Cơ sở phụ trách: <span className="font-bold text-emerald-400">{hotelNameHeader}</span>. Mỗi Admin khách sạn có toàn quyền tạo và quản lý tài khoản cho đội ngũ lễ tân của riêng mình.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <span className="text-xl leading-none">➕</span>
            <span>Tạo Tài Khoản Lễ Tân Mới</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-3 font-semibold text-sm shadow-sm">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl flex items-center gap-3 font-semibold text-sm shadow-sm">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Số Lễ Tân</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{receptionists.length}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold">
            👥
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang Hoạt Động</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {receptionists.filter((r) => r.active).length}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
            🟢
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang Bị Khóa</p>
            <p className="text-3xl font-black text-rose-600 mt-1">
              {receptionists.filter((r) => !r.active).length}
            </p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl font-bold">
            🔒
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm">
        <span className="text-slate-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm theo Tên đăng nhập, Email, Số điện thoại hoặc Khách sạn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm font-medium bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
          >
            Xóa
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin text-3xl">⏳</div>
            <p className="text-slate-500 font-bold text-sm mt-3">Đang tải danh sách lễ tân...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">🛎️</div>
            <p className="text-slate-700 font-bold text-base mt-2">Chưa có tài khoản lễ tân nào</p>
            <p className="text-slate-400 text-xs mt-1">Nhấn nút "Tạo Tài Khoản Lễ Tân Mới" phía trên để cấp tài khoản cho nhân viên của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Lễ Tân</th>
                  <th className="py-4 px-6">Khách Sạn Trực Thuộc</th>
                  <th className="py-4 px-6">Liên Hệ</th>
                  <th className="py-4 px-6">Địa Chỉ / Ca Trực</th>
                  <th className="py-4 px-6">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.staffId || staff.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md">
                          {staff.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">@{staff.username}</p>
                          <p className="text-xs text-slate-400 font-mono">ID: #{staff.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>🏨</span>
                        <span>{staff.hotelName || "Chưa phân bổ"}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-xs text-slate-600">📧 {staff.email || "—"}</p>
                      <p className="text-xs text-slate-600 mt-0.5">📞 {staff.phone || "—"}</p>
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {staff.address || "Quầy Lễ Tân"}
                    </td>

                    <td className="py-4 px-6">
                      {staff.active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Đã khóa
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowResetModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Đổi mật khẩu"
                        >
                          🔑 Đổi MK
                        </button>

                        <button
                          onClick={() => handleToggleStatus(staff.id, staff.username, staff.active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            staff.active
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {staff.active ? "🔒 Khóa" : "🔓 Mở"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE RECEPTIONIST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛎️</span>
                  <h3 className="text-lg font-black tracking-tight">Tạo Tài Khoản Lễ Tân Mới</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-indigo-200 text-xs mt-1">
                Tài khoản được tạo sẽ tự động gắn quyền Lễ tân cho khách sạn <span className="font-bold text-white">{hotelNameHeader}</span>.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: letan_ca1"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="letan@hotel.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0987654321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ca trực / Ghi chú bàn giao
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ca sáng 6h - 14h / Quầy Sảnh B"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {createLoading ? "Đang tạo..." : "Xác nhận Tạo Lễ Tân"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showResetModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">🔑 Đổi Mật Khẩu Lễ Tân</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Bạn đang đặt lại mật khẩu cho tài khoản:{" "}
                <span className="font-bold text-slate-900">@{selectedStaff.username}</span>
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50"
                >
                  {resetLoading ? "Đang lưu..." : "Lưu mật khẩu mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
