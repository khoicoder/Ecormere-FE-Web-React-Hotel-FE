import React from "react";

export function LoadingState({ message = "Đang tải dữ liệu...", className = "" }) {
  return (
    <div className={`py-16 flex flex-col items-center justify-center text-center ${className}`}>
      <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon = "📂",
  title = "Không có dữ liệu",
  description = "Hiện tại chưa có bản ghi nào phù hợp với điều kiện hiển thị.",
  action = null,
  className = "",
}) {
  return (
    <div className={`py-14 px-4 text-center max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
        {icon}
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Đã xảy ra lỗi",
  message = "Không thể kết nối đến máy chủ hoặc dữ liệu bị gián đoạn.",
  onRetry = null,
  className = "",
}) {
  return (
    <div className={`py-12 px-4 text-center max-w-md mx-auto ${className}`}>
      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3 border border-rose-200">
        ⚠️
      </div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-rose-600 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
        >
          🔄 Thử lại
        </button>
      )}
    </div>
  );
}

export function Alert({ type = "info", message, onClose, className = "" }) {
  if (!message) return null;

  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-rose-50 border-rose-200 text-rose-800",
  };

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    danger: "❌",
  };

  return (
    <div
      className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-sm ${styles[type] || styles.info} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span>{icons[type] || "ℹ️"}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm focus:outline-none"
        >
          ✕
        </button>
      )}
    </div>
  );
}
