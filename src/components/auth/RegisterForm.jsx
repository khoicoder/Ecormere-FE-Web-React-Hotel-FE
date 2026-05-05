import {useState} from "react";
import {registerAPI} from "../../services/authService.js";
export default function RegisterForm() {
    const[form,setForm] = useState({
        username:"" ,
        password:""
    })
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await registerAPI(form);


            console.log("Registration successful:", response);
        }
        catch (error) {
            console.error("Registration failed:", error);
        }   }
    return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-[400px]">
    <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

    <form onSubmit={handleSubmit} className="space-y-4">
        <input
        name="username"
        placeholder="Username"
        onChange={handleChange}
        className="w-full p-2 border rounded-lg"
        />

        <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        className="w-full p-2 border rounded-lg"
        />

        <button className="w-full bg-green-500 text-white py-2 rounded-lg">
        Register
        </button>
    </form>
    </div>
);
}
    
    
    