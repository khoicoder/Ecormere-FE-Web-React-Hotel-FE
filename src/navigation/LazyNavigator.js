import { lazy } from "react";

export const Home = lazy(() => import("../screens/Home/Home.Screen.jsx"));
export const Login = lazy(() => import("../screens/Login/Login.Screen.jsx"));
export const Register = lazy(() => import("../screens/Register/Register.Screen.jsx"));