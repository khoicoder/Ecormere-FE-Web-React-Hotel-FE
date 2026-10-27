import { useEffect, useMemo, useState } from "react";
import HotelCard from "../../components/hotel/HotelCard";
import RoomCard from "../../components/room/RoomCard";
import RoomGridSelector from "../../components/room/RoomGridSelector";
import { getHotels } from "../../services/hotelService";
import { syncHotelWithBookings } from "../../services/bookingService";
import { LoadingState, EmptyState, ErrorState } from "../../components/ui/FeedbackStates";

export default function HomeDetail() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" (Cinema style) or "cards"

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getHotels();
      const data = Array.isArray(res?.data) ? res.data : [];
      setHotels(data);
    } catch (err) {
      console.error("Error fetching hotels:", err);
      setError("Không thể tải dữ liệu khách sạn từ máy chủ Backend. Vui lòng kiểm tra lại dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();

    const handleSync = () => {
      fetchHotels();
      setSelectedHotel((prev) => (prev ? syncHotelWithBookings(prev) : null));
    };

    const handleResetSelection = () => {
      setSelectedHotel(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("booking-updated", handleSync);
    window.addEventListener("reset-hotel-selection", handleResetSelection);
    return () => {
      window.removeEventListener("booking-updated", handleSync);
      window.removeEventListener("reset-hotel-selection", handleResetSelection);
    };
  }, []);

  const sortedHotels = useMemo(() => {
    return [...hotels].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [hotels]);

  if (loading) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <LoadingState message="Đang tải danh sách khách sạn và sơ đồ phòng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <ErrorState
          title="Lỗi nạp danh sách khách sạn"
          message={error}
          onRetry={fetchHotels}
        />
      </div>
    );
  }

  // Extract room cards format if needed
  const roomsForCards = selectedHotel?.floors
    ? selectedHotel.floors.flatMap((f) => f.rooms)
    : selectedHotel?.rooms || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ===== HOTEL LIST (LANDING VIEW) ===== */}
      {!selectedHotel && (
        <>
          {/* Banner Hero */}
          <div className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 text-white shadow-2xl border border-slate-800">
            <div className="relative z-10 max-w-2xl">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-indigo-500/30">
                ⭐ Đặt Phòng Thông Minh Cinema Style
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-4 mb-3">
                Đặt Khách Sạn & Chọn Phòng <span className="text-indigo-400">Trực Quan 3D</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Trải nghiệm giao diện sơ đồ chọn phòng tương tự như chọn ghế xem phim. Trực quan - Nhanh chóng - Đổi màu đỏ tức thì khi nhấp chọn!
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 border-l-4 border-indigo-600 pl-3">
                Danh Sách Khách Sạn Nổi Bật
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Chọn một khách sạn bên dưới để trải nghiệm sơ đồ chọn phòng trực quan.
              </p>
            </div>

            <button
              onClick={fetchHotels}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              🔄 Làm mới danh sách
            </button>
          </div>

          {sortedHotels.length === 0 ? (
            <EmptyState
              icon="🏨"
              title="Chưa có khách sạn nào trong hệ thống"
              description="Hiện tại chưa có khách sạn nào được kích hoạt hoặc hệ thống đang bảo trì dữ liệu."
              action={
                <button
                  onClick={fetchHotels}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Tải lại
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onClick={setSelectedHotel}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== ROOM SELECTION VIEW (SELECTED HOTEL) ===== */}
      {selectedHotel && (
        <div>
          {/* Back Navigation Bar */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelectedHotel(null)}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition"
            >
              ← Quay lại danh sách Khách Sạn
            </button>

            {/* Toggle View Mode */}
            <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎬 Sơ Đồ Rạp Phim (Khuyên Dùng)
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === "cards"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📋 Dạng Thẻ Chi Tiết
              </button>
            </div>
          </div>

          {/* Hotel Summary Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900">
                  {selectedHotel.name}
                </h1>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  ★ {selectedHotel.rating || "5.0"}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                📍 {selectedHotel.location || selectedHotel.address || "Việt Nam"}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Giá tham khảo từ</span>
              <span className="text-xl font-extrabold text-indigo-600">
                {selectedHotel.priceFrom ? Number(selectedHotel.priceFrom).toLocaleString("vi-VN") : "750.000"} đ/đêm
              </span>
            </div>
          </div>

          {/* Main Room Selector */}
          {viewMode === "grid" ? (
            <RoomGridSelector
              hotel={selectedHotel}
              onBack={() => setSelectedHotel(null)}
            />
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-800">
                  Danh Sách Phòng Khách Sạn
                </h3>
                <p className="text-xs text-slate-500">
                  Lựa chọn phòng đơn, phòng đôi hoặc suite cao cấp
                </p>
              </div>

              {roomsForCards.length === 0 ? (
                <EmptyState
                  icon="🚪"
                  title="Không có phòng nào"
                  description="Khách sạn này hiện chưa có dữ liệu phòng được cập nhật."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roomsForCards.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      hotel={selectedHotel}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
