import React, { useEffect, useState } from "react";
import {
  fetchBookingsAPI,
  performCheckIn,
  performCheckOut,
  processReceptionistPayment,
  getBillPreview,
  cancelBooking,
  triggerOverdueExpiration
} from "../../services/bookingService";
import { getAdminHotels } from "../../services/hotelService";

export default function ReceptionistDashboard() {
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, PENDING, UNPAID, CONFIRMED, CHECKED_IN, CHECKED_OUT, EXPIRED
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal Thanh Toán (Payment Modal)
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "CASH",
    transactionCode: "",
    referenceNote: "",
    cashConfirmed: true,
  });

  // Modal Check-out & Đối Soát (Check-out Modal)
  const [checkoutModalBooking, setCheckoutModalBooking] = useState(null);
  const [checkoutBill, setCheckoutBill] = useState(null);
  const [extraChargesInput, setExtraChargesInput] = useState(0);
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [loadingBill, setLoadingBill] = useState(false);

  const username = localStorage.getItem("username") || "Lễ Tân";
  const userRole = localStorage.getItem("userRole") || "RECEPTIONIST";

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsList, hotelsRes] = await Promise.all([
        fetchBookingsAPI(),
        getAdminHotels()
      ]);
      setBookings(Array.isArray(bookingsList) ? bookingsList : []);
      const hotelList = Array.isArray(hotelsRes?.data) ? hotelsRes.data : [];
      setHotels(hotelList);
    } catch (err) {
      console.error("Error loading receptionist data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("booking-updated", loadData);
    return () => window.removeEventListener("booking-updated", loadData);
  }, []);

  // Format booking time helper
  const formatBookingTime = (isoString) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${hours}:${minutes} (${day}/${month}/${year})`;
    } catch {
      return null;
    }
  };

  // Mở modal thu tiền tại quầy
  const handleOpenPaymentModal = (booking) => {
    const remaining = typeof booking.remainingAmount === "number"
      ? booking.remainingAmount
      : (booking.totalPrice - (booking.paidAmount || 0));

    setPaymentModalBooking(booking);
    setPaymentForm({
      amount: remaining > 0 ? remaining : 0,
      paymentMethod: "CASH",
      transactionCode: "",
      referenceNote: `Thu tiền tại quầy cho đơn #${booking.id}`,
      cashConfirmed: true,
    });
  };

  // Submit thanh toán tại quầy
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalBooking) return;

    if (Number(paymentForm.amount) <= 0) {
      alert("Số tiền thanh toán phải lớn hơn 0");
      return;
    }

    if (paymentForm.paymentMethod === "CASH" && !paymentForm.cashConfirmed) {
      alert("Vui lòng xác nhận lễ tân đã nhận đủ tiền mặt từ khách");
      return;
    }

    if ((paymentForm.paymentMethod === "BANK_TRANSFER" || paymentForm.paymentMethod === "CREDIT_CARD")
        && !paymentForm.transactionCode.trim()) {
      alert("Vui lòng nhập mã giao dịch hoặc mã bút toán ngân hàng/POS");
      return;
    }

    try {
      setActionLoadingId(paymentModalBooking.id);
      await processReceptionistPayment(paymentModalBooking.id, {
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionCode: paymentForm.transactionCode,
        referenceNote: paymentForm.referenceNote,
        cashConfirmed: paymentForm.paymentMethod === "CASH" ? paymentForm.cashConfirmed : false,
      });

      setActionMsg(`💵 Thu tiền thành công: ${Number(paymentForm.amount).toLocaleString("vi-VN")} đ qua ${paymentForm.paymentMethod} cho đơn #${paymentModalBooking.id}!`);
      setPaymentModalBooking(null);
      loadData();
    } catch (err) {
      alert(`Lỗi thu tiền: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  // Check-In (Nhận phòng & Giao khóa)
  const handleCheckIn = async (bookingId, roomNum) => {
    if (window.confirm(`Xác nhận khách nhận phòng ${roomNum} và cấp thẻ phòng?`)) {
      try {
        setActionLoadingId(bookingId);
        await performCheckIn(bookingId);
        setActionMsg(`🔑 Khách đã CHECK-IN thành công vào Phòng ${roomNum}! Phòng chuyển sang trạng thái OCCUPIED.`);
        loadData();
      } catch (err) {
        alert(`Không thể Check-in: ${err.response?.data?.message || err.message}`);
      } finally {
        setActionLoadingId(null);
        setTimeout(() => setActionMsg(""), 4000);
      }
    }
  };

  // Mở modal Check-Out và tải bảng đối soát hóa đơn
  const handleOpenCheckoutModal = async (booking) => {
    setCheckoutModalBooking(booking);
    setExtraChargesInput(0);
    setCheckoutNotes("");
    try {
      setLoadingBill(true);
      const bill = await getBillPreview(booking.id);
      setCheckoutBill(bill);
    } catch (err) {
      console.error("Error loading bill:", err);
    } finally {
      setLoadingBill(false);
    }
  };

  // Thực hiện Check-Out
  const handleConfirmCheckout = async () => {
    if (!checkoutModalBooking) return;

    try {
      setActionLoadingId(checkoutModalBooking.id);
      await performCheckOut(checkoutModalBooking.id, {
        extraCharges: Number(extraChargesInput) || 0,
        notes: checkoutNotes,
      });

      setActionMsg(`🏁 Khách đã CHECK-OUT thành công khỏi đơn #${checkoutModalBooking.id}! Phòng đã chuyển sang trạng thái DỌN DẸP (CLEANING).`);
      setCheckoutModalBooking(null);
      setCheckoutBill(null);
      loadData();
    } catch (err) {
      alert(`Không thể Check-out: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  // Hủy đơn
  const handleCancel = async (bookingId, roomNum) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt phòng #${bookingId} (Phòng ${roomNum})?`)) {
      try {
        setActionLoadingId(bookingId);
        await cancelBooking(bookingId);
        setActionMsg(`🗑️ Đã hủy đơn #${bookingId} và giải phóng trạng thái phòng.`);
        loadData();
      } catch (err) {
        alert(`Lỗi khi hủy đơn: ${err.response?.data?.message || err.message}`);
      } finally {
        setActionLoadingId(null);
        setTimeout(() => setActionMsg(""), 4000);
      }
    }
  };

  // Quét và hết hạn các đơn PENDING quá hạn
  const handleTriggerExpiration = async () => {
    try {
      setLoading(true);
      const res = await triggerOverdueExpiration();
      setActionMsg(`⚡ Đã quét hoàn tất: Hủy hết hạn ${res.expiredBookingsCount || 0} đơn quá hạn, phát hiện ${res.noShowBookingsCount || 0} đơn No-Show!`);
      loadData();
    } catch (err) {
      alert(`Lỗi quét đơn quá hạn: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  // Quick statistics
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const unpaidCount = bookings.filter((b) => (b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIALLY_PAID") && b.status !== "CANCELLED" && b.status !== "EXPIRED").length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED" || b.stayStatus === "NOT_CHECKED_IN").length;
  const inHouseCount = bookings.filter((b) => b.stayStatus === "CHECKED_IN" || b.status === "CHECKED_IN").length;
  const checkedOutCount = bookings.filter((b) => b.stayStatus === "CHECKED_OUT" || b.status === "CHECKED_OUT").length;
  const expiredCount = bookings.filter((b) => b.status === "EXPIRED" || b.status === "NO_SHOW").length;

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    let matchTab = true;
    if (activeTab === "PENDING") matchTab = b.status === "PENDING";
    else if (activeTab === "UNPAID") matchTab = (b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIALLY_PAID") && b.status !== "CANCELLED" && b.status !== "EXPIRED";
    else if (activeTab === "CONFIRMED") matchTab = b.status === "CONFIRMED" && b.stayStatus !== "CHECKED_IN" && b.stayStatus !== "CHECKED_OUT";
    else if (activeTab === "CHECKED_IN") matchTab = b.stayStatus === "CHECKED_IN" || b.status === "CHECKED_IN";
    else if (activeTab === "CHECKED_OUT") matchTab = b.stayStatus === "CHECKED_OUT" || b.status === "CHECKED_OUT";
    else if (activeTab === "EXPIRED") matchTab = b.status === "EXPIRED" || b.status === "NO_SHOW" || b.status === "CANCELLED";

    const query = searchQuery.trim().toLowerCase();
    const matchQuery =
      !query ||
      String(b.id).includes(query) ||
      (b.roomNumber && b.roomNumber.toLowerCase().includes(query)) ||
      (b.username && b.username.toLowerCase().includes(query)) ||
      (b.customerName && b.customerName.toLowerCase().includes(query)) ||
      (b.email && b.email.toLowerCase().includes(query)) ||
      (b.phone && b.phone.includes(query));

    return matchTab && matchQuery;
  });

  const hotelInfo = hotels[0] || { name: "Khách Sạn Hệ Thống", location: "Chi nhánh quản lý" };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner - Front Desk Identity */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-7 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-emerald-700/40">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-emerald-400 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <span>🛎️</span> BÀN LỄ TÂN & ĐÓN TIẾP (FRONT DESK)
            </span>
            <span className="text-xs bg-white/10 text-emerald-200 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
              Ca trực: @{username} ({userRole})
            </span>
          </div>

          <h1 className="text-3xl font-black mt-2">Bảng Điều Hành Lễ Tân: {hotelInfo.name}</h1>
          <p className="text-emerald-200/80 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Quy trình chuẩn hóa nghiệp vụ khách sạn: Tách biệt Vòng đời Đặt phòng, Vòng đời Lưu trú và Thu ngân Thanh toán. Tự động quét hủy đơn quá hạn và bảo vệ concurrency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleTriggerExpiration}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-3 rounded-2xl shadow-lg transition flex items-center gap-1.5"
            title="Kích hoạt quét các đơn PENDING quá hạn thanh toán để hủy và giải phóng phòng"
          >
            <span>⚡</span> Quét Đơn Quá Hạn
          </button>
          <button
            onClick={loadData}
            className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs px-4 py-3 rounded-2xl shadow-lg transition flex items-center gap-1.5"
          >
            <span>🔄</span> Tải Lại Dữ Liệu
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 shadow-sm animate-fadeIn flex items-center gap-2">
          <span>ℹ️</span> {actionMsg}
        </div>
      )}

      {/* Reception KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pending Approval */}
        <div
          onClick={() => setActiveTab("PENDING")}
          className={`cursor-pointer p-3.5 rounded-2xl border transition ${
            activeTab === "PENDING"
              ? "bg-amber-500 text-white border-amber-600 shadow-lg scale-102"
              : "bg-white border-slate-200 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Chờ Duyệt</span>
            <span>⏳</span>
          </div>
          <div className="text-2xl font-black mt-2">{pendingCount}</div>
          <span className="text-[10px] opacity-80 mt-1 block">Đơn mới gửi</span>
        </div>

        {/* Unpaid */}
        <div
          onClick={() => setActiveTab("UNPAID")}
          className={`cursor-pointer p-3.5 rounded-2xl border transition ${
            activeTab === "UNPAID"
              ? "bg-rose-500 text-white border-rose-600 shadow-lg scale-102"
              : "bg-white border-slate-200 hover:border-rose-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Chờ Thu Tiền</span>
            <span>💳</span>
          </div>
          <div className="text-2xl font-black mt-2">{unpaidCount}</div>
          <span className="text-[10px] opacity-80 mt-1 block">Còn nợ / Chưa trả</span>
        </div>

        {/* Confirmed / Ready */}
        <div
          onClick={() => setActiveTab("CONFIRMED")}
          className={`cursor-pointer p-3.5 rounded-2xl border transition ${
            activeTab === "CONFIRMED"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-lg scale-102"
              : "bg-white border-slate-200 hover:border-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Đã Giữ Chỗ</span>
            <span>🟢</span>
          </div>
          <div className="text-2xl font-black mt-2">{confirmedCount}</div>
          <span className="text-[10px] opacity-80 mt-1 block">Sẵn sàng đón khách</span>
        </div>

        {/* In House */}
        <div
          onClick={() => setActiveTab("CHECKED_IN")}
          className={`cursor-pointer p-3.5 rounded-2xl border transition ${
            activeTab === "CHECKED_IN"
              ? "bg-blue-600 text-white border-blue-700 shadow-lg scale-102"
              : "bg-white border-slate-200 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Đang Ở</span>
            <span>🔑</span>
          </div>
          <div className="text-2xl font-black mt-2">{inHouseCount}</div>
          <span className="text-[10px] opacity-80 mt-1 block">Lưu trú tại phòng</span>
        </div>

        {/* Checked Out */}
        <div
          onClick={() => setActiveTab("CHECKED_OUT")}
          className={`cursor-pointer p-3.5 rounded-2xl border transition ${
            activeTab === "CHECKED_OUT"
              ? "bg-purple-600 text-white border-purple-700 shadow-lg scale-102"
              : "bg-white border-slate-200 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Đã Trả Phòng</span>
            <span>🏁</span>
          </div>
          <div className="text-2xl font-black mt-2">{checkedOutCount}</div>
          <span className="text-[10px] opacity-80 mt-1 block">Chờ buồng dọn dẹp</span>
        </div>

        {/* Expired / No show */}
        <div
          onClick={() => setActiveTab("EXPIRED")}
          className={`cursor-pointer p-3.5 rounded-2xl border transition ${
            activeTab === "EXPIRED"
              ? "bg-slate-700 text-white border-slate-800 shadow-lg scale-102"
              : "bg-white border-slate-200 hover:border-slate-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Quá Hạn/Hủy</span>
            <span>⚠️</span>
          </div>
          <div className="text-2xl font-black mt-2">{expiredCount}</div>
          <span className="text-[10px] opacity-80 mt-1 block">Hết hạn / No-show</span>
        </div>
      </div>

      {/* Main Receptionist Bookings Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Workspace Top Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "ALL" ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất Cả ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "PENDING"
                  ? "bg-amber-500 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ⏳ Chờ Duyệt ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("UNPAID")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "UNPAID"
                  ? "bg-rose-500 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              💳 Chưa Trả Đủ ({unpaidCount})
            </button>
            <button
              onClick={() => setActiveTab("CONFIRMED")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "CONFIRMED"
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🟢 Đã Giữ Chỗ ({confirmedCount})
            </button>
            <button
              onClick={() => setActiveTab("CHECKED_IN")}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === "CHECKED_IN"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🔑 Đang Ở ({inHouseCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo số phòng, tên khách, SĐT, mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-2 pl-8 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none w-full sm:w-72 font-medium"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-bold text-xs animate-pulse">
              Đang đồng bộ dữ liệu đặt phòng bàn lễ tân...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <span className="text-3xl block mb-2">📋</span>
              Không có đơn đặt phòng nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Mã & Phòng</th>
                  <th className="py-3 px-5">Khách Hàng</th>
                  <th className="py-3 px-5">Lịch Lưu Trú</th>
                  <th className="py-3 px-5">Thanh Toán & Công Nợ</th>
                  <th className="py-3 px-5">3 Vòng Đời Nghiệp Vụ</th>
                  <th className="py-3 px-5 text-right">Thao Tác Lễ Tân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const isPaid = b.paymentStatus === "PAID" || b.paymentStatus === "SUCCESS";
                  const isPartiallyPaid = b.paymentStatus === "PARTIALLY_PAID";
                  const isPending = b.status === "PENDING";
                  const isConfirmed = b.status === "CONFIRMED";
                  const isCheckedIn = b.stayStatus === "CHECKED_IN" || b.status === "CHECKED_IN";
                  const isCheckedOut = b.stayStatus === "CHECKED_OUT" || b.status === "CHECKED_OUT";
                  const isExpired = b.status === "EXPIRED" || b.status === "NO_SHOW";
                  const isCancelled = b.status === "CANCELLED";
                  const isBusy = actionLoadingId === b.id;

                  const remainingDebt = typeof b.remainingAmount === "number"
                    ? b.remainingAmount
                    : (b.totalPrice - (b.paidAmount || 0));

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      {/* Code & Room */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>🚪</span> Phòng {b.roomNumber || b.roomId}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {b.roomType || "Hạng tiêu chuẩn"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">
                          Đơn #{b.id}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shadow-sm">
                            {(b.userName || b.username || b.customerName || "K").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              @{b.userName || b.username || b.customerName || "Khách"}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              📞 {b.phone || "0901234567"}
                            </span>
                            {b.email && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                {b.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stay Dates & Deadlines */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 block">
                          📅 {b.checkInDate} ➔ {b.checkOutDate}
                        </span>
                        <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                          {b.createdAt && (
                            <span className="text-indigo-600 font-semibold">
                              🕒 Đặt {formatBookingTime(b.createdAt)}
                            </span>
                          )}
                          {isPending && b.paymentDeadline && (
                            <span className="text-rose-600 font-bold text-[10px]">
                              ⏰ Hạn trả: {formatBookingTime(b.paymentDeadline)}
                            </span>
                          )}
                          <span className="text-slate-400">👥 {b.guestCount || 1} khách</span>
                        </div>
                      </td>

                      {/* Payment Status & Financial Breakdown */}
                      <td className="py-4 px-5">
                        <div className="font-black text-slate-900 text-sm">
                          {typeof b.totalPrice === "number" ? b.totalPrice.toLocaleString("vi-VN") : b.totalPrice} đ
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border w-fit ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : isPartiallyPaid
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                          >
                            {isPaid
                              ? "● ĐÃ THANH TOÁN ĐỦ"
                              : isPartiallyPaid
                              ? `◐ ĐÃ TRẢ ${(b.paidAmount || 0).toLocaleString("vi-VN")} đ`
                              : "○ CHƯA THANH TOÁN"}
                          </span>

                          {remainingDebt > 0 && !isCancelled && !isExpired && (
                            <span className="text-[10px] text-rose-600 font-bold">
                              Còn nợ: {remainingDebt.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3 Explicit Lifecycles */}
                      <td className="py-4 px-5 space-y-1">
                        {/* Booking Status */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Đặt phòng:</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block ${
                              isPending
                                ? "bg-amber-100 text-amber-800"
                                : isConfirmed
                                ? "bg-emerald-100 text-emerald-800"
                                : isExpired
                                ? "bg-slate-200 text-slate-700"
                                : isCancelled
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        {/* Stay Status */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Lưu trú:</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block ${
                              isCheckedIn
                                ? "bg-blue-100 text-blue-800"
                                : isCheckedOut
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isCheckedIn ? "🔑 ĐANG Ở" : isCheckedOut ? "🏁 ĐÃ CHECK-OUT" : "Chưa nhận phòng"}
                          </span>
                        </div>
                      </td>

                      {/* Reception Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* 1. Nút Thu Tiền / Xác Nhận Thanh Toán (Accept Payment) */}
                          {!isCancelled && !isExpired && remainingDebt > 0 && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleOpenPaymentModal(b)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1"
                              title="Mở bảng thu tiền mặt, chuyển khoản hoặc thẻ"
                            >
                              <span>💳</span> Thu Tiền
                            </button>
                          )}

                          {/* 2. Nút Check-In (Chỉ khi chưa Check-in và chưa Check-out) */}
                          {!isCheckedIn && !isCheckedOut && !isCancelled && !isExpired && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleCheckIn(b.id, b.roomNumber || b.roomId)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1"
                              title="Làm thủ tục nhận phòng và bàn giao chìa khóa cho khách"
                            >
                              <span>🔑</span> Check-in
                            </button>
                          )}

                          {/* 3. Nút Check-Out (Chỉ khi đang CHECKED_IN) */}
                          {isCheckedIn && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleOpenCheckoutModal(b)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1"
                              title="Đối soát chi phí phát sinh và làm thủ tục trả phòng"
                            >
                              <span>🏁</span> Check-out
                            </button>
                          )}

                          {/* 4. Nút Hủy đơn (Nếu chưa nhận phòng và chưa hủy) */}
                          {!isCheckedIn && !isCheckedOut && !isCancelled && !isExpired && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleCancel(b.id, b.roomNumber || b.roomId)}
                              className="border border-red-200 text-red-600 hover:bg-red-50 font-bold px-2 py-1.5 rounded-xl transition"
                              title="Hủy đơn đặt phòng"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal 1: Thu Tiền Tại Quầy (Receptionist Payment Modal) */}
      {paymentModalBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Thu Ngân Lễ Tân (Accept Payment)
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Thu Tiền Đơn #{paymentModalBooking.id} (Phòng {paymentModalBooking.roomNumber || paymentModalBooking.roomId})
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-2.5 my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
              <div>
                <span className="text-slate-400 block text-[10px]">Tổng tiền phòng</span>
                <strong className="text-slate-800 font-black text-xs">
                  {paymentModalBooking.totalPrice.toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Đã thanh toán</span>
                <strong className="text-emerald-700 font-black text-xs">
                  {(paymentModalBooking.paidAmount || 0).toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Số tiền còn nợ</span>
                <strong className="text-rose-600 font-black text-xs">
                  {(paymentModalBooking.remainingAmount || (paymentModalBooking.totalPrice - (paymentModalBooking.paidAmount || 0))).toLocaleString("vi-VN")} đ
                </strong>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phương thức khách thanh toán *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "CASH", label: "💵 Tiền Mặt", desc: "Thu tiền tại quầy" },
                    { key: "BANK_TRANSFER", label: "🏦 Chuyển Khoản", desc: "VietQR / Internet Banking" },
                    { key: "CREDIT_CARD", label: "💳 Thẻ POS", desc: "Thẻ Visa / Master" },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: m.key })}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        paymentForm.paymentMethod === m.key
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="block font-bold text-xs">{m.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Số tiền thu lần này (VNĐ) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rem = paymentModalBooking.remainingAmount || (paymentModalBooking.totalPrice - (paymentModalBooking.paidAmount || 0));
                      setPaymentForm({ ...paymentForm, amount: rem > 0 ? rem : 0 });
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    Điền đủ số nợ
                  </button>
                </div>
                <input
                  required
                  type="number"
                  min="1000"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full text-base font-black px-3.5 py-2.5 border rounded-xl border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Method-specific fields */}
              {paymentForm.paymentMethod === "CASH" ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="cashConfirmCheck"
                    checked={paymentForm.cashConfirmed}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cashConfirmed: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="cashConfirmCheck" className="text-slate-700 font-semibold cursor-pointer">
                    Lễ tân trực tiếp xác nhận đã nhận đủ <strong>{Number(paymentForm.amount).toLocaleString("vi-VN")} đ</strong> tiền mặt từ khách hàng.
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã giao dịch / Mã bút toán ngân hàng hoặc POS *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: FT26299104882 hoặc POS-098231"
                    value={paymentForm.transactionCode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú thu ngân (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm nếu có..."
                  value={paymentForm.referenceNote}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNote: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentModalBooking(null)}
                  className="px-4 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <span>✓</span> Xác Nhận Đã Thu Tiền (Accept)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Check-Out & Đối Soát Hóa Đơn (Check-out Modal) */}
      {checkoutModalBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Thủ Tục Trả Phòng (Check-Out)
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Đối Soát Hóa Đơn: Phòng {checkoutModalBooking.roomNumber || checkoutModalBooking.roomId}
                </h3>
              </div>
              <button
                onClick={() => setCheckoutModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>

            {loadingBill ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                Đang tổng hợp đối soát hóa đơn...
              </div>
            ) : (
              <div className="space-y-4 my-4">
                {/* Stay bill breakdown */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách lưu trú:</span>
                    <strong className="text-slate-900 font-bold">@{checkoutModalBooking.userName || checkoutModalBooking.username || "Khách"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian ở thực tế:</span>
                    <strong className="text-slate-900">{checkoutModalBooking.checkInDate} ➔ {checkoutModalBooking.checkOutDate} ({checkoutBill?.actualNights || 1} đêm)</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Tiền phòng cơ bản:</span>
                    <strong className="text-slate-900">{checkoutModalBooking.totalPrice.toLocaleString("vi-VN")} đ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền đã thanh toán:</span>
                    <strong className="text-emerald-700 font-bold">- {(checkoutModalBooking.paidAmount || 0).toLocaleString("vi-VN")} đ</strong>
                  </div>
                </div>

                {/* Extra charges field */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phụ thu phát sinh (Minibar, giặt là, dịch vụ phòng, đền bù hư hỏng...)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 đ"
                    value={extraChargesInput}
                    onChange={(e) => setExtraChargesInput(e.target.value)}
                    className="w-full text-sm font-bold px-3 py-2 border rounded-xl border-slate-300 focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Live total recalculation */}
                {(() => {
                  const extra = Number(extraChargesInput) || 0;
                  const total = checkoutModalBooking.totalPrice + extra;
                  const paid = checkoutModalBooking.paidAmount || 0;
                  const diff = total - paid;

                  return (
                    <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-900 font-semibold">Tổng thanh toán sau phụ thu:</span>
                        <strong className="text-purple-950 font-black">{total.toLocaleString("vi-VN")} đ</strong>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-purple-200/80">
                        <span className="text-slate-600 font-bold">Số tiền khách còn phải trả:</span>
                        <strong className={`font-black text-sm ${diff > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                          {diff > 0 ? `${diff.toLocaleString("vi-VN")} đ` : "Đã thanh toán đủ (0 đ)"}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú trả phòng</label>
                  <input
                    type="text"
                    placeholder="VD: Đã thu hồi đủ 2 thẻ từ phòng, khách hài lòng"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setCheckoutModalBooking(null)}
                    className="px-4 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCheckout}
                    disabled={actionLoadingId !== null}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
                  >
                    <span>🏁</span> Hoàn Tất Check-Out & Chuyển Dọn Dẹp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
