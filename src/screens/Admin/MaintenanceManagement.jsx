import React, { useEffect, useState } from "react";
import {
  getAllMaintenance,
  createMaintenanceTicket,
  updateMaintenanceStatus
} from "../../services/maintenanceService";
import { getAdminHotels } from "../../services/hotelService";

export default function MaintenanceManagement() {
  const [tickets, setTickets] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedHotelFilter, setSelectedHotelFilter] = useState(0); // 0 = all
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const userRole = localStorage.getItem("userRole") || "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [newTicket, setNewTicket] = useState({
    hotelId: 1,
    hotelName: "Grand Luxury Hotel & Spa - TP.HCM",
    roomId: 101,
    roomNumber: "101",
    equipmentName: "Điều Hòa Daikin",
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "REPAIR",
    assignedStaff: "Kỹ sư Kỹ thuật"
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const [data, hotelsRes] = await Promise.all([
        getAllMaintenance(),
        getAdminHotels()
      ]);
      const hotelList = Array.isArray(hotelsRes?.data) ? hotelsRes.data : [];
      setHotels(hotelList);

      let allTickets = Array.isArray(data) ? data : [];
      if (!isSuperAdmin && hotelList.length > 0) {
        const ownedId = hotelList[0].id;
        setSelectedHotelFilter(ownedId);
        allTickets = allTickets.filter(t => Number(t.hotelId) === Number(ownedId));
      }
      setTickets(allTickets);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) {
      alert("Vui lòng nhập tiêu đề và mô tả sự cố!");
      return;
    }

    const created = await createMaintenanceTicket(newTicket);
    setTickets([created, ...tickets]);
    setShowForm(false);
    setMsg("✅ Đã tạo phiếu yêu cầu bảo trì mới thành công (POST /api)!");
    setNewTicket({
      hotelId: 1,
      hotelName: "Grand Luxury Hotel & Spa - TP.HCM",
      roomId: 101,
      roomNumber: "101",
      equipmentName: "Điều Hòa Daikin",
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "REPAIR",
      assignedStaff: "Kỹ sư Kỹ thuật"
    });
    setTimeout(() => setMsg(""), 3000);
  };

  const handleUpdateStatus = async (ticket, newStatus) => {
    try {
      await updateMaintenanceStatus(ticket.hotelId || 1, ticket.id, newStatus);
      const displayStatus = (newStatus === "RESOLVED" || newStatus === "COMPLETED") ? "COMPLETED" : ((newStatus === "OPEN" || newStatus === "PENDING") ? "PENDING" : newStatus);
      setTickets(tickets.map(t => t.id === ticket.id ? { ...t, status: displayStatus } : t));
      setMsg(`✅ Đã cập nhật trạng thái phiếu #${ticket.ticketCode || ticket.id} sang "${newStatus === 'COMPLETED' ? 'Đã Khắc Phục' : newStatus === 'IN_PROGRESS' ? 'Đang Sửa' : 'Mở Lại'}"!`);
    } catch (err) {
      setMsg(`❌ Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
    }
    setTimeout(() => setMsg(""), 3500);
  };

  const filteredTickets = tickets.filter(t => {
    let matchStatus = true;
    if (statusFilter === "OPEN") {
      matchStatus = t.status === "OPEN" || t.status === "PENDING";
    } else if (statusFilter === "IN_PROGRESS") {
      matchStatus = t.status === "IN_PROGRESS";
    } else if (statusFilter === "RESOLVED") {
      matchStatus = t.status === "RESOLVED" || t.status === "COMPLETED";
    }
    const matchHotel = selectedHotelFilter === 0 || Number(t.hotelId) === Number(selectedHotelFilter);
    return matchStatus && matchHotel;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
      case "RESOLVED":
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">✓ Đã Xử Lý</span>;
      case "IN_PROGRESS":
        return <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full">⚙️ Đang Sửa Chữa</span>;
      case "OPEN":
      case "PENDING":
        return <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full">⏳ Mới Tiếp Nhận</span>;
      case "CANCELLED":
        return <span className="bg-slate-200 text-slate-700 text-xs font-black px-3 py-1 rounded-full">✕ Đã Đóng</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-black px-3 py-1 rounded-full">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "HIGH":
      case "EMERGENCY":
        return <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded border border-rose-200">Ưu Tiên Cao</span>;
      case "MEDIUM":
        return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">Trung Bình</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">Tiêu Chuẩn</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-red-500/20 text-red-600 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-red-200">
            Maintenance & Work Orders
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">Quản Lý Bảo Trì & Sửa Chữa (Maintenance CRUD)</h1>
          <p className="text-slate-500 text-xs mt-1">
            Xử lý phiếu sự cố kỹ thuật phòng, thiết bị, phân công nhân sự và nghiệm thu xử lý
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
          >
            <span>+</span> {showForm ? "Đóng Form" : "Tạo Phiếu Sự Cố Mới"}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
          {msg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2 font-bold">
          <span className="text-slate-400 mr-1">Trạng thái:</span>
          {[
            { key: "ALL", label: `Tất Cả (${tickets.length})` },
            { key: "OPEN", label: "Mới Tiếp Nhận" },
            { key: "IN_PROGRESS", label: "Đang Sửa" },
            { key: "RESOLVED", label: "Đã Xong" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold">Khách Sạn:</span>
          {isSuperAdmin ? (
            <select
              value={selectedHotelFilter}
              onChange={(e) => setSelectedHotelFilter(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 outline-none"
            >
              <option value={0}>Tất cả khách sạn</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          ) : (
            <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
              {hotels[0]?.name || "Khách Sạn Của Bạn"}
            </span>
          )}
        </div>
      </div>

      {/* Create Ticket Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4 max-w-2xl mx-auto animate-fadeIn text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-black text-slate-900 text-base">Tạo Phiếu Sự Cố Bảo Trì Mới (POST /api)</h3>
            <span className="text-slate-400">Ghi nhận thông tin kỹ thuật</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khách Sạn *</label>
              <select
                value={newTicket.hotelId}
                onChange={(e) => {
                  const hId = Number(e.target.value);
                  const found = hotelList.find(h => h.id === hId);
                  setNewTicket({
                    ...newTicket,
                    hotelId: hId,
                    hotelName: found ? found.name : ""
                  });
                }}
                className="w-full border rounded-xl p-2.5 border-slate-300 outline-none font-semibold"
              >
                {hotelList.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phòng Số *</label>
              <input
                required
                placeholder="VD: 101, 206, 302..."
                value={newTicket.roomNumber}
                onChange={(e) => setNewTicket({ ...newTicket, roomNumber: e.target.value, roomId: Number(e.target.value) || 101 })}
                className="w-full border rounded-xl p-2.5 border-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thiết Bị Sự Cố</label>
              <input
                placeholder="VD: Máy lạnh Daikin, Khóa từ..."
                value={newTicket.equipmentName}
                onChange={(e) => setNewTicket({ ...newTicket, equipmentName: e.target.value })}
                className="w-full border rounded-xl p-2.5 border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mức Độ Ưu Tiên</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                className="w-full border rounded-xl p-2.5 border-slate-300 outline-none font-semibold"
              >
                <option value="LOW">Thấp (LOW)</option>
                <option value="MEDIUM">Trung Bình (MEDIUM)</option>
                <option value="HIGH">Khẩn Cấp (HIGH)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phân Loại</label>
              <select
                value={newTicket.type}
                onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                className="w-full border rounded-xl p-2.5 border-slate-300 outline-none font-semibold"
              >
                <option value="REPAIR">Sửa Chữa (REPAIR)</option>
                <option value="ROUTINE">Định Kỳ (ROUTINE)</option>
                <option value="EMERGENCY">Khẩn Cấp (EMERGENCY)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tiêu Đề Phiếu *</label>
            <input
              required
              placeholder="VD: Điều hòa phòng 105 bị rò rỉ nước ngưng"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              className="w-full border rounded-xl p-2.5 border-slate-300 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô Tả Chi Tiết Hiện Trạng Sự Cố *</label>
            <textarea
              required
              rows="3"
              placeholder="Ghi rõ triệu chứng, tiếng ồn, mã lỗi hiển thị hoặc cảnh báo an toàn..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              className="w-full border rounded-xl p-2.5 border-slate-300 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-md hover:from-red-500 hover:to-rose-500 transition"
            >
              Tạo & Phân Công Phiếu
            </button>
          </div>
        </form>
      )}

      {/* Ticket Cards List */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-slate-500 font-bold">
          Đang tải danh sách phiếu bảo trì...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 text-center">
          <span className="text-3xl mb-2">📋</span>
          <p className="text-slate-700 font-bold text-sm">Không có phiếu sự cố nào phù hợp.</p>
          <p className="text-slate-400 text-xs mt-1">Tất cả thiết bị phòng khách sạn đang hoạt động ổn định.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                    {t.ticketCode || `MNT-${t.id}`}
                  </span>
                  <span className="font-extrabold text-slate-900 text-base">{t.title || t.issue || "Sự cố bảo trì thiết bị"}</span>
                  {getPriorityBadge(t.priority)}
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                  <span>🏨 <strong>{t.hotelName || "Khách Sạn Hệ Thống"}</strong></span>
                  <span>•</span>
                  <span>🏢 Phòng số: <strong className="text-red-600">{t.roomNumber || t.roomId}</strong></span>
                  {t.equipmentName && (
                    <>
                      <span>•</span>
                      <span>🔧 Thiết bị: <strong className="text-slate-800">{t.equipmentName}</strong></span>
                    </>
                  )}
                </div>

                <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {t.description || t.issue}
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-4">
                  <span>👤 Kỹ thuật phụ trách: <strong className="text-slate-700">{t.assignedStaff || "Kỹ sư Kỹ thuật"}</strong></span>
                  <span>🕒 Khởi tạo: {t.createdAt ? new Date(t.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}</span>
                </div>
              </div>

              {/* Status & Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Trạng thái:</span>
                  {getStatusBadge(t.status)}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto justify-end">
                  {t.status !== "IN_PROGRESS" && t.status !== "RESOLVED" && t.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleUpdateStatus(t, "IN_PROGRESS")}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl transition shadow-sm"
                    >
                      ⚙️ Bắt Đầu Sửa
                    </button>
                  )}
                  {t.status !== "RESOLVED" && t.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleUpdateStatus(t, "COMPLETED")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition shadow-sm"
                    >
                      ✓ Đã Khắc Phục
                    </button>
                  )}
                  {(t.status === "RESOLVED" || t.status === "COMPLETED") && (
                    <button
                      onClick={() => handleUpdateStatus(t, "PENDING")}
                      className="border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
                    >
                      🔄 Mở Lại Phiếu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

