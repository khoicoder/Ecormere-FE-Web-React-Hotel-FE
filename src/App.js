import Loading from "./components/common/Loading";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import { Home  } from "./navigation/LazyNavigator.js";
import RegisterScreen from "./screens/Register/Register.Screen.jsx";
import LoginScreen from "./screens/Login/Login.Screen.jsx";
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
            </Routes>
          </main>

        </Suspense>

        <Footer />

      </BrowserRouter>
    </div>
  );

}
export default App;
