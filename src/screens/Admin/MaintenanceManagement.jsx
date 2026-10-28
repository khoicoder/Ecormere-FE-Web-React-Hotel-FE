import React, { useEffect, useState } from "react";
import {
  getAllMaintenance,
  createMaintenanceTicket,
  updateMaintenanceStatus,
} from "../../services/maintenanceService";
import { getAdminHotels } from "../../services/hotelService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import Button, { Input, Select } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

export default function MaintenanceManagement() {
  const [tickets, setTickets] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedHotelFilter, setSelectedHotelFilter] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const userRole = localStorage.getItem("userRole") || "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isReceptionist = userRole === "RECEPTIONIST";

  const [newTicket, setNewTicket] = useState({
    hotelId: 1,
    hotelName: "",
    roomId: null,
    roomNumber: "",
    equipmentName: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "REPAIR",
    assignedStaff: "Bộ phận Kỹ thuật",
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const [data, hotelsRes] = await Promise.all([
        getAllMaintenance(),
        getAdminHotels(),
      ]);
      const hotelList = Array.isArray(hotelsRes?.data) ? hotelsRes.data : [];
      setHotels(hotelList);

      let allTickets = Array.isArray(data) ? data : [];
      if (!isSuperAdmin && hotelList.length > 0) {
        const ownedId = hotelList[0].id;
        setSelectedHotelFilter(ownedId);
        allTickets = allTickets.filter((t) => Number(t.hotelId) === Number(ownedId));
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

  const handleOpenCreateForm = () => {
    const currentHotel = hotels[0];
    const hotelRooms = currentHotel?.rooms || (currentHotel?.floors || []).flatMap((f) => f.rooms || []);
    const firstRoom = hotelRooms[0];
    setNewTicket({
      hotelId: currentHotel ? currentHotel.id : 1,
      hotelName: currentHotel ? currentHotel.name : "Khách sạn cơ sở",
      roomId: firstRoom ? firstRoom.id : null,
      roomNumber: firstRoom ? (firstRoom.name || String(firstRoom.id)) : "",
      equipmentName: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "REPAIR",
      assignedStaff: "Bộ phận Kỹ thuật",
    });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) {
      alert("Vui lòng nhập tiêu đề và mô tả sự cố!");
      return;
    }

    if (!newTicket.roomId && !newTicket.roomNumber) {
      alert("Vui lòng chọn phòng cần báo hỏng bảo trì!");
      return;
    }

    try {
      const created = await createMaintenanceTicket(newTicket);
      setTickets([created, ...tickets]);
      setShowForm(false);
      setMsg("✅ Đã tạo phiếu yêu cầu bảo trì mới thành công!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      alert("Lỗi tạo phiếu: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (ticket, newStatus) => {
    try {
      await updateMaintenanceStatus(ticket.hotelId || 1, ticket.id, newStatus);
      const displayStatus =
        newStatus === "RESOLVED" || newStatus === "COMPLETED"
          ? "COMPLETED"
          : newStatus === "OPEN" || newStatus === "PENDING"
          ? "PENDING"
          : newStatus;
      setTickets(
        tickets.map((t) => (t.id === ticket.id ? { ...t, status: displayStatus } : t))
      );
      setMsg(
        `✅ Đã cập nhật trạng thái phiếu #${ticket.ticketCode || ticket.id} sang "${
          newStatus === "COMPLETED" ? "Đã Khắc Phục" : newStatus === "IN_PROGRESS" ? "Đang Sửa" : "Mở Lại"
        }"!`
      );
    } catch (err) {
      setMsg(`❌ Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
    }
    setTimeout(() => setMsg(""), 3500);
  };

  const filteredTickets = tickets.filter((t) => {
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

  const selectedHotel = hotels.find((h) => Number(h.id) === Number(newTicket.hotelId)) || hotels[0];
  const availableRooms = selectedHotel?.rooms || (selectedHotel?.floors || []).flatMap((f) => f.rooms || []);

  return (
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title={isReceptionist ? "Báo Cáo Sự Cố Kỹ Thuật Cơ Sở" : "Quản Lý Phiếu Bảo Trì & Sửa Chữa"}
        subtitle={
          isReceptionist
            ? `Báo hỏng phòng, thiết bị gửi bộ phận kỹ thuật của khách sạn ${hotels[0]?.name ? `(${hotels[0]?.name})` : ""}`
            : "Tiếp nhận báo hỏng từ lễ tân/buồng phòng, điều phối kỹ sư và theo dõi tiến độ sửa chữa"
        }
        badge={isSuperAdmin ? "Super Admin" : isReceptionist ? "Lễ Tân" : "Hotel Admin"}
        badgeVariant={isSuperAdmin ? "warning" : isReceptionist ? "success" : "info"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={fetchTickets}
            >
              Làm Mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<span>+</span>}
              onClick={handleOpenCreateForm}
            >
              Tạo Phiếu Sự Cố
            </Button>
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

      {/* Main Table Workspace */}
      <Card>
        <CardHeader
          title="Danh Sách Phiếu Yêu Cầu Kỹ Thuật"
          subtitle={`Hiển thị ${filteredTickets.length} phiếu`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && hotels.length > 0 && (
                <div className="w-56">
                  <Select
                    value={selectedHotelFilter}
                    onChange={(e) => setSelectedHotelFilter(Number(e.target.value))}
                    options={[
                      { value: 0, label: "Toàn bộ khách sạn" },
                      ...hotels.map((h) => ({
                        value: h.id,
                        label: `🏨 ${h.name}`,
                      })),
                    ]}
                  />
                </div>
              )}

              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "Tất cả trạng thái" },
                    { value: "OPEN", label: "Chờ xử lý" },
                    { value: "IN_PROGRESS", label: "Đang sửa chữa" },
                    { value: "RESOLVED", label: "Đã hoàn thành" },
                  ]}
                />
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Đang tải danh sách phiếu bảo trì..." />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="🛠️"
                title="Chưa có phiếu bảo trì nào"
                description="Không tìm thấy sự cố kỹ thuật nào phù hợp với bộ lọc hiện tại."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã Phiếu & Tiêu Đề</th>
                  <th className="py-3 px-4">Phòng & Thiết Bị</th>
                  <th className="py-3 px-4">Độ Khẩn Cấp</th>
                  <th className="py-3 px-4">Kỹ Sư Phụ Trách</th>
                  <th className="py-3 px-4">Trạng Thái Xử Lý</th>
                  <th className="py-3 px-4 text-right">Cập Nhật Tiến Độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {t.title}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                        #{t.ticketCode || `TICKET-${t.id}`}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        🚪 Phòng {t.roomNumber || t.roomId}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {t.equipmentName || "Trang thiết bị chung"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          t.priority === "HIGH" || t.priority === "URGENT"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : t.priority === "MEDIUM"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {t.priority === "HIGH" || t.priority === "URGENT"
                          ? "🔴 Khẩn cấp"
                          : t.priority === "MEDIUM"
                          ? "🟡 Trung bình"
                          : "🟢 Bình thường"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        👤 {t.assignedStaff || "Chưa phân công"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} type="maintenance" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(t.status === "OPEN" || t.status === "PENDING") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(t, "IN_PROGRESS")}
                          >
                            Bắt Đầu Sửa
                          </Button>
                        )}
                        {t.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleUpdateStatus(t, "COMPLETED")}
                          >
                            Đã Khắc Phục
                          </Button>
                        )}
                        {(t.status === "COMPLETED" || t.status === "RESOLVED") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(t, "IN_PROGRESS")}
                          >
                            Mở Lại
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal Create Maintenance Ticket */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tạo Phiếu Sự Cố / Báo Hỏng Kỹ Thuật"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Hotel Information Banner or Selector */}
          {isSuperAdmin && hotels.length > 1 ? (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chọn Khách Sạn Cơ Sở *
              </label>
              <Select
                value={newTicket.hotelId}
                onChange={(e) => {
                  const hId = Number(e.target.value);
                  const hObj = hotels.find((h) => h.id === hId);
                  const rList = hObj?.rooms || (hObj?.floors || []).flatMap((f) => f.rooms || []);
                  const firstR = rList[0];
                  setNewTicket({
                    ...newTicket,
                    hotelId: hId,
                    hotelName: hObj ? hObj.name : "",
                    roomId: firstR ? firstR.id : null,
                    roomNumber: firstR ? (firstR.name || String(firstR.id)) : "",
                  });
                }}
                options={hotels.map((h) => ({
                  value: h.id,
                  label: `🏨 ${h.name} (${h.location || "Cơ sở"})`,
                }))}
              />
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-2">
                <span>🏨</span>
                <span className="font-semibold text-xs">
                  Cơ sở: {selectedHotel?.name || "Khách sạn cơ sở của bạn"}
                </span>
              </div>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded font-bold">
                {isReceptionist ? "Lễ Tân Cơ Sở" : "Khách Sạn Trực Thuộc"}
              </span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu Đề Sự Cố *
            </label>
            <Input
              required
              placeholder="VD: Điều hòa không mát, khóa từ bị kẹt, hỏng vòi sen"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phòng Cần Bảo Trì *
              </label>
              {availableRooms && availableRooms.length > 0 ? (
                <Select
                  value={newTicket.roomId || ""}
                  onChange={(e) => {
                    const selId = Number(e.target.value);
                    const foundR = availableRooms.find((r) => r.id === selId);
                    setNewTicket({
                      ...newTicket,
                      roomId: selId || null,
                      roomNumber: foundR ? (foundR.name || String(foundR.id)) : "",
                    });
                  }}
                  options={[
                    { value: "", label: "-- Chọn phòng trong danh sách --" },
                    ...availableRooms.map((r) => {
                      const stText =
                        r.status === "AVAILABLE"
                          ? "Trống"
                          : r.status === "OCCUPIED"
                          ? "Có khách"
                          : r.status === "MAINTENANCE"
                          ? "Bảo trì"
                          : r.status || "";
                      return {
                        value: r.id,
                        label: `🚪 Phòng ${r.name || r.id} (${r.type || "Tiêu chuẩn"}${stText ? ` - ${stText}` : ""})`,
                      };
                    }),
                  ]}
                />
              ) : (
                <Input
                  required
                  placeholder="VD: 101"
                  value={newTicket.roomNumber}
                  onChange={(e) =>
                    setNewTicket({
                      ...newTicket,
                      roomNumber: e.target.value,
                      roomId: Number(e.target.value) || null,
                    })
                  }
                />
              )}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Thiết Bị / Hạng Mục Hỏng
              </label>
              <Input
                placeholder="VD: Điều Hòa Daikin, Khóa cửa..."
                value={newTicket.equipmentName}
                onChange={(e) => setNewTicket({ ...newTicket, equipmentName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức Độ Ưu Tiên
              </label>
              <Select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                options={[
                  { value: "LOW", label: "🟢 Thấp - Định kỳ" },
                  { value: "MEDIUM", label: "🟡 Trung bình" },
                  { value: "HIGH", label: "🔴 Khẩn cấp - Phòng đang có khách" },
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kỹ Sư / Đội Tiếp Nhận
              </label>
              <Input
                placeholder="VD: Bộ phận Kỹ thuật ca sáng"
                value={newTicket.assignedStaff}
                onChange={(e) => setNewTicket({ ...newTicket, assignedStaff: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô Tả Chi Tiết Hiện Trạng *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 text-xs outline-none focus:border-indigo-500"
              placeholder="Mô tả cụ thể hiện tượng hư hại, thời điểm phát hiện, ảnh hưởng tới khách lưu trú..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Xác Nhận Tạo Phiếu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
