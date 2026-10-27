import React, { useState, useEffect } from "react";
import { getHotelAdminsAPI, createHotelAdminAPI } from "../../services/staffService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import Button, { Input, Select } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

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
    address: "",
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
        address: "",
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
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title="Quản Lý Admin Khách Sạn (Hotel Admins)"
        subtitle="Mỗi khách sạn chỉ có 1 Admin Lớn phụ trách. Super Admin có toàn quyền tạo mới và ủy quyền quản lý từng cơ sở."
        badge="Super Admin Hub"
        badgeVariant="warning"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={fetchHotelAdmins}
            >
              Làm Mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<span>+</span>}
              onClick={() => setShowCreateModal(true)}
            >
              Tạo Admin Cho Khách Sạn
            </Button>
          </div>
        }
      />

      {successMsg && (
        <Alert
          type="success"
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 font-medium">Tổng Cơ Sở Khách Sạn</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {hotels.length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Đã Bổ Nhiệm Admin
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {hotelsWithAdmin.length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Chưa Có Admin
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {hotelsWithoutAdmin.length}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Danh Sách Cơ Sở & Admin Đại Diện"
          subtitle={`Hiển thị ${filteredHotels.length} cơ sở`}
          action={
            <div className="w-64">
              <Input
                placeholder="Tìm tên khách sạn, admin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Đang tải danh sách Admin khách sạn..." />
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="🏨"
                title="Không tìm thấy cơ sở"
                description="Không có khách sạn nào khớp với bộ lọc tìm kiếm hiện tại."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Khách Sạn (Hotel)</th>
                  <th className="py-3 px-4">Tài Khoản Admin Lớn</th>
                  <th className="py-3 px-4">Email & Liên Hệ</th>
                  <th className="py-3 px-4">Trạng Thái Admin</th>
                  <th className="py-3 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHotels.map((h) => (
                  <tr key={h.hotelId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {h.hotelName}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        📍 {h.hotelLocation || "Hệ thống"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {h.hasAdmin ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                            {h.adminUsername?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                              @{h.adminUsername}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: #{h.adminId}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                          ⚠️ Chưa có Admin Lớn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {h.hasAdmin ? (
                        <>
                          <span className="text-slate-800 dark:text-slate-200 font-medium block">
                            {h.adminEmail || "Chưa cập nhật"}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {h.adminPhone || "Chưa có SĐT"}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {h.hasAdmin ? (
                        <StatusBadge
                          status={h.adminActive ? "ACTIVE" : "INACTIVE"}
                          type="hotel"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Trống</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!h.hasAdmin ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setFormData({ ...formData, hotelId: String(h.hotelId) });
                            setShowCreateModal(true);
                          }}
                        >
                          Bổ Nhiệm
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Đã bổ nhiệm</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal Create Admin */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo Tài Khoản Admin Cho Khách Sạn"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Khách Sạn Bổ Nhiệm *
            </label>
            <Select
              required
              value={formData.hotelId}
              onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
              options={[
                { value: "", label: "-- Chọn khách sạn --" },
                ...hotelsWithoutAdmin.map((h) => ({
                  value: h.hotelId,
                  label: `🏨 ${h.hotelName} (Chưa có Admin)`,
                })),
                ...hotelsWithAdmin.map((h) => ({
                  value: h.hotelId,
                  label: `🏨 ${h.hotelName} (Đã có: @${h.adminUsername})`,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Đăng Nhập (Username) *
              </label>
              <Input
                required
                placeholder="VD: admin_danang"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mật Khẩu Khởi Tạo *
              </label>
              <Input
                required
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <Input
                required
                type="email"
                placeholder="admin@hotel.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Điện Thoại
              </label>
              <Input
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa Chỉ / Ghi Chú
            </label>
            <Input
              placeholder="Địa chỉ liên hệ..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowCreateModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createLoading}
            >
              {createLoading ? "Đang tạo..." : "Xác Nhận Bổ Nhiệm"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
