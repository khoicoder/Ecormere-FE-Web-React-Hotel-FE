import React, { useEffect, useState } from "react";
import {
  getEquipmentByHotel,
  updateEquipmentStatus,
  createEquipment,
  deleteEquipment,
} from "../../services/equipmentService";
import { getAdminHotels } from "../../services/hotelService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import Button, { Input, Select } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

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
    setEquipmentList(equipmentList.map((e) => (e.id === eqId ? { ...e, status: newStatus } : e)));
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
      hotelId: selectedHotelId,
    });
    setEquipmentList([created, ...equipmentList]);
    setShowAddModal(false);
    setMsg("✅ Thêm thiết bị mới thành công!");
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
      setEquipmentList(equipmentList.filter((e) => e.id !== id));
      setMsg("🗑️ Đã xóa thiết bị thành công!");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const filteredList = equipmentList.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const currentHotel = hotels.find((h) => h.id === Number(selectedHotelId));

  return (
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title="Quản Lý Trang Thiết Bị Phòng"
        subtitle={
          isSuperAdmin
            ? "Giám sát tình trạng kỹ thuật, thiết bị điện tử, nội thất và vật tư theo từng cơ sở"
            : `Giám sát thiết bị tại khách sạn ${currentHotel?.name || "của bạn"}`
        }
        badge={isSuperAdmin ? "Super Admin" : "Hotel Admin"}
        badgeVariant={isSuperAdmin ? "warning" : "info"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={fetchEquipment}
            >
              Làm Mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<span>+</span>}
              onClick={() => setShowAddModal(true)}
            >
              Thêm Thiết Bị
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
          title="Danh Mục Thiết Bị Đang Vận Hành"
          subtitle={`Hiển thị ${filteredList.length} thiết bị`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && hotels.length > 0 && (
                <div className="w-56">
                  <Select
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(Number(e.target.value))}
                    options={hotels.map((h) => ({
                      value: h.id,
                      label: `🏨 ${h.name}`,
                    }))}
                  />
                </div>
              )}

              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "Tất cả trạng thái" },
                    { value: "WORKING", label: "Hoạt động tốt" },
                    { value: "UNDER_MAINTENANCE", label: "Đang bảo trì" },
                    { value: "BROKEN", label: "Bị hỏng hóc" },
                    { value: "RETIRED", label: "Đã thanh lý" },
                  ]}
                />
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Đang tải danh sách thiết bị..." />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="🔌"
                title="Chưa có thiết bị nào"
                description="Không tìm thấy thiết bị nào phù hợp với bộ lọc hiện tại."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tên Thiết Bị & Hãng</th>
                  <th className="py-3 px-4">Serial / Barcode</th>
                  <th className="py-3 px-4">Phân Loại & Phòng</th>
                  <th className="py-3 px-4">Trạng Thái Vận Hành</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {item.brand || "Thương hiệu chuẩn"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.serialNumber || `SN-${item.id}0921`}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Phòng {item.roomNumber || item.roomId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Nhóm: {item.category || "HVAC"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} type="equipment" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold px-2 py-1 text-slate-700 dark:text-slate-300 outline-none"
                        >
                          <option value="WORKING">Hoạt Động Tốt</option>
                          <option value="UNDER_MAINTENANCE">Bảo Trì</option>
                          <option value="BROKEN">Hỏng Hóc</option>
                          <option value="RETIRED">Thanh Lý</option>
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEquipment(item.id)}
                          title="Xóa thiết bị"
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal Add Equipment */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm Trang Thiết Bị Phòng"
        size="md"
      >
        <form onSubmit={handleCreateEquipment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên Thiết Bị *
            </label>
            <Input
              required
              placeholder="VD: Smart Tivi Samsung 55 inch 4K"
              value={newEquipment.name}
              onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thương Hiệu
              </label>
              <Input
                placeholder="VD: Daikin, Samsung, Panasonic"
                value={newEquipment.brand}
                onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Serial / Barcode
              </label>
              <Input
                placeholder="VD: SN-2026-DK01"
                value={newEquipment.serialNumber}
                onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phân Loại
              </label>
              <Select
                value={newEquipment.category}
                onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                options={[
                  { value: "HVAC", label: "HVAC / Điều Hòa" },
                  { value: "ELECTRONIC", label: "Điện Tử / TV / Tủ Lạnh" },
                  { value: "PLUMBING", label: "Vệ Sinh / Cấp Thoát Nước" },
                  { value: "FURNITURE", label: "Nội Thất / Giường / Ghế" },
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phòng Lắp Đặt
              </label>
              <Input
                type="number"
                value={newEquipment.roomId}
                onChange={(e) => setNewEquipment({ ...newEquipment, roomId: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú Kỹ Thuật
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 text-xs outline-none focus:border-indigo-500"
              placeholder="Ghi chú vị trí hoặc tình trạng ban đầu..."
              value={newEquipment.description}
              onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowAddModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Xác Nhận Thêm Thiết Bị
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
