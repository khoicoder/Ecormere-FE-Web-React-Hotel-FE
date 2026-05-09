import Loading from "./components/common/Loading";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import { Home  } from "./navigation/LazyNavigator.js";
import RegisterScreen from "./screens/Register/Register.Screen.jsx";
import LoginScreen from "./screens/Login/Login.Screen.jsx";
import ProfileScreen from "./screens/Profile/Profile.Srceen.jsx";
function App() {

  console.log("App component đã render....");
  return (
    <div className="min-h-screen flex flex-col">
      <BrowserRouter>
        
        <Header />

        <Suspense fallback={<Loading />}>
    {/*Sử dụng các component được lazy load ở đây --> */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="*" element={<div className="text-center text-2xl mt-10">404 - Page Not Found</div>} />
              <Route path="/dashboard" element={<div className="text-center text-2xl mt-10">Dashboard</div>} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Routes>
          </main>

        </Suspense>

        <Footer />

      </BrowserRouter>
    </div>
  );

}
export default App;
