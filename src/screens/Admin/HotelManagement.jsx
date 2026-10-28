import React, { useEffect, useState } from "react";
import ReceptionistRoomPlan from "../Receptionist/ReceptionistRoomPlan";
import { getAdminHotels, createHotel, deleteHotel } from "../../services/hotelService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button, { Input, Select } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

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
  const isReceptionist = userRole === "RECEPTIONIST";

  if (isReceptionist) {
    return <ReceptionistRoomPlan />;
  }

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
        setHotels(hotels.filter((h) => h.id !== id));
        setMsg("🗑️ Đã xóa khách sạn thành công!");
      } catch (err) {
        setMsg("❌ Lỗi khi xóa: " + (err.response?.data?.message || err.message));
      }
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title={isReceptionist ? "Sơ Đồ Phòng Khách Sạn Cơ Sở" : "Quản Lý Khách Sạn & Sơ Đồ Phòng"}
        subtitle={
          isSuperAdmin
            ? "Quản trị toàn diện danh mục khách sạn, chi nhánh, thông số phòng và biểu giá toàn hệ thống"
            : isReceptionist
            ? `Xem danh mục phòng, hiện trạng lưu trú và buồng phòng của khách sạn bạn phụ trách trực ${hotels[0]?.name ? `(${hotels[0]?.name})` : ""}`
            : "Quản trị thông tin và cơ cấu phòng của khách sạn được giao phụ trách"
        }
        badge={isSuperAdmin ? "Super Admin" : isReceptionist ? "Lễ Tân Cơ Sở" : "Hotel Admin"}
        badgeVariant={isSuperAdmin ? "warning" : isReceptionist ? "success" : "info"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={fetchHotelList}
            >
              Làm Mới
            </Button>
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={<span>+</span>}
                onClick={() => setShowModal(true)}
              >
                Thêm Khách Sạn
              </Button>
            )}
          </div>
        }
      />

      {msg && (
        <Alert
          type="info"
          message={msg}
          onClose={() => setMsg("")}
        />
      )}

      {/* Hotel Cards Grid */}
      {loading ? (
        <LoadingState message="Đang tải danh mục khách sạn..." />
      ) : hotels.length === 0 ? (
        <EmptyState
          icon="🏨"
          title="Chưa có khách sạn nào"
          description="Chưa có khách sạn nào được liên kết với tài khoản quản trị của bạn."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotels.map((hotel) => {
            const allRooms = Array.isArray(hotel.rooms)
              ? hotel.rooms
              : (hotel.floors || []).flatMap((f) => f.rooms || []);

            return (
              <Card key={hotel.id} className="overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={
                        hotel.image ||
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-500 shadow flex items-center gap-1">
                      ⭐ {hotel.rating || 5.0}
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Mã KS: #{hotel.id}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {hotel.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 flex items-center gap-1">
                      <span>📍</span> {hotel.location}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-2.5 line-clamp-2 leading-relaxed">
                      {hotel.description ||
                        "Khách sạn tiêu chuẩn quốc tế đầy đủ tiện nghi, view đẹp và dịch vụ chuyên nghiệp."}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Giá phòng từ</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {typeof hotel.priceFrom === "number"
                            ? hotel.priceFrom.toLocaleString("vi-VN")
                            : hotel.priceFrom || 600000}{" "}
                          đ
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Cơ cấu phòng</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                          {allRooms.length > 0 ? `${allRooms.length} phòng` : "Sơ đồ phòng"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => {
                      setSelectedHotelRooms(hotel);
                      setRoomTypeFilter("ALL");
                      setRoomStatusFilter("ALL");
                      setRoomSearchQuery("");
                    }}
                  >
                    Xem Chi Tiết Phòng ({allRooms.length})
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(hotel.id)}
                      title="Xóa khách sạn"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Create Hotel (Super Admin Only) */}
      <Modal
        isOpen={showModal && isSuperAdmin}
        onClose={() => setShowModal(false)}
        title="Thêm Khách Sạn Mới Vào Hệ Thống"
        size="md"
      >
        <form onSubmit={handleCreateHotel} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên Khách Sạn *
            </label>
            <Input
              required
              placeholder="VD: Vinpearl Luxury Landmark 81"
              value={newHotel.name}
              onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa Chỉ / Vị Trí *
            </label>
            <Input
              required
              placeholder="VD: 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM"
              value={newHotel.location}
              onChange={(e) => setNewHotel({ ...newHotel, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Giá phòng khởi điểm (VNĐ)
              </label>
              <Input
                type="number"
                value={newHotel.priceFrom}
                onChange={(e) => setNewHotel({ ...newHotel, priceFrom: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đánh giá (Rating sao)
              </label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newHotel.rating}
                onChange={(e) => setNewHotel({ ...newHotel, rating: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL Hình Ảnh Đại Diện
            </label>
            <Input
              value={newHotel.image}
              onChange={(e) => setNewHotel({ ...newHotel, image: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô Tả Giới Thiệu
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 text-xs outline-none focus:border-indigo-500"
              placeholder="Giới thiệu về cảnh quan, dịch vụ..."
              value={newHotel.description}
              onChange={(e) => setNewHotel({ ...newHotel, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Xác Nhận Tạo Khách Sạn
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Room Detail View */}
      <Modal
        isOpen={!!selectedHotelRooms}
        onClose={() => setSelectedHotelRooms(null)}
        title={
          selectedHotelRooms
            ? `Cơ Cấu Phòng: ${selectedHotelRooms.name} (Mã #${selectedHotelRooms.id})`
            : "Chi Tiết Phòng"
        }
        size="xl"
      >
        {selectedHotelRooms && (() => {
          const allRooms = Array.isArray(selectedHotelRooms.rooms)
            ? selectedHotelRooms.rooms
            : (selectedHotelRooms.floors || []).flatMap((f) => f.rooms || []);

          const uniqueTypes = Array.from(
            new Set(allRooms.map((r) => r.type || "Tiêu chuẩn"))
          ).filter(Boolean);

          const availableCount = allRooms.filter(
            (r) => r.status === "AVAILABLE" || !r.status || r.status === "TRỐNG"
          ).length;
          const occupiedCount = allRooms.filter(
            (r) => r.status === "OCCUPIED" || r.status === "BOOKED"
          ).length;
          const maintenanceCount = allRooms.filter((r) => r.status === "MAINTENANCE").length;

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
            <div className="space-y-4 text-xs">
              {/* Status summary banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tổng phòng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{allRooms.length}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                    🟢 Còn Trống:
                  </span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">{availableCount}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                    🟡 Đang Ở:
                  </span>
                  <span className="font-bold text-amber-800 dark:text-amber-200">{occupiedCount}</span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                  <span className="text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
                    🔴 Bảo Trì:
                  </span>
                  <span className="font-bold text-rose-800 dark:text-rose-200">{maintenanceCount}</span>
                </div>
              </div>

              {/* Room Type Filter Tabs */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Lọc theo hạng phòng:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setRoomTypeFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      roomTypeFilter === "ALL"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <span>Tất Cả ({allRooms.length})</span>
                  </button>

                  {uniqueTypes.map((type) => {
                    const count = allRooms.filter((r) => (r.type || "Tiêu chuẩn") === type).length;
                    const isActive = roomTypeFilter === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setRoomTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                          isActive
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <span>🛏️ {type} ({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 mr-1">Trạng thái:</span>
                    {[
                      { key: "ALL", label: "Tất cả" },
                      { key: "AVAILABLE", label: "Trống" },
                      { key: "OCCUPIED", label: "Đang ở" },
                      { key: "MAINTENANCE", label: "Bảo trì" },
                    ].map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setRoomStatusFilter(st.key)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                          roomStatusFilter === st.key
                            ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-full sm:w-56">
                    <Input
                      placeholder="Tìm số phòng..."
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="max-h-96 overflow-y-auto pr-1">
                {filteredRooms.length === 0 ? (
                  <EmptyState
                    icon="🚪"
                    title="Không tìm thấy phòng phù hợp"
                    description="Thử thay đổi bộ lọc hạng phòng hoặc trạng thái phòng."
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredRooms.map((room) => {
                      const isAvailable = room.status === "AVAILABLE" || !room.status || room.status === "TRỐNG";
                      const isOccupied = room.status === "OCCUPIED" || room.status === "BOOKED";
                      const isMaintenance = room.status === "MAINTENANCE";

                      return (
                        <div
                          key={room.id}
                          className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                            isAvailable
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
                              : isOccupied
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                              : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                #{room.name || room.number || room.id}
                              </span>
                              <span className="text-[10px]">
                                {isAvailable ? "🟢" : isOccupied ? "🟡" : "🔴"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                              {room.type || "Tiêu chuẩn"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Tầng {room.floor || 1}
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                              {typeof room.price === "number" ? room.price.toLocaleString("vi-VN") : room.price} đ
                            </span>
                            <StatusBadge
                              status={isAvailable ? "AVAILABLE" : isOccupied ? "OCCUPIED" : "MAINTENANCE"}
                              type="room"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
