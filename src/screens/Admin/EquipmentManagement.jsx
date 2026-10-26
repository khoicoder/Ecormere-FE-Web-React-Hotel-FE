import React, { useEffect, useState } from "react";
import {
  getEquipmentByHotel,
  updateEquipmentStatus,
  createEquipment,
  deleteEquipment
} from "../../services/equipmentService";
import { getAdminHotels } from "../../services/hotelService";

export default function EquipmentManagement() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const userRole = localStorage.getItem("userRole") || "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  useEffect(() => {
    const loadHotels = async () => {
      const res = await getAdminHotels();
      const list = Array.isArray(res?.data) ? res.data : [];
      setHotels(list);
      if (list.length > 0) {
        setSelectedHotelId(list[0].id);
      }
    };
    loadHotels();
  }, []);

  const [newEquipment, setNewEquipment] = useState({
    name: "",
    brand: "",
    serialNumber: "",
    category: "HVAC",
    roomId: 101,
    status: "WORKING",
    description: "",
  });

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = await getEquipmentByHotel(selectedHotelId);
      setEquipmentList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching equipment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [selectedHotelId]);

  const handleStatusChange = async (eqId, newStatus) => {
    await updateEquipmentStatus(eqId, { status: newStatus });
    setEquipmentList(equipmentList.map(e => e.id === eqId ? { ...e, status: newStatus } : e));
    setMsg(`✅ Đã cập nhật trạng thái thiết bị #${eqId} sang "${newStatus}"`);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    if (!newEquipment.name) {
      alert("Vui lòng nhập tên thiết bị!");
      return;
    }
    const created = await createEquipment({
      ...newEquipment,
      hotelId: selectedHotelId
    });
    setEquipmentList([created, ...equipmentList]);
    setShowAddModal(false);
    setMsg("✅ Thêm thiết bị mới thành công (PATCH /api/equipment)!");
    setNewEquipment({
      name: "",
      brand: "",
      serialNumber: "",
      category: "HVAC",
      roomId: 101,
      status: "WORKING",
      description: "",
    });
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDeleteEquipment = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa thiết bị này?")) {
      await deleteEquipment(id);
      setEquipmentList(equipmentList.filter(e => e.id !== id));
      setMsg("🗑️ Đã xóa thiết bị thành công!");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const filteredList = equipmentList.filter(item => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "WORKING":
        return <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">● Hoạt Động Tốt</span>;
      case "UNDER_MAINTENANCE":
        return <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">● Đang Bảo Trì</span>;
      case "BROKEN":
        return <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">● Bị Hỏng Hóc</span>;
      case "RETIRED":
        return <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">● Đã Thanh Lý</span>;
      default:
        return <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-red-500/20 text-red-600 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-red-200">
            Equipment Asset Management
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">Quản Lý Thiết Bị Khách Sạn (Equipment CRUD)</h1>
          <p className="text-slate-500 text-xs mt-1">
            Theo dõi, định danh serial, kiểm tra phòng và luân chuyển trạng thái máy lạnh, TV, khóa cửa tử
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded-xl shadow-sm text-xs font-bold">
            <span className="text-slate-500">Khách Sạn:</span>
            {hotels.length > 1 ? (
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(Number(e.target.value))}
                className="bg-transparent text-slate-900 font-extrabold outline-none cursor-pointer"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-slate-900 font-extrabold">
                {hotels[0]?.name || "Khách Sạn Của Bạn"}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
          >
            <span>+</span> Thêm Thiết Bị Mới
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
          {msg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <span className="text-slate-400 mr-2">Lọc trạng thái:</span>
        {[
          { key: "ALL", label: `Tất Cả (${equipmentList.length})` },
          { key: "WORKING", label: "Hoạt Động Tốt" },
          { key: "UNDER_MAINTENANCE", label: "Đang Bảo Trì" },
          { key: "BROKEN", label: "Hỏng Hóc" },
          { key: "RETIRED", label: "Đã Thanh Lý" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === tab.key
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-slate-500 font-bold">
          Đang tải danh sách thiết bị...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 text-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-slate-700 font-bold text-sm">Không tìm thấy thiết bị nào phù hợp tiêu chí lọc.</p>
          <p className="text-slate-400 text-xs mt-1">Hãy chuyển bộ lọc hoặc bấm "Thêm Thiết Bị Mới" để đăng ký tài sản mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200">
                    {item.category || "GENERAL"} • S/N: {item.serialNumber}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <h3 className="text-base font-black text-slate-900">{item.name}</h3>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>🏢 Vị trí: <strong className="text-slate-900">Phòng {item.roomNumber || item.roomId}</strong></p>
                  <p>🏷️ Nhãn hiệu: <span className="font-semibold text-slate-700">{item.brand || "Tiêu chuẩn"}</span></p>
                  {item.description && (
                    <p className="text-slate-500 text-[11px] italic mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Status Switcher & Delete */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Chuyển trạng thái:</span>
                  <button
                    onClick={() => handleDeleteEquipment(item.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-extrabold"
                    title="Xóa thiết bị"
                  >
                    🗑️ Xóa
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                  {item.status !== "WORKING" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "WORKING")}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-1 rounded-lg transition"
                    >
                      ✓ Hoạt Động
                    </button>
                  )}
                  {item.status !== "UNDER_MAINTENANCE" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "UNDER_MAINTENANCE")}
                      className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 py-1 rounded-lg transition"
                    >
                      🔧 Bảo Trì
                    </button>
                  )}
                  {item.status !== "BROKEN" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "BROKEN")}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 py-1 rounded-lg transition"
                    >
                      ⚠️ Báo Hỏng
                    </button>
                  )}
                  {item.status !== "RETIRED" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "RETIRED")}
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 py-1 rounded-lg transition"
                    >
                      📦 Thanh Lý
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Equipment */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold"
            >
              ×
            </button>

            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">
              Thêm Thiết Bị Mới (PATCH /api/equipment)
            </h3>

            <form onSubmit={handleCreateEquipment} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Thiết Bị *</label>
                <input
                  required
                  placeholder="VD: Điều Hòa Daikin 2HP, Tivi Sony 55 inch..."
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhãn Hiệu (Brand)</label>
                  <input
                    placeholder="VD: Daikin, Sony, Hafele"
                    value={newEquipment.brand}
                    onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Serial (S/N)</label>
                  <input
                    placeholder="VD: DK-88219"
                    value={newEquipment.serialNumber}
                    onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phòng Số</label>
                  <input
                    type="number"
                    placeholder="101, 102..."
                    value={newEquipment.roomId}
                    onChange={(e) => setNewEquipment({ ...newEquipment, roomId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân Loại</label>
                  <select
                    value={newEquipment.category}
                    onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none bg-white font-semibold"
                  >
                    <option value="HVAC">HVAC (Điều Hòa/Quạt)</option>
                    <option value="ELECTRONICS">ELECTRONICS (Tivi/Âm thanh)</option>
                    <option value="SECURITY">SECURITY (Khóa từ/Camera)</option>
                    <option value="PLUMBING">PLUMBING (Vệ sinh/Nước nóng)</option>
                    <option value="HEATING">HEATING (Lò sưởi)</option>
                    <option value="APPLIANCE">APPLIANCE (Gia dụng)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng Thái Ban Đầu</label>
                <select
                  value={newEquipment.status}
                  onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none bg-white font-semibold"
                >
                  <option value="WORKING">Hoạt Động Tốt (WORKING)</option>
                  <option value="UNDER_MAINTENANCE">Đang Bảo Trì (UNDER_MAINTENANCE)</option>
                  <option value="BROKEN">Bị Hỏng Hóc (BROKEN)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi Chú Mô Tả</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả vị trí lắp đặt hoặc hướng dẫn vận hành..."
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-md hover:from-red-500 hover:to-rose-500 transition"
                >
                  Đăng Ký Thiết Bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

