import { useState, useEffect } from "react";
import { updateUserProfile, getUserProfile } from "../../services/userService.js";
import ProfileField from "./ProfileField.jsx";
export default function ProfileForm() {
    
    const [profileData, setProfileData] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(
        {
        username: false,
        email: false,
        avatarUrl: false,
        address: false,
        phone: false,
        password: false,

        });
    

    const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    avatarUrl: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    });
    



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getUserProfile();
            setProfileData(data);
            setFormData(prev => ({
                ...prev,
                username: data.username,
                email: data.email || "",
                phone: data.phone || "",
                avatarUrl: data.avatarUrl || "",
                address: data.address || "",
                currentPassword: "",
                newPassword: "",    
                
            }));
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setMessage("❌ Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
    };

    const handleChange = (e) => {
        
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const toggleEdit = (field) => {
        setEditMode(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        ;
        const payload = {};
            if(editMode.username) payload.username = formData.username;
            if(editMode.email) payload.email = formData.email;
            if(editMode.phone) payload.phone = formData.phone;
            if(editMode.avatarUrl) payload.avatarUrl = formData.avatarUrl;
            if(editMode.address) payload.address = formData.address;
            if(editMode.password) {
                payload.currentPassword = formData.currentPassword;
                payload.newPassword = formData.newPassword;
            }
            console.log("EDIT MODE:", editMode)
            console.log("PAYLOAD UPDATE PROFILE:", payload);
            console.log("FORM DATA:", formData);


        try {

            const data = await updateUserProfile(payload);
            console.log("RESPONSE UPDATE PROFILE:", data);
            if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
        }

        if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
        }

        if (data.username) {
            localStorage.setItem("username", data.username);
        }

        if (data.role) {
            localStorage.setItem("role", data.role);
        }

            
        

        
        
                    

    

            setMessage("✅ Cập nhật hồ sơ thành công!");
            await fetchData();
            setEditMode({
                username: false,
                email: false,
                avatarUrl: false,
                address: false,
                phone: false,
                password: false,
            });
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

    console.log("Dữ liệu hồ sơ người dùng:", profileData);
    localStorage.getItem("accessToken")

    return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Hồ sơ cá nhân
                </h1>
                <p className="text-slate-500 mt-1">
                    Quản lý thông tin tài khoản, ảnh đại diện và bảo mật.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT CARD */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <img
                                    src={
                                        profileData.avatarUrl ||
                                        "https://ui-avatars.com/api/?name=" +
                                            encodeURIComponent(profileData.username || "User")
                                    }
                                    alt="Avatar"
                                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-blue-100"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditMode({
                                            ...editMode,
                                            avatarUrl: !editMode.avatarUrl,
                                        })
                                    }
                                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition flex items-center justify-center"
                                    title="Đổi ảnh"
                                >
                                    ✎
                                </button>
                            </div>

                            <h2 className="mt-5 text-xl font-bold text-slate-900">
                                {profileData.username}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                {profileData.email || "Chưa cập nhật email"}
                            </p>

                            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                                {profileData.role || "USER"}
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Số điện thoại</span>
                                <span className="font-medium text-slate-800">
                                    {profileData.phone || "Chưa có"}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm gap-4">
                                <span className="text-slate-500">Địa chỉ</span>
                                <span className="font-medium text-slate-800 text-right">
                                    {profileData.address || "Chưa có"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT FORM */}
                <div className="lg:col-span-2">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">
                                Thông tin tài khoản
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Bấm “Chỉnh sửa” ở từng mục nếu bạn muốn thay đổi.
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Username */}
                            <ProfileField
                                label="Tên người dùng"
                                value={profileData.username}
                                editing={editMode.username}
                                onToggle={() =>
                                    setEditMode({
                                        ...editMode,
                                        username: !editMode.username,
                                    })
                                }
                            >
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                                    placeholder="Nhập tên mới"
                                />
                            </ProfileField>

                            {/* Email */}
                            <ProfileField
                                label="Email"
                                value={profileData.email || "Chưa cập nhật email"}
                                editing={editMode.email}
                                onToggle={() =>
                                    setEditMode({
                                        ...editMode,
                                        email: !editMode.email,
                                    })
                                }
                            >
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                                    placeholder="example@gmail.com"
                                />
                            </ProfileField>

                            {/* Phone */}
                            <ProfileField
                                label="Số điện thoại"
                                value={profileData.phone || "Chưa cập nhật số điện thoại"}
                                editing={editMode.phone}
                                onToggle={() =>
                                    setEditMode({
                                        ...editMode,
                                        phone: !editMode.phone,
                                    })
                                }
                            >
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                                    placeholder="09xxx..."
                                />
                            </ProfileField>

                            {/* Address */}
                            <ProfileField
                                label="Địa chỉ"
                                value={profileData.address || "Chưa cập nhật địa chỉ"}
                                editing={editMode.address}
                                onToggle={() =>
                                    setEditMode({
                                        ...editMode,
                                        address: !editMode.address,
                                    })
                                }
                            >
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                                    placeholder="Nhập địa chỉ"
                                />
                            </ProfileField>

                            {/* Avatar URL */}
                            {editMode.avatarUrl && (
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">
                                                Ảnh đại diện
                                            </h4>
                                            <p className="text-sm text-slate-500">
                                                Dán link ảnh mới của bạn.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditMode({
                                                    ...editMode,
                                                    avatarUrl: false,
                                                })
                                            }
                                            className="text-sm font-medium text-slate-500 hover:text-red-500"
                                        >
                                            Hủy
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        name="avatarUrl"
                                        value={formData.avatarUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition bg-white"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {/* Password */}
                            <div className="rounded-2xl border border-slate-200 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-slate-900">
                                            Bảo mật
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            Đổi mật khẩu nếu bạn muốn tăng bảo mật.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditMode({
                                                ...editMode,
                                                password: !editMode.password,
                                            })
                                        }
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                            editMode.password
                                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                : "bg-slate-900 text-white hover:bg-slate-800"
                                        }`}
                                    >
                                        {editMode.password ? "Hủy" : "Đổi mật khẩu"}
                                    </button>
                                </div>

                                {editMode.password && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                                            placeholder="Mật khẩu hiện tại"
                                        />

                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                                            placeholder="Mật khẩu mới"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Chỉ các mục đang bật chỉnh sửa mới được gửi lên server.
                            </p>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-3 rounded-xl font-bold text-white transition shadow-sm ${
                                    loading
                                        ? "bg-slate-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                                }`}
                            >
                                {loading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </form>

                    {message && (
                        <div
                            className={`mt-5 p-4 rounded-2xl text-center font-medium border ${
                                message.includes("thành công")
                                    ? "bg-green-50 text-green-700 border-green-100"
                                    : "bg-red-50 text-red-700 border-red-100"
                            }`}
                        >
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
)}