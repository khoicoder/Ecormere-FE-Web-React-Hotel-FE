import api from "./api";

export const getUserProfile = async () => {
  const [profileRes, bookingsRes] = await Promise.allSettled([
    api.get("/profile"),
    api.get("/bookings/my")
  ]);

  const profile = profileRes.status === "fulfilled" ? profileRes.value.data : {};
  const myBookings = bookingsRes.status === "fulfilled" && Array.isArray(bookingsRes.value.data)
    ? bookingsRes.value.data
    : [];

  return {
    ...profile,
    bookings: myBookings
  };
};

export const updateUserProfile = async (data) => {
  const response = await api.put("/profile-update", data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put("/users/me/password", data);
  return response.data;
};
