import React, { useEffect, useState } from "react";
import { getAdminHotels, createHotel, deleteHotel } from "../../services/hotelService";

export default function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedHotelRooms, setSelectedHotelRooms] = useState(null);
  const [roomTypeFilter, setRoomTypeFilter] = useState("ALL");
  const [roomStatusFilter, setRoomStatusFilter] = useState("ALL");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [msg, setMsg] = useState("");

  const userRole = localStorage.getItem("userRole") || "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [newHotel, setNewHotel] = useState({
    name: "",
    location: "",
    rating: 4.8,
    priceFrom: 750000,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    status: "ACTIVE",
    description: "",
  });

  const fetchHotelList = async () => {
    try {
      setLoading(true);
      const res = await getAdminHotels();
      const list = Array.isArray(res?.data) ? res.data : [];
      setHotels(list);
    } catch (err) {
      console.error("Error loading hotels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelList();
  }, []);

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert("Chỉ SUPER ADMIN mới có quyền tạo thêm khách sạn mới vào hệ thống.");
      return;
    }
    if (!newHotel.name || !newHotel.location) {
      alert("Vui lòng điền tên và địa chỉ khách sạn");
      return;
    }

    try {
      const res = await createHotel(newHotel);
      const created = res.data || newHotel;
      setHotels([created, ...hotels]);
      setShowModal(false);
      setMsg("✅ Tạo mới khách sạn thành công!");
      setNewHotel({
        name: "",
        location: "",
        rating: 4.8,
        priceFrom: 750000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        status: "ACTIVE",
        description: "",
      });
      setTimeout(() => setMsg(""), 3500);
    } catch (error) {
      alert("Lỗi khi tạo khách sạn: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      alert("Chỉ SUPER ADMIN mới có quyền xóa khách sạn khỏi hệ thống.");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa khách sạn này?")) {
      try {
        await deleteHotel(id);
        setHotels(hotels.filter(h => h.id !== id));
        setMsg("🗑️ Đã xóa khách sạn thành công!");
      } catch (err) {
        setMsg("❌ Lỗi khi xóa: " + (err.response?.data?.message || err.message));
      }
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
              isSuperAdmin
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-blue-100 text-blue-800 border-blue-200"
            }`}>
              {isSuperAdmin ? "👑 SUPER ADMIN - TOÀN HỆ THỐNG" : "🏨 ADMIN THƯỜNG - CHỦ KHÁCH SẠN"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isSuperAdmin ? "Quản lý tất cả khách sạn trong chuỗi" : "Quản lý riêng 1 khách sạn do bạn làm chủ"}
            </span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 mt-2">Quản Lý Khách Sạn (Hotels CRUD)</h1>
          <p className="text-slate-500 text-xs mt-1">
            {isSuperAdmin
              ? "Quản trị toàn diện danh mục khách sạn, chi nhánh, thông số phòng và biểu giá hệ thống"
              : "Quản trị thông tin và cơ cấu phòng của khách sạn do bạn làm chủ"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHotelList}
            className="border border-slate-300 bg-white text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            🔄 Tải Lại Real
          </button>
          {isSuperAdmin ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
            >
              <span>+</span> Thêm Khách Sạn Mới
            </button>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
              Khách sạn được chỉ định: 1
            </span>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
          {msg}
        </div>
      )}

      {/* Hotel Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-bold text-sm">
          Đang tải danh sách khách sạn từ Databases Real...
        </div>
      ) : hotels.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="text-slate-500 font-medium text-sm">Chưa có khách sạn nào được gán cho tài khoản của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => {
            const allRooms = Array.isArray(hotel.rooms)
              ? hotel.rooms
              : (hotel.floors || []).flatMap(f => f.rooms || []);

            return (
              <div
                key={hotel.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-black text-amber-500 shadow flex items-center gap-1">
                      ⭐ {hotel.rating || 5.0}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                      Mã KS: #{hotel.id}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{hotel.name}</h3>
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                      <span>📍</span> {hotel.location}
                    </p>
                    <p className="text-slate-600 text-xs mt-3 line-clamp-2 leading-relaxed">
                      {hotel.description || "Khách sạn tiêu chuẩn quốc tế đầy đủ tiện nghi, view đẹp và dịch vụ chuyên nghiệp."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Giá phòng từ</span>
                        <strong className="text-red-600 font-black text-sm">
                          {typeof hotel.priceFrom === "number" ? hotel.priceFrom.toLocaleString("vi-VN") : (hotel.priceFrom || 600000)} đ
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[11px]">Quy mô phòng</span>
                        <strong className="text-slate-800 font-bold">
                          {allRooms.length > 0 ? `${allRooms.length} phòng` : "Sơ đồ phòng"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedHotelRooms(hotel);
                      setRoomTypeFilter("ALL");
                      setRoomStatusFilter("ALL");
                      setRoomSearchQuery("");
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition"
                  >
                    Xem Chi Tiết Phòng ({allRooms.length})
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(hotel.id)}
                      className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition text-xs font-bold"
                      title="Xóa khách sạn (Chỉ Super Admin)"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create Hotel (Super Admin Only) */}
      {showModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold"
            >
              ×
            </button>

            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">
              Thêm Khách Sạn Mới (POST /api/hotels)
            </h3>

            <form onSubmit={handleCreateHotel} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Khách Sạn *</label>
                <input
                  required
                  type="text"
                  placeholder="VD: Sunshine Boutique Hotel & Spa"
                  value={newHotel.name}
                  onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa Chỉ / Vị Trí *</label>
                <input
                  required
                  type="text"
                  placeholder="VD: 88 Trần Phú, Lộc Thọ, Nha Trang"
                  value={newHotel.location}
                  onChange={(e) => setNewHotel({ ...newHotel, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Khởi Điểm (VNĐ)</label>
                  <input
                    type="number"
                    value={newHotel.priceFrom}
                    onChange={(e) => setNewHotel({ ...newHotel, priceFrom: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đánh Giá (Sao)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newHotel.rating}
                    onChange={(e) => setNewHotel({ ...newHotel, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Ảnh Khách Sạn</label>
                <input
                  type="url"
                  value={newHotel.image}
                  onChange={(e) => setNewHotel({ ...newHotel, image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô Tả Giới Thiệu</label>
                <textarea
                  rows="3"
                  placeholder="Mô tả các dịch vụ nổi bật, phòng ốc và tiện ích..."
                  value={newHotel.description}
                  onChange={(e) => setNewHotel({ ...newHotel, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl transition shadow"
                >
                  Tạo Khách Sạn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Hotel Rooms */}
      {selectedHotelRooms && (() => {
        const allRooms = Array.isArray(selectedHotelRooms.rooms)
          ? selectedHotelRooms.rooms
          : (selectedHotelRooms.floors || []).flatMap((f) => f.rooms || []);

        // Unique room types from this hotel (e.g. Standard Single, Superior Double, Standard Twin)
        const uniqueTypes = Array.from(
          new Set(allRooms.map((r) => r.type || "Tiêu chuẩn"))
        ).filter(Boolean);

        // Status counts
        const availableCount = allRooms.filter(
          (r) => r.status === "AVAILABLE" || !r.status || r.status === "TRỐNG"
        ).length;
        const occupiedCount = allRooms.filter(
          (r) => r.status === "OCCUPIED" || r.status === "BOOKED"
        ).length;
        const maintenanceCount = allRooms.filter(
          (r) => r.status === "MAINTENANCE"
        ).length;

        // Filtered rooms
        const filteredRooms = allRooms.filter((room) => {
          const roomType = room.type || "Tiêu chuẩn";
          const matchType = roomTypeFilter === "ALL" || roomType === roomTypeFilter;
          const matchStatus =
            roomStatusFilter === "ALL" ||
            (roomStatusFilter === "AVAILABLE" && (room.status === "AVAILABLE" || !room.status || room.status === "TRỐNG")) ||
            (roomStatusFilter === "OCCUPIED" && (room.status === "OCCUPIED" || room.status === "BOOKED")) ||
            (roomStatusFilter === "MAINTENANCE" && room.status === "MAINTENANCE");
          const roomName = (room.name || room.number || String(room.id) || "").toLowerCase();
          const matchSearch = !roomSearchQuery || roomName.includes(roomSearchQuery.toLowerCase());
          return matchType && matchStatus && matchSearch;
        });

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 relative max-h-[90vh] flex flex-col animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      Chi Tiết Cơ Cấu Phòng
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      Mã KS: #{selectedHotelRooms.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedHotelRooms.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <span>📍</span> {selectedHotelRooms.location}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHotelRooms(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xl font-bold transition"
                  title="Đóng modal"
                >
                  ×
                </button>
              </div>

              {/* Status summary banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tổng phòng:</span>
                  <span className="font-extrabold text-slate-900">{allRooms.length}</span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Còn Trống:
                  </span>
                  <span className="font-extrabold text-emerald-800">{availableCount}</span>
                </div>
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between">
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Đang Ở / Đặt:
                  </span>
                  <span className="font-extrabold text-amber-800">{occupiedCount}</span>
                </div>
                <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/80 flex items-center justify-between">
                  <span className="text-rose-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Bảo Trì:
                  </span>
                  <span className="font-extrabold text-rose-800">{maintenanceCount}</span>
                </div>
              </div>

              {/* Room Type Filter Tabs */}
              <div className="py-3 border-b border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Lọc Theo Hạng Phòng (Room Types):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hiển thị {filteredRooms.length}/{allRooms.length} phòng
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setRoomTypeFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      roomTypeFilter === "ALL"
                        ? "bg-slate-900 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>🗂️ Tất Cả</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        roomTypeFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {allRooms.length}
                    </span>
                  </button>

                  {uniqueTypes.map((type) => {
                    const count = allRooms.filter((r) => (r.type || "Tiêu chuẩn") === type).length;
                    const isActive = roomTypeFilter === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setRoomTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isActive
                            ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span>🛏️ {type}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isActive ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-filter row: Status and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Trạng thái:</span>
                    {[
                      { key: "ALL", label: "Tất cả" },
                      { key: "AVAILABLE", label: "🟢 Trống" },
                      { key: "OCCUPIED", label: "🟡 Đang ở" },
                      { key: "MAINTENANCE", label: "🔴 Bảo trì" },
                    ].map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setRoomStatusFilter(st.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          roomStatusFilter === st.key
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm số phòng (vd: 101, 201)..."
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                      className="text-xs px-3 py-1.5 pl-8 border border-slate-200 rounded-xl focus:border-red-500 outline-none w-full sm:w-56"
                    />
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
                    {roomSearchQuery && (
                      <button
                        onClick={() => setRoomSearchQuery("")}
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Rooms List Grid */}
              <div className="mt-4 overflow-y-auto flex-1 pr-1">
                {filteredRooms.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-semibold">
                      Không tìm thấy phòng nào phù hợp với bộ lọc đã chọn.
                    </p>
                    <button
                      onClick={() => {
                        setRoomTypeFilter("ALL");
                        setRoomStatusFilter("ALL");
                        setRoomSearchQuery("");
                      }}
                      className="mt-2 text-xs font-bold text-red-600 hover:underline"
                    >
                      Đặt lại bộ lọc
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRooms.map((room) => {
                      const isOccupied = room.status === "OCCUPIED" || room.status === "BOOKED";
                      const isMaintenance = room.status === "MAINTENANCE";

                      return (
                        <div
                          key={room.id}
                          className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                            isOccupied
                              ? "border-amber-300 bg-amber-50/40"
                              : isMaintenance
                              ? "border-rose-300 bg-rose-50/40"
                              : "border-slate-200 bg-white hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                              <span>🚪</span>
                              {room.name || `Phòng ${room.number || room.id}`}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                isOccupied
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : isMaintenance
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {isOccupied ? "● ĐANG Ở" : isMaintenance ? "● BẢO TRÌ" : "● CÒN TRỐNG"}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-200/80">
                              🛏️ {room.type || "Tiêu chuẩn"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: #{room.id}
                            </span>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Giá thuê:</span>
                            <span className="text-red-600 font-black text-xs">
                              {(room.price || 500000).toLocaleString("vi-VN")} đ <span className="text-[10px] font-normal text-slate-400">/ đêm</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
