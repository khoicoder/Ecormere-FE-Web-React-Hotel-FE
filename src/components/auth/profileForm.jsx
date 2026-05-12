import { useState, useEffect } from "react";
import { updateUserProfile, getUserProfile } from "../../services/userService.js";

export default function ProfileForm() {
    const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    });
    
    


    const [profileData, setProfileData] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getUserProfile();
            setProfileData(
                {
                    ...profileData,
                    username: data.username,
                    email: data.email || "",
                    role : data.role || "",
                    avatar : data.avatar || "",
                }
            );
            setFormData({
                ...formData,
                username: data.username,
                email: data.email || "",
                phone: data.phone || "",
                avatar: data.avatar || "",
                address: data.address || "",
                currentPassword: "",
                newPassword: "",    
                
            });
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setMessage("❌ Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const data = await updateUserProfile(formData);
            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
            }
            setMessage("✅ Cập nhật hồ sơ thành công!");
            fetchData();
        } catch (error) {
            setMessage("❌ Cập nhật thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (!profileData) return (
        <div className="flex justify-center items-center h-screen italic text-gray-500">
            Đang tải dữ liệu người dùng...
        </div>
    );
    // const DataNameUser = localStorage.getItem("username") || "";
    // const DataEmailUser = localStorage.getItem("email") || "";
    console.log("Dữ liệu hồ sơ người dùng:", profileData);

    return (
        <div className="max-w-2xl mx-auto my-10 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Hồ Sơ Cá Nhân</h2>

            {/*THÔNG TIN HIỆN TẠI*/}
            <div className="bg-blue-50 p-6 rounded-xl mb-8 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <img 
                        src={profileData.avatar|| null} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                </div>
                <div className="flex-1 space-y-1 text-center md:text-left">
                    <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Thông tin hiện tại</p>
                    <h3 className="text-xl font-bold text-gray-900"> {profileData.username}</h3>
                    <p className="text-gray-600">{profileData.email}</p>
                    <p className="text-gray-500 text-sm">{profileData.address || "Chưa cập nhật địa chỉ"}</p>
                </div>
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* FORM CẬP NHẬT */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="09xxx..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Avatar URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh đại diện</label>
                        <input
                            type="text"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>
                </div>

                {/* Địa chỉ */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                </div>

                {/* Mật khẩu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-50">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Nút Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-200 ${
                        loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200"
                    }`}
                >
                    {loading ? "Đang xử lý..." : "Cập nhật tài khoản"}
                </button>
            </form>

            {/* Thông báo */}
            {message && (
                <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
                    message.includes("thành công") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}