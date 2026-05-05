    import {useState} from "react";
    import {registerAPI} from "../../services/authService.js";
    import { useNavigate } from "react-router-dom";
    export default function RegisterForm() {
        const navigate = useNavigate();
        const [error, setError] = useState("");

        const[form,setForm] = useState({
            username:"" ,
            password:"",
            confirmPassword:""
        })
        const validatePassword = (password) => {
                const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
                return regex.test(password);
            
        }
        const handleChange = (e) => {
            setForm({
                ...form,
                [e.target.name]: e.target.value
            });
            setError("");
        }
    
        const handleSubmit = async (e) => {
            e.preventDefault();
            console.log("Form data before validation:", form);

        // 1. check rỗng
    if (!form.username || !form.password || !form.confirmPassword) {
    setError("Vui lòng nhập đầy đủ thông tin");
    return;
    }

    // 2. check confirm
        if (form.password !== form.confirmPassword) {
    setError("Password and Confirm Password do not match!");
    return;
    }

    // 3. check regex
    if (!validatePassword(form.password)) {
    setError("Password ≥6 ký tự, gồm chữ hoa, chữ thường và số.");
    return;
    }
        try {
            await registerAPI({
            username : form.username,
            password : form.password,
        });
            console.log("Registration successful:", form.username, form.password);
            navigate("/login");
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

            <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            />
            {error && (
            <p className="text-red-500 text-sm">{error}</p>
            )}

            <button className="w-full bg-green-500 text-white py-2 rounded-lg">
            Register
            </button>
        </form>
        </div>
    );
    }
        
        
        