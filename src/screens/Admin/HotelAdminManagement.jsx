import React, { useState, useEffect } from "react";
import { getHotelAdminsAPI, createHotelAdminAPI } from "../../services/staffService";

export default function HotelAdminManagement() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    hotelId: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    address: ""
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHotelAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHotelAdminsAPI();
      setHotels(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải danh sách Admin khách sạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelAdmins();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hotelId) {
      alert("Vui lòng chọn khách sạn cần bổ nhiệm Admin lớn!");
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      await createHotelAdminAPI(formData);
      setSuccessMsg(`Đã tạo thành công Admin lớn @${formData.username} cho khách sạn!`);
      setShowCreateModal(false);
      setFormData({
        hotelId: "",
        username: "",
        password: "",
        email: "",
        phone: "",
        address: ""
      });
      fetchHotelAdmins();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || "Lỗi khi tạo tài khoản Admin khách sạn");
    } finally {
      setCreateLoading(false);
    }
  };

  const hotelsWithoutAdmin = hotels.filter((h) => !h.hasAdmin);
  const hotelsWithAdmin = hotels.filter((h) => h.hasAdmin);

  const filteredHotels = hotels.filter((h) => {
    const term = searchTerm.toLowerCase();
    return (
      h.hotelName?.toLowerCase().includes(term) ||
      h.hotelLocation?.toLowerCase().includes(term) ||
      h.adminUsername?.toLowerCase().includes(term) ||
      h.adminEmail?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-900/50 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              👑 Super Admin Control Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Phân Quyền & Quản Lý Admin Lớn Khách Sạn
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Nguyên tắc nghiệp vụ chuẩn: <span className="text-purple-300 font-bold">Mỗi khách sạn chỉ có DUY NHẤT 1 Admin Lớn phụ trách</span>. Super Admin có toàn quyền tạo mới tài khoản cho các Admin nhỏ hơn và ủy quyền điều hành từng khách sạn.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-950/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <span className="text-xl leading-none">➕</span>
            <span>Tạo Admin Cho Khách Sạn</span>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Khách Sạn</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{hotels.length}</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center text-xl font-bold">
            🏨
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã Có Admin Lớn</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{hotelsWithAdmin.length}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
            ✅
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Chưa Có Admin</p>
            <p className="text-3xl font-black text-rose-600 mt-1">{hotelsWithoutAdmin.length}</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm">
        <span className="text-slate-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm theo Tên khách sạn, Địa chỉ, hoặc Tên đăng nhập Admin..."
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

      {/* Hotel Admin Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block animate-spin text-3xl">⏳</div>
            <p className="text-slate-500 font-bold text-sm mt-3">Đang tải danh sách khách sạn & admin...</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-bold">Không tìm thấy khách sạn phù hợp.</p>
          </div>
        ) : (
          filteredHotels.map((hotel) => (
            <div
              key={hotel.hotelId}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Hotel ID: #{hotel.hotelId}
                    </span>
                    <h3 className="font-black text-slate-900 text-base leading-snug mt-0.5">
                      {hotel.hotelName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <span>📍</span>
                      <span>{hotel.hotelLocation || "Chưa cập nhật địa chỉ"}</span>
                    </p>
                  </div>

                  {hotel.hasAdmin ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                      <span>👑</span> 1 Admin Lớn
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                      <span>⚠️</span> Khuyết Admin
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    🛏️ {hotel.roomCount} Phòng
                  </span>
                </div>

                {/* Admin Details Box */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Quản Trị Viên Phụ Trách (Admin Lớn)
                  </p>

                  {hotel.hasAdmin ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                          {hotel.adminUsername?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">
                            @{hotel.adminUsername}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            User ID: #{hotel.adminId}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600 font-medium">
                        <p>📧 {hotel.adminEmail || "—"}</p>
                        <p>📞 {hotel.adminPhone || "—"}</p>
                        <p className="flex items-center gap-1.5 pt-1">
                          <span className={`w-2 h-2 rounded-full ${hotel.adminActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          <span className={hotel.adminActive ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                            {hotel.adminActive ? "Đang Hoạt Động" : "Tài Khoản Đã Khóa"}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-center">
                      <p className="text-xs font-bold text-amber-800">Khách sạn chưa có Admin lớn phụ trách</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">Nhấn nút bên dưới để tạo và bổ nhiệm Admin lớn.</p>
                      <button
                        onClick={() => {
                          setFormData({ ...formData, hotelId: hotel.hotelId });
                          setShowCreateModal(true);
                        }}
                        className="mt-3 px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
                      >
                        ➕ Bổ Nhiệm Admin Ngay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: CREATE HOTEL ADMIN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👑</span>
                  <h3 className="text-lg font-black tracking-tight">Tạo & Bổ Nhiệm Admin Khách Sạn</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-purple-200 text-xs mt-1">
                Tài khoản mới sẽ có role <span className="font-bold text-white">ADMIN</span> và được trao quyền Admin lớn của khách sạn được chọn.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Hotel Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Chọn Khách Sạn Bổ Nhiệm <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.hotelId}
                  onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
                >
                  <option value="">-- Chọn khách sạn --</option>
                  {hotels.map((h) => (
                    <option key={h.hotelId} value={h.hotelId} disabled={h.hasAdmin}>
                      {h.hotelName} {h.hasAdmin ? `(⚠️ Đã có Admin: @${h.adminUsername})` : " (✅ Chưa có Admin)"}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Mỗi khách sạn chỉ có 1 Admin lớn. Các khách sạn đã có Admin sẽ bị vô hiệu hóa để đảm bảo logic.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: admin_hcm"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@hotel.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Địa chỉ liên hệ
                </label>
                <input
                  type="text"
                  placeholder="Địa chỉ văn phòng quản lý"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                >
                  {createLoading ? "Đang tạo..." : "Xác nhận Tạo & Bổ Nhiệm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
