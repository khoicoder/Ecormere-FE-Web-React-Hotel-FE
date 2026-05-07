import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./assets/styles/index.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
export default function index() {
    
    root.render(  
            <App />
    );

    setTimeout(() => {
        console.log("index function đã chạy sau 1 giây....");
    }, 1000);

}
index();