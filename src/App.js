import Loading from "./components/common/Loading";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header.js";
import Footer from "./components/layout/Footer.js";
import { Home as LazyHome, Detail as LazyDetail } from "./navigation/LazyNavigator.js";
import LoginScreen from "./screens/Login/Login.Screen.js";
function App() {

  console.log("App component đã render....");
  return (
    
    <BrowserRouter>
      <Header />
      <Suspense fallback={<Loading />}>
        
        <Routes>
          <Route path="/" element={<LazyHome />} />
          <Route path="/detail" element={<LazyDetail />} />
          <Route path="/login" element={<LoginScreen />} />
        </Routes>
        
      </Suspense>
   <Footer />
    </BrowserRouter>
   
  );
}
export default App;
