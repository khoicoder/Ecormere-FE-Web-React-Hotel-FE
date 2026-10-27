import { lazy } from "react";

export const Home = lazy(() => import("../screens/Home/Home.Screen.jsx"));
export const Login = lazy(() => import("../screens/Login/Login.Screen.jsx"));
export const Register = lazy(() => import("../screens/Register/Register.Screen.jsx"));
export const Profile = lazy(() => import("../screens/Profile/Profile.Screen.jsx"));
export const AdminDashboard = lazy(() => import("../screens/Admin/AdminDashboard.jsx"));
export const HotelManagement = lazy(() => import("../screens/Admin/HotelManagement.jsx"));
export const EquipmentManagement = lazy(() => import("../screens/Admin/EquipmentManagement.jsx"));
export const MaintenanceManagement = lazy(() => import("../screens/Admin/MaintenanceManagement.jsx"));
export const ReceptionistDashboard = lazy(() => import("../screens/Receptionist/ReceptionistDashboard.jsx"));
export const ReceptionistManagement = lazy(() => import("../screens/Admin/ReceptionistManagement.jsx"));
export const HotelAdminManagement = lazy(() => import("../screens/Admin/HotelAdminManagement.jsx"));
