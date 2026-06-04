
// check ROLE before render admin form
import { useState } from "react";
export function AdminForm() {
    const [message, setMessage] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
    });
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });};

return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-center">Admin Form</h2>
    </div>
)

    }