import { useState, useEffect } from "react";
import { updateUserProfile, getUserProfile } from "../../services/userService.js";
import { Card, CardHeader, CardBody } from "../ui/Card.jsx";
import Button, { Input } from "../ui/FormControls.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { LoadingState, Alert, EmptyState } from "../ui/FeedbackStates.jsx";

export default function ProfileForm() {
  const [profileData, setProfileData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    avatarUrl: "",
    address: "",
  });

  useEffect(() => {
    fetchData();

    const handleSync = () => {
      fetchData();
    };

    window.addEventListener("booking-updated", handleSync);
    return () => window.removeEventListener("booking-updated", handleSync);
  }, []);

  const fetchData = async () => {
    try {
      const data = await getUserProfile();
      if (data) {
        setProfileData(data);
        setFormData({
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          avatarUrl: data.avatarUrl || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      setMessage("❌ Chưa thể tải dữ liệu hồ sơ từ máy chủ.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updateUserProfile(formData);
      setMessage("✅ Cập nhật hồ sơ cá nhân thành công!");
      await fetchData();
    } catch (error) {
      setMessage("❌ Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  if (!profileData) {
    return <LoadingState message="Đang tải thông tin hồ sơ người dùng..." />;
  }

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Hồ Sơ Cá Nhân & Quản Lý Đặt Phòng
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
          Quản lý thông tin tài khoản, danh sách phòng đã đặt và bảo mật thông tin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT CARD: User Info */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              <img
                src={
                  profileData.avatarUrl ||
                  profileData.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profileData.username || "User"
                  )}&background=4f46e5&color=fff`
                }
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow"
              />

              <h2 className="mt-3.5 text-lg font-bold text-slate-900 dark:text-white">
                {profileData.fullName || profileData.username}
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                @{profileData.username} • {profileData.email || "user@example.com"}
              </p>

              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                  {profileData.role || "USER"} MEMBER
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profileData.phone || "0987 654 321"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Địa chỉ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profileData.address || "TP. Hồ Chí Minh"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT CONTENT: Form & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form update */}
          <Card>
            <CardHeader
              title="Cập Nhật Thông Tin Tài Khoản"
              subtitle="Thông tin cá nhân dùng để liên hệ nhận phòng"
            />
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đăng nhập
                  </label>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email liên hệ
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {message && (
                  <Alert
                    type={message.startsWith("✅") ? "success" : "error"}
                    message={message}
                    onClose={() => setMessage("")}
                  />
                )}

                <div className="text-right pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? "Đang lưu..." : "Lưu Thông Tin"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Bookings History Section */}
          <Card>
            <CardHeader
              title="Lịch Sử Đặt Phòng Của Bạn"
              subtitle={`Tổng số ${profileData.bookings?.length || 0} đơn đặt phòng`}
            />
            <CardBody>
              <div className="space-y-3">
                {(profileData.bookings || []).length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="Chưa có đơn đặt phòng nào"
                    description="Hãy chọn khách sạn trên trang chủ để đặt phòng."
                  />
                ) : (
                  profileData.bookings.map((booking, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-white dark:bg-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            #{booking.id}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {booking.hotelName}
                          </h4>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                          🚪 Phòng:{" "}
                          <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {booking.roomNumber ||
                              (booking.roomName
                                ? booking.roomName.match(/\d+/)
                                  ? booking.roomName.match(/\d+/)[0]
                                  : booking.roomId
                                : booking.roomId)}
                          </strong>{" "}
                          ({booking.roomType || "Standard"}) • 📅 {booking.checkInDate || booking.checkIn || "Hôm nay"} ➔{" "}
                          {booking.checkOutDate || booking.checkOut || "Ngày mai"}
                        </p>
                      </div>

                      <div className="text-right w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {typeof booking.totalPrice === "number"
                            ? `${booking.totalPrice.toLocaleString("vi-VN")} đ`
                            : booking.total || "1.700.000 đ"}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={booking.status || "CONFIRMED"} type="booking" />
                          {booking.status === "CONFIRMED" && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                if (window.confirm("Bạn có chắc muốn hủy đơn đặt phòng này?")) {
                                  const { cancelBooking } = await import("../../services/bookingService");
                                  await cancelBooking(booking.id);
                                  await fetchData();
                                }
                              }}
                            >
                              Hủy Đặt
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          {/* Change Password Section */}
          <Card>
            <CardHeader
              title="Đổi Mật Khẩu"
              subtitle="Nên dùng mật khẩu có độ dài tối thiểu 6 ký tự kết hợp chữ và số"
            />
            <CardBody>
              <ChangePasswordForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassMsg("");
    setPassErr("");

    if (!passData.oldPassword || !passData.newPassword || !passData.confirmPassword) {
      setPassErr("Vui lòng điền đầy đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      setPassErr("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    if (passData.newPassword.length < 6) {
      setPassErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setSaving(true);
      const { changePassword } = await import("../../services/userService.js");
      await changePassword(passData);
      setPassMsg("Đổi mật khẩu thành công!");
      setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPassMsg(""), 4000);
    } catch (err) {
      setPassErr("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handlePassChange} className="space-y-4 text-xs">
      <div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Mật khẩu hiện tại *
        </label>
        <Input
          type="password"
          placeholder="Nhập mật khẩu hiện tại"
          value={passData.oldPassword}
          onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mật khẩu mới *
          </label>
          <Input
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={passData.newPassword}
            onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Xác nhận mật khẩu mới *
          </label>
          <Input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={passData.confirmPassword}
            onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
          />
        </div>
      </div>

      {passErr && (
        <Alert type="error" message={passErr} onClose={() => setPassErr("")} />
      )}

      {passMsg && (
        <Alert type="success" message={passMsg} onClose={() => setPassMsg("")} />
      )}

      <div className="text-right pt-2">
        <Button
          type="submit"
          variant="secondary"
          disabled={saving}
        >
          {saving ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
        </Button>
      </div>
    </form>
  );
}
