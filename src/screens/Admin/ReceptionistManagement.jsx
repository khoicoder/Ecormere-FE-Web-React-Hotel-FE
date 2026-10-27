import React, { useState, useEffect } from "react";
import {
  getReceptionistsAPI,
  createReceptionistAPI,
  toggleReceptionistStatusAPI,
  resetReceptionistPasswordAPI,
} from "../../services/staffService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import Button, { Input } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

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
    address: "",
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
        address: "",
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

  return (
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title="Quản Lý Đội Ngũ Nhân Viên Lễ Tân"
        subtitle="Admin mỗi khách sạn toàn quyền tuyển dụng, tạo tài khoản và quản trị lễ tân ca trực cho khách sạn của mình."
        badge={userRole === "SUPER_ADMIN" ? "Super Admin" : "Hotel Admin"}
        badgeVariant={userRole === "SUPER_ADMIN" ? "warning" : "info"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={fetchReceptionists}
            >
              Làm Mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<span>+</span>}
              onClick={() => setShowCreateModal(true)}
            >
              Tạo Lễ Tân Mới
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

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Danh Sách Nhân Viên Lễ Tân Theo Ca"
          subtitle={`Hiển thị ${filteredStaff.length} nhân sự`}
          action={
            <div className="w-64">
              <Input
                placeholder="Tìm tên, email, khách sạn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Đang tải danh sách nhân viên lễ tân..." />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="🛎️"
                title="Chưa có nhân viên lễ tân"
                description="Khách sạn của bạn chưa có tài khoản lễ tân nào. Hãy tạo tài khoản mới để bàn giao quyền đón tiếp."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tài Khoản Lễ Tân</th>
                  <th className="py-3 px-4">Khách Sạn Trực Thuộc</th>
                  <th className="py-3 px-4">Email & Liên Hệ</th>
                  <th className="py-3 px-4">Trạng Thái Hoạt Động</th>
                  <th className="py-3 px-4 text-right">Thao Tác Bảo Mật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                          {r.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                            @{r.username}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: #{r.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        🏨 {r.hotelName || `Khách sạn #${r.hotelId || 1}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {r.hotelLocation || "Chi nhánh quản lý"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="text-slate-800 dark:text-slate-200 font-medium block">
                        {r.email}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {r.phone || "Chưa cập nhật"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={r.active ? "ACTIVE" : "INACTIVE"}
                        type="hotel"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedStaff(r);
                            setShowResetModal(true);
                          }}
                        >
                          Đổi Mật Khẩu
                        </Button>
                        <Button
                          size="sm"
                          variant={r.active ? "danger" : "primary"}
                          onClick={() => handleToggleStatus(r.id, r.username, r.active)}
                        >
                          {r.active ? "Khóa" : "Mở Khóa"}
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

      {/* Modal Create Receptionist */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo Tài Khoản Lễ Tân Mới"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Đăng Nhập (Username) *
              </label>
              <Input
                required
                placeholder="VD: letan_danang"
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
                placeholder="letan@hotel.vn"
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
              Địa Chỉ / Ca Trực
            </label>
            <Input
              placeholder="VD: Ca sáng (6h - 14h), địa chỉ tạm trú..."
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
              {createLoading ? "Đang tạo..." : "Xác Nhận Tạo Lễ Tân"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={`Cấp Lại Mật Khẩu Cho Lễ Tân: @${selectedStaff?.username}`}
        size="sm"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật Khẩu Mới *
            </label>
            <Input
              required
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowResetModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={resetLoading}
            >
              {resetLoading ? "Đang đổi..." : "Cập Nhật Mật Khẩu"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
