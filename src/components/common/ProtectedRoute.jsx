import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false, receptionistOnly = false, allowedRoles = null }) {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("userRole");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    if (role === "RECEPTIONIST") {
      return <Navigate to="/receptionist/dashboard" replace />;
    }
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 text-center rounded-2xl">
        <h2 className="text-xl font-bold text-red-600">Quyền Truy Cập Bị Từ Chối</h2>
        <p className="text-slate-600 text-sm mt-2">Bạn không có quyền truy cập vào khu vực này.</p>
        <a href="/" className="inline-block mt-4 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Trở về Trang Chủ
        </a>
      </div>
    );
  }

  if (receptionistOnly && role !== "RECEPTIONIST" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-amber-50 border border-amber-200 text-center rounded-2xl">
        <h2 className="text-xl font-bold text-amber-700">Dành Riêng Cho Bàn Lễ Tân</h2>
        <p className="text-slate-600 text-sm mt-2">Trang này dành cho Lễ tân hoặc Quản trị viên điều hành.</p>
        <a href="/" className="inline-block mt-4 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Trở về Trang Chủ
        </a>
      </div>
    );
  }

  if (adminOnly && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    if (role === "RECEPTIONIST") {
      return <Navigate to="/receptionist/dashboard" replace />;
    }
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 text-center rounded-2xl">
        <h2 className="text-xl font-bold text-red-600">Quyền Truy Cập Bị Từ Chối</h2>
        <p className="text-slate-600 text-sm mt-2">Trang này chỉ dành cho quản trị viên (Admin).</p>
        <a href="/" className="inline-block mt-4 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Trở về Trang Chủ
        </a>
      </div>
    );
  }

  return children;
}
