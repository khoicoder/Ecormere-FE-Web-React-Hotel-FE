import { useState } from "react";
import { updateUserProfile } from "../../services/userService.js";
export default function ProfileForm() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await updateUserProfile(formData);
            console.log(data);
            localStorage.setItem(
                "accessToken",
                data.accessToken
            );

            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );

            setMessage("Update profile thành công");
        } catch (error) {
            setMessage("Update profile thất bại");
            console.error(error);

        }
    };

    return (
        <div
            style={{
                maxWidth: "400px",
                margin: "50px auto",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "10px",
            }}
        >
            <h2>Update Profile</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                        style={{ width: "100%", padding: "10px" }}
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        style={{ width: "100%", padding: "10px" }}
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <label>Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                        style={{ width: "100%", padding: "10px" }}
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <label>New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        style={{ width: "100%", padding: "10px" }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Updating..." : "Update Profile"}
                </button>
            </form>

            {message && (
                <p style={{ marginTop: "15px" }}>
                    {message}
                </p>
            )}
        </div>
    );
}