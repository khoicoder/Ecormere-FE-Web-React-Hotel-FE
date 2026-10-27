import api from "./api";

// Fetch bookings from real backend API
export const fetchBookingsAPI = async () => {
  try {
    const res = await api.get("/bookings");
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    return [];
  }
};

// Create a new booking calling REAL BE API
export const createBooking = async ({ hotelId, hotelName, room, checkIn, checkOut, nights }) => {
  const formattedCheckIn = checkIn ? (checkIn.includes("T") ? checkIn.split("T")[0] : checkIn) : new Date().toISOString().split("T")[0];
  const formattedCheckOut = checkOut ? (checkOut.includes("T") ? checkOut.split("T")[0] : checkOut) : new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const res = await api.post("/bookings", {
    roomId: Number(room.id),
    checkInDate: formattedCheckIn,
    checkOutDate: formattedCheckOut
  });

  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Cancel booking calling REAL BE API
export const cancelBooking = async (bookingId) => {
  const res = await api.post ? await api.patch(`/bookings/${bookingId}/cancel`) : await api.patch(`/bookings/${bookingId}/cancel`);
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Check-in API
export const performCheckIn = async (bookingId) => {
  const res = await api.post(`/bookings/${bookingId}/check-in`);
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Check-out API with extra charges and reconciliation
export const performCheckOut = async (bookingId, payload = {}) => {
  const res = await api.post(`/bookings/${bookingId}/check-out`, payload);
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Get bill preview for invoice reconciliation
export const getBillPreview = async (bookingId) => {
  const res = await api.get(`/bookings/${bookingId}/bill`);
  return res.data;
};

// Process receptionist payment (Cash, Transfer, Card)
export const processReceptionistPayment = async (bookingId, paymentPayload) => {
  const res = await api.post(`/bookings/${bookingId}/payments`, paymentPayload);
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Trigger overdue & no-show expiration
export const triggerOverdueExpiration = async () => {
  const res = await api.post("/bookings/cron/expire-overdue");
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Legacy quick status update
export const updateBookingStatus = async (bookingId, status) => {
  const res = await api.patch(`/bookings/${bookingId}/status`, { status });
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Legacy quick payment update
export const updateBookingPayment = async (bookingId, paymentStatus = "PAID") => {
  const res = await api.patch(`/bookings/${bookingId}/payment`, { paymentStatus });
  window.dispatchEvent(new Event("booking-updated"));
  return res.data;
};

// Get bookings by hotel
export const getBookingsByHotel = async (hotelId) => {
  try {
    const res = await api.get("/bookings");
    const list = Array.isArray(res.data) ? res.data : [];
    return list.filter(b => Number(b.hotelId) === Number(hotelId));
  } catch {
    return [];
  }
};

// Sync hotel object rooms
export const syncHotelWithBookings = (hotel) => {
  if (!hotel) return hotel;
  return hotel;
};
