import { useState, useEffect } from "react";
import { updateUserProfile, getUserProfile } from "../../services/userService.js";
import ProfileField from "./ProfileField.jsx";

export default function ProfileForm() {
  const [profileData, setProfileData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState({
    username: false,
    email: false,
    avatarUrl: false,
    address: false,
    phone: false,
  });

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
      setMessage("❌ Chưa thể tải dữ liệu hồ sơ. Đang hiển thị dữ liệu cá nhân mặc định.");
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
      const data = await updateUserProfile(formData);
      setMessage("✅ Cập nhật hồ sơ cá nhân thành công!");
      await fetchData();
      setEditMode({ username: false, email: false, avatarUrl: false, address: false, phone: false });
    } catch (error) {
      setMessage("❌ Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  if (!profileData) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-slate-500 italic">
        Đang tải hồ sơ người dùng...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 border-l-4 border-red-500 pl-3">
          Hồ Sơ Cá Nhân & Quản Lý Đặt Phòng
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý thông tin tài khoản, danh sách phòng đã đặt qua sơ đồ Cinema Grid và cài đặt bảo mật.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT CARD: User Info */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 p-6 sticky top-20">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={
                    profileData.avatarUrl ||
                    profileData.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username || "User")}&background=ef4444&color=fff`
                  }
                  alt="Avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-slate-800 shadow-xl"
                />
              </div>

              <h2 className="mt-4 text-xl font-bold text-white">
                {profileData.fullName || profileData.username}
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                @{profileData.username} • {profileData.email || "user@example.com"}
              </p>

              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                {profileData.role || "USER"} MEMBER
              </div>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-semibold text-white">{profileData.phone || "0987 654 321"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Địa chỉ:</span>
                <span className="font-semibold text-white">{profileData.address || "TP. Hồ Chí Minh"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT: Form & Bookings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Form update */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              Cập Nhật Thông Tin Tài Khoản
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên người dùng</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-red-500 outline-none"
                />
              </div>
            </div>

            {message && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                {message}
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-red-200 transition"
              >
                {loading ? "Đang lưu..." : "Lưu Thông Tin"}
              </button>
            </div>
          </form>

          {/* Bookings History Section */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>🎟️ Lịch Sử Phòng Đã Đặt (Cinema Grid)</span>
              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">
                {profileData.bookings?.length || 2} Đơn đặt
              </span>
            </h3>

            <div className="space-y-4">
              {(profileData.bookings || []).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Bạn chưa có đơn đặt phòng nào. Hãy chọn khách sạn trên trang chủ để trải nghiệm sơ đồ chọn phòng!
                </div>
              ) : (
                profileData.bookings.map((booking, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {booking.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{booking.hotelName}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        🏢 Phòng số: <strong className="text-red-600 font-extrabold">{booking.roomNumber || (booking.roomName ? (booking.roomName.match(/\d+/) ? booking.roomName.match(/\d+/)[0] : booking.roomId) : booking.roomId)}</strong> ({booking.roomType || "Standard"}) • Ngày: {booking.checkInDate || booking.checkIn || "Hôm nay"} ➔ {booking.checkOutDate || booking.checkOut || "Ngày mai"}
                      </p>
                    </div>

                    <div className="text-right w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-2">
                      <span className="text-xs font-black text-red-600">
                        {typeof booking.totalPrice === 'number'
                          ? `${booking.totalPrice.toLocaleString('vi-VN')} đ`
                          : booking.total || "1.700.000 đ"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${booking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                          ● {booking.status === "CONFIRMED" ? "Đã Xác Nhận" : booking.status || "Đã Hoàn Thành"}
                        </span>
                        {booking.status === "CONFIRMED" && (
                          <button
                            onClick={async () => {
                              if (window.confirm("Bạn có chắc muốn hủy đơn đặt phòng này?")) {
                                const { cancelBooking } = await import("../../services/bookingService");
                                await cancelBooking(booking.id);
                                await fetchData();
                              }
                            }}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded transition"
                          >
                            Hủy Đặt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


          {/* Change Password Section (PUT /api/users/me/password) */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              🔒 Đổi Mật Khẩu Tài Khoản (PUT /api/users/me/password)
            </h3>

            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
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
      setPassMsg("✅ Đổi mật khẩu thành công!");
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
        <label className="block font-bold text-slate-700 mb-1">Mật khẩu hiện tại *</label>
        <input
          type="password"
          placeholder="Nhập mật khẩu hiện tại"
          value={passData.oldPassword}
          onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-red-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới *</label>
          <input
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={passData.newPassword}
            onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-red-500 outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới *</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={passData.confirmPassword}
            onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-red-500 outline-none"
          />
        </div>
      </div>

      {passErr && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 font-bold border border-red-200">
          ❌ {passErr}
        </div>
      )}

      {passMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
          {passMsg}
        </div>
      )}

      <div className="text-right pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow"
        >
          {saving ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
        </button>
      </div>
    </form>
  );
}