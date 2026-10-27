import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Loading from "./components/common/Loading";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import PublicLayout from "./components/layout/PublicLayout.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import {
  Home,
  Login,
  Register,
  Profile,
  AdminDashboard,
  HotelManagement,
  EquipmentManagement,
  MaintenanceManagement,
  ReceptionistDashboard,
  ReceptionistManagement,
  HotelAdminManagement,
} from "./navigation/LazyNavigator.js";

// Helper for Admin/Staff Management routes
function AdminRoute({ children, allowedRoles, adminOnly, receptionistOnly }) {
  return (
    <ProtectedRoute
      allowedRoles={allowedRoles}
      adminOnly={adminOnly}
      receptionistOnly={receptionistOnly}
    >
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

// Helper for Public / Customer routes
function PublicRoute({ children, protectedUser = false }) {
  const content = <PublicLayout>{children}</PublicLayout>;
  if (protectedUser) {
    return <ProtectedRoute>{content}</ProtectedRoute>;
  }
  return content;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public / Customer Routes */}
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/profile" element={<PublicRoute protectedUser={true}><Profile /></PublicRoute>} />

          {/* Operational / Receptionist Routes */}
          <Route
            path="/receptionist/dashboard"
            element={
              <AdminRoute receptionistOnly={true}>
                <ReceptionistDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/receptionist"
            element={
              <AdminRoute receptionistOnly={true}>
                <ReceptionistDashboard />
              </AdminRoute>
            }
          />

          {/* Management / Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute adminOnly={true}>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/hotels"
            element={
              <AdminRoute adminOnly={true}>
                <HotelManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/equipment"
            element={
              <AdminRoute adminOnly={true}>
                <EquipmentManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/maintenance"
            element={
              <AdminRoute adminOnly={true}>
                <MaintenanceManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/receptionists"
            element={
              <AdminRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                <ReceptionistManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/hotel-admins"
            element={
              <AdminRoute allowedRoles={["SUPER_ADMIN"]}>
                <HotelAdminManagement />
              </AdminRoute>
            }
          />

          {/* Fallback 404 */}
          <Route
            path="*"
            element={
              <PublicRoute>
                <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-6xl mb-2">🏨</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">404</h2>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">
                    Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ khác.
                  </p>
                  <a
                    href="/"
                    className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
                  >
                    Trở về Trang Chủ
                  </a>
                </div>
              </PublicRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
