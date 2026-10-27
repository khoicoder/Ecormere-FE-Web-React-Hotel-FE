import React from "react";

export default function Loading({ message = "Đang tải dữ liệu..." }) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Hệ thống quản lý khách sạn đang xử lý yêu cầu...</p>
    </div>
  );
}
