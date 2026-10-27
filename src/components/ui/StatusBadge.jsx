import React from "react";

export function StatusBadge({ status, type = "booking", className = "" }) {
  if (!status) return null;

  const raw = String(status).toUpperCase().trim();

  // Color config map
  const configs = {
    // Booking Status
    PENDING: { label: "Chờ thanh toán", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    CONFIRMED: { label: "Đã xác nhận", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
    CHECKED_IN: { label: "Đang lưu trú", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    CHECKED_OUT: { label: "Đã trả phòng", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
    COMPLETED: { label: "Hoàn tất", bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", dot: "bg-slate-500" },
    CANCELLED: { label: "Đã hủy", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    EXPIRED: { label: "Đã hết hạn", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" },
    NO_SHOW: { label: "Vắng mặt (No-Show)", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },

    // Payment Status
    PAID: { label: "Đã thanh toán", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    PARTIALLY_PAID: { label: "Thanh toán 1 phần", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    UNPAID: { label: "Chưa thanh toán", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    REFUNDED: { label: "Đã hoàn tiền", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    FAILED: { label: "Thất bại", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },

    // Stay Status
    NOT_CHECKED_IN: { label: "Chưa nhận phòng", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },

    // Room Status
    AVAILABLE: { label: "Phòng trống", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    OCCUPIED: { label: "Đang có khách", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
    BOOKED: { label: "Đã giữ chỗ", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    CLEANING: { label: "Đang dọn dẹp", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    MAINTENANCE: { label: "Bảo trì", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    OUT_OF_SERVICE: { label: "Ngừng phục vụ", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400" },

    // Maintenance Ticket Status
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
    RESOLVED: { label: "Đã khắc phục", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },

    // Priority
    LOW: { label: "Thấp", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
    MEDIUM: { label: "Trung bình", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", dot: "bg-blue-400" },
    HIGH: { label: "Cao", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    CRITICAL: { label: "Khẩn cấp", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },

    // Equipment Status
    WORKING: { label: "Hoạt động tốt", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    BROKEN: { label: "Hỏng hóc", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },

    // Hotel Status
    ACTIVE: { label: "Hoạt động", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    INACTIVE: { label: "Tạm dừng", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" },
  };

  const c = configs[raw] || {
    label: raw,
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      <span>{c.label}</span>
    </span>
  );
}

export default StatusBadge;
