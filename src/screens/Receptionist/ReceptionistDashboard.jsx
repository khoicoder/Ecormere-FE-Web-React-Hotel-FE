import React, { useEffect, useState } from "react";
import {
  fetchBookingsAPI,
  performCheckIn,
  performCheckOut,
  processReceptionistPayment,
  getBillPreview,
  cancelBooking,
  triggerOverdueExpiration,
} from "../../services/bookingService";
import { getAdminHotels } from "../../services/hotelService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button, { Input } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

export default function ReceptionistDashboard() {
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
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
        getAdminHotels(),
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

  const handleOpenPaymentModal = (booking) => {
    const remaining =
      typeof booking.remainingAmount === "number"
        ? booking.remainingAmount
        : booking.totalPrice - (booking.paidAmount || 0);

    setPaymentModalBooking(booking);
    setPaymentForm({
      amount: remaining > 0 ? remaining : 0,
      paymentMethod: "CASH",
      transactionCode: "",
      referenceNote: `Thu tiền tại quầy cho đơn #${booking.id}`,
      cashConfirmed: true,
    });
  };

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

    if (
      (paymentForm.paymentMethod === "BANK_TRANSFER" || paymentForm.paymentMethod === "CREDIT_CARD") &&
      !paymentForm.transactionCode.trim()
    ) {
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

      setActionMsg(
        `💵 Thu tiền thành công: ${Number(paymentForm.amount).toLocaleString("vi-VN")} đ qua ${paymentForm.paymentMethod} cho đơn #${paymentModalBooking.id}!`
      );
      setPaymentModalBooking(null);
      loadData();
    } catch (err) {
      alert(`Lỗi thu tiền: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  const handleCheckIn = async (bookingId, roomNum) => {
    if (window.confirm(`Xác nhận khách nhận phòng ${roomNum} và cấp chìa khóa/thẻ phòng?`)) {
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

  const handleConfirmCheckout = async () => {
    if (!checkoutModalBooking) return;

    try {
      setActionLoadingId(checkoutModalBooking.id);
      await performCheckOut(checkoutModalBooking.id, {
        extraCharges: Number(extraChargesInput) || 0,
        notes: checkoutNotes,
      });

      setActionMsg(
        `🏁 Khách đã CHECK-OUT thành công khỏi đơn #${checkoutModalBooking.id}! Phòng đã chuyển sang trạng thái DỌN DẸP (CLEANING).`
      );
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

  const handleTriggerExpiration = async () => {
    try {
      setLoading(true);
      const res = await triggerOverdueExpiration();
      setActionMsg(
        `⚡ Đã quét hoàn tất: Hủy hết hạn ${res.expiredBookingsCount || 0} đơn quá hạn, phát hiện ${res.noShowBookingsCount || 0} đơn No-Show!`
      );
      loadData();
    } catch (err) {
      alert(`Lỗi quét đơn quá hạn: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const unpaidCount = bookings.filter(
    (b) => (b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIALLY_PAID") && b.status !== "CANCELLED" && b.status !== "EXPIRED"
  ).length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED" || b.stayStatus === "NOT_CHECKED_IN").length;
  const inHouseCount = bookings.filter((b) => b.stayStatus === "CHECKED_IN" || b.status === "CHECKED_IN").length;
  const checkedOutCount = bookings.filter((b) => b.stayStatus === "CHECKED_OUT" || b.status === "CHECKED_OUT").length;
  const expiredCount = bookings.filter((b) => b.status === "EXPIRED" || b.status === "NO_SHOW").length;

  const filteredBookings = bookings.filter((b) => {
    let matchTab = true;
    if (activeTab === "PENDING") matchTab = b.status === "PENDING";
    else if (activeTab === "UNPAID")
      matchTab = (b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIALLY_PAID") && b.status !== "CANCELLED" && b.status !== "EXPIRED";
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

  const hotelInfo = hotels[0] || { name: "Khách Sạn Cơ Sở", location: "Chi nhánh quản lý" };

  return (
    <div className="space-y-6">
      {/* SaaS Page Header */}
      <PageHeader
        title={`Bàn Lễ Tân: ${hotelInfo.name}`}
        subtitle={`Quản lý đón tiếp, Check-in, Check-out, thu ngân và đối soát hóa đơn lưu trú. Ca trực: @${username}`}
        badge={userRole}
        badgeVariant="success"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<span>⚡</span>}
              onClick={handleTriggerExpiration}
              title="Quét các đơn chưa thanh toán quá hạn để tự động hủy giữ phòng"
            >
              Quét Đơn Quá Hạn
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={loadData}
            >
              Làm Mới
            </Button>
          </div>
        }
      />

      {actionMsg && (
        <Alert
          type="info"
          message={actionMsg}
          onClose={() => setActionMsg("")}
        />
      )}

      {/* Reception KPI Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: "PENDING", label: "Chờ Duyệt", count: pendingCount, icon: "⏳", color: "border-amber-300 dark:border-amber-800" },
          { key: "UNPAID", label: "Chờ Thu Tiền", count: unpaidCount, icon: "💳", color: "border-rose-300 dark:border-rose-800" },
          { key: "CONFIRMED", label: "Đã Giữ Chỗ", count: confirmedCount, icon: "🟢", color: "border-emerald-300 dark:border-emerald-800" },
          { key: "CHECKED_IN", label: "Đang Ở", count: inHouseCount, icon: "🔑", color: "border-blue-300 dark:border-blue-800" },
          { key: "CHECKED_OUT", label: "Đã Trả Phòng", count: checkedOutCount, icon: "🏁", color: "border-purple-300 dark:border-purple-800" },
          { key: "EXPIRED", label: "Quá Hạn/Hủy", count: expiredCount, icon: "⚠️", color: "border-slate-300 dark:border-slate-700" },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(isSelected ? "ALL" : tab.key)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-indigo-500"
                  : `bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 ${tab.color}`
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{tab.label}</span>
                <span>{tab.icon}</span>
              </div>
              <div className="text-2xl font-bold mt-1.5">{tab.count}</div>
              <span className="text-[10px] opacity-70 block mt-0.5">
                {isSelected ? "Đang lọc" : "Bấm để lọc"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Receptionist Table Workspace */}
      <Card>
        <CardHeader
          title="Danh Sách Đơn Lưu Trú & Thao Tác Bàn Tiếp Tân"
          subtitle={`Hiển thị ${filteredBookings.length} / ${bookings.length} đơn đặt phòng`}
          action={
            <div className="flex items-center gap-3">
              {activeTab !== "ALL" && (
                <button
                  onClick={() => setActiveTab("ALL")}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Xóa lọc tab (Xem tất cả)
                </button>
              )}
              <div className="w-56 sm:w-72">
                <Input
                  placeholder="Tìm số phòng, tên khách, SĐT, mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Đang cập nhật danh sách đặt phòng và trạng thái phòng..." />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="🛎️"
                title="Không có đơn đặt phòng nào"
                description="Không tìm thấy đơn nào theo trạng thái hoặc từ khóa tìm kiếm đã chọn."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã & Phòng</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Lịch Lưu Trú</th>
                  <th className="py-3 px-4">Tài Chính & Thu Tiền</th>
                  <th className="py-3 px-4">3 Vòng Đời Nghiệp Vụ</th>
                  <th className="py-3 px-4 text-right">Thao Tác Lễ Tân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((b) => {
                  const isPaid = b.paymentStatus === "PAID" || b.paymentStatus === "SUCCESS";
                  const isPending = b.status === "PENDING";
                  const isCheckedIn = b.stayStatus === "CHECKED_IN" || b.status === "CHECKED_IN";
                  const isCheckedOut = b.stayStatus === "CHECKED_OUT" || b.status === "CHECKED_OUT";
                  const isExpired = b.status === "EXPIRED" || b.status === "NO_SHOW";
                  const isCancelled = b.status === "CANCELLED";
                  const isBusy = actionLoadingId === b.id;

                  const remainingDebt =
                    typeof b.remainingAmount === "number"
                      ? b.remainingAmount
                      : b.totalPrice - (b.paidAmount || 0);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      {/* Code & Room */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <span>🚪</span> Phòng {b.roomNumber || b.roomId}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                          {b.roomType || "Tiêu chuẩn"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Đơn #{b.id}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                            {(b.userName || b.username || b.customerName || "K").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                              @{b.userName || b.username || b.customerName || "Khách"}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              📞 {b.phone || "0901234567"}
                            </span>
                            {b.email && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                {b.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stay Dates & Deadlines */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                          📅 {b.checkInDate} ➔ {b.checkOutDate}
                        </span>
                        <div className="mt-1 flex flex-col gap-0.5 text-[10px]">
                          {b.createdAt && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              🕒 Đặt {formatBookingTime(b.createdAt)}
                            </span>
                          )}
                          {isPending && b.paymentDeadline && (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              ⏰ Hạn trả: {formatBookingTime(b.paymentDeadline)}
                            </span>
                          )}
                          <span className="text-slate-400">👥 {b.guestCount || 1} khách</span>
                        </div>
                      </td>

                      {/* Financial Breakdown */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {typeof b.totalPrice === "number" ? b.totalPrice.toLocaleString("vi-VN") : b.totalPrice} đ
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                          <StatusBadge status={b.paymentStatus || "UNPAID"} type="payment" />
                          {remainingDebt > 0 && !isCancelled && !isExpired && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                              Nợ: {remainingDebt.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3 Explicit Lifecycles */}
                      <td className="py-3 px-4 space-y-1">
                        <div>
                          <span className="text-[9px] uppercase font-semibold text-slate-400 block">Đơn:</span>
                          <StatusBadge status={b.status} type="booking" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-semibold text-slate-400 block">Lưu trú:</span>
                          <StatusBadge status={b.stayStatus || (isCheckedIn ? "CHECKED_IN" : isCheckedOut ? "CHECKED_OUT" : "NOT_CHECKED_IN")} type="stay" />
                        </div>
                      </td>

                      {/* Reception Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* 1. Thu tiền tại quầy */}
                          {!isCancelled && !isExpired && remainingDebt > 0 && (
                            <Button
                              size="sm"
                              variant="success"
                              disabled={isBusy}
                              onClick={() => handleOpenPaymentModal(b)}
                              icon={<span>💳</span>}
                            >
                              Thu Tiền
                            </Button>
                          )}

                          {/* 2. Check-In */}
                          {!isCheckedIn && !isCheckedOut && !isCancelled && !isExpired && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleCheckIn(b.id, b.roomNumber || b.roomId)}
                              icon={<span>🔑</span>}
                            >
                              Check-in
                            </Button>
                          )}

                          {/* 3. Check-Out */}
                          {isCheckedIn && (
                            <Button
                              size="sm"
                              variant="warning"
                              disabled={isBusy}
                              onClick={() => handleOpenCheckoutModal(b)}
                              icon={<span>🏁</span>}
                            >
                              Check-out
                            </Button>
                          )}

                          {/* 4. Hủy đơn */}
                          {!isCheckedIn && !isCheckedOut && !isCancelled && !isExpired && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() => handleCancel(b.id, b.roomNumber || b.roomId)}
                              title="Hủy đơn đặt phòng"
                            >
                              ✕
                            </Button>
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
      </Card>

      {/* Modal 1: Thu Tiền Tại Quầy (Accept Payment Modal) */}
      <Modal
        isOpen={!!paymentModalBooking}
        onClose={() => setPaymentModalBooking(null)}
        title={`Thu Tiền Đơn #${paymentModalBooking?.id} (Phòng ${paymentModalBooking?.roomNumber || paymentModalBooking?.roomId})`}
        size="md"
      >
        {paymentModalBooking && (
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-slate-400 block text-[10px]">Tổng tiền phòng</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                  {paymentModalBooking.totalPrice.toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Đã thanh toán</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  {(paymentModalBooking.paidAmount || 0).toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Số tiền còn nợ</span>
                <strong className="text-rose-600 dark:text-rose-400 font-bold text-xs">
                  {(
                    paymentModalBooking.remainingAmount ||
                    paymentModalBooking.totalPrice - (paymentModalBooking.paidAmount || 0)
                  ).toLocaleString("vi-VN")} đ
                </strong>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phương thức khách thanh toán *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "CASH", label: "💵 Tiền Mặt", desc: "Thu tại quầy" },
                  { key: "BANK_TRANSFER", label: "🏦 Chuyển Khoản", desc: "VietQR / Banking" },
                  { key: "CREDIT_CARD", label: "💳 Thẻ POS", desc: "Visa / Master" },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: m.key })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      paymentForm.paymentMethod === m.key
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="block font-semibold text-xs">{m.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Số tiền thu lần này (VNĐ) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const rem =
                      paymentModalBooking.remainingAmount ||
                      paymentModalBooking.totalPrice - (paymentModalBooking.paidAmount || 0);
                    setPaymentForm({ ...paymentForm, amount: rem > 0 ? rem : 0 });
                  }}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Điền đủ số nợ
                </button>
              </div>
              <Input
                type="number"
                min="1000"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>

            {/* Method-specific fields */}
            {paymentForm.paymentMethod === "CASH" ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="cashConfirmCheck"
                  checked={paymentForm.cashConfirmed}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cashConfirmed: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="cashConfirmCheck" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Lễ tân xác nhận đã nhận đủ{" "}
                  <strong>{Number(paymentForm.amount).toLocaleString("vi-VN")} đ</strong> tiền mặt từ khách.
                </label>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã giao dịch / Mã bút toán ngân hàng hoặc POS *
                </label>
                <Input
                  required
                  placeholder="VD: FT26299104882 hoặc POS-098231"
                  value={paymentForm.transactionCode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú thu ngân (Tùy chọn)
              </label>
              <Input
                placeholder="Ghi chú thêm nếu có..."
                value={paymentForm.referenceNote}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNote: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setPaymentModalBooking(null)}
              >
                Hủy
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={actionLoadingId !== null}
                icon={<span>✓</span>}
              >
                Xác Nhận Đã Thu Tiền (Accept)
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Check-Out & Đối Soát Hóa Đơn */}
      <Modal
        isOpen={!!checkoutModalBooking}
        onClose={() => setCheckoutModalBooking(null)}
        title={`Đối Soát Hóa Đơn & Check-Out: Phòng ${checkoutModalBooking?.roomNumber || checkoutModalBooking?.roomId}`}
        size="md"
      >
        {checkoutModalBooking && (
          <div>
            {loadingBill ? (
              <div className="py-8">
                <LoadingState message="Đang tổng hợp đối soát hóa đơn..." />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Stay bill breakdown */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách lưu trú:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      @{checkoutModalBooking.userName || checkoutModalBooking.username || "Khách"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian ở thực tế:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {checkoutModalBooking.checkInDate} ➔ {checkoutModalBooking.checkOutDate} (
                      {checkoutBill?.actualNights || 1} đêm)
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span className="text-slate-500">Tiền phòng cơ bản:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {checkoutModalBooking.totalPrice.toLocaleString("vi-VN")} đ
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền đã thanh toán:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                      - {(checkoutModalBooking.paidAmount || 0).toLocaleString("vi-VN")} đ
                    </strong>
                  </div>
                </div>

                {/* Extra charges field */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phụ thu phát sinh (Minibar, giặt là, phòng dịch vụ, đền bù...)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 đ"
                    value={extraChargesInput}
                    onChange={(e) => setExtraChargesInput(e.target.value)}
                  />
                </div>

                {/* Live total recalculation */}
                {(() => {
                  const extra = Number(extraChargesInput) || 0;
                  const total = checkoutModalBooking.totalPrice + extra;
                  const paid = checkoutModalBooking.paidAmount || 0;
                  const diff = total - paid;

                  return (
                    <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-900 dark:text-purple-300 font-medium">
                          Tổng thanh toán sau phụ thu:
                        </span>
                        <strong className="text-purple-950 dark:text-purple-200 font-bold">
                          {total.toLocaleString("vi-VN")} đ
                        </strong>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-purple-200/80 dark:border-purple-800/80">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">
                          Số tiền khách còn phải trả:
                        </span>
                        <strong
                          className={`font-bold text-sm ${
                            diff > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {diff > 0 ? `${diff.toLocaleString("vi-VN")} đ` : "Đã thanh toán đủ (0 đ)"}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú trả phòng
                  </label>
                  <Input
                    placeholder="VD: Đã thu hồi đủ 2 thẻ từ phòng, khách hài lòng"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setCheckoutModalBooking(null)}
                  >
                    Đóng
                  </Button>
                  <Button
                    variant="warning"
                    type="button"
                    onClick={handleConfirmCheckout}
                    disabled={actionLoadingId !== null}
                    icon={<span>🏁</span>}
                  >
                    Hoàn Tất Check-Out & Dọn Dẹp
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
