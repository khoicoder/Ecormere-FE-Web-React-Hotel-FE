import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import Loading from "./components/common/Loading";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
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
  HotelAdminManagement
} from "./navigation/LazyNavigator.js";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <BrowserRouter>
        <Header />

        <Suspense fallback={<Loading />}>
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected User Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Protected Receptionist Routes */}
              <Route
                path="/receptionist/dashboard"
                element={
                  <ProtectedRoute receptionistOnly={true}>
                    <ReceptionistDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/receptionist"
                element={
                  <ProtectedRoute receptionistOnly={true}>
                    <ReceptionistDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hotels"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <HotelManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/equipment"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <EquipmentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/maintenance"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <MaintenanceManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/receptionists"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                    <ReceptionistManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hotel-admins"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <HotelAdminManagement />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 */}
              <Route
                path="*"
                element={
                  <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-4xl font-black text-slate-900">404</h2>
                    <p className="text-slate-500 text-sm mt-2">Trang bạn tìm kiếm không tồn tại hoặc đã chuyển đổi địa chỉ.</p>
                    <a href="/" className="mt-4 bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md">
                      Trở về Trang Chủ
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>
        </Suspense>

        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
