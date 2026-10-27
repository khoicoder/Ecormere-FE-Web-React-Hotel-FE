import { useEffect, useMemo, useState } from "react";
import HotelCard from "../../components/hotel/HotelCard";
import RoomCard from "../../components/room/RoomCard";
import RoomGridSelector from "../../components/room/RoomGridSelector";
import { getHotels } from "../../services/hotelService";
import { syncHotelWithBookings } from "../../services/bookingService";


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
      setError("Không tải được dữ liệu khách sạn. Đang sử dụng dữ liệu thử nghiệm.");
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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <h2 className="text-xl font-bold text-slate-700">
            Đang tải dữ liệu khách sạn & sơ đồ phòng...
          </h2>
        </div>
      </div>
    );
  }

  // Extract room cards format if needed
  const roomsForCards = selectedHotel?.floors
    ? selectedHotel.floors.flatMap(f => f.rooms)
    : selectedHotel?.rooms || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ===== HOTEL LIST (LANDING VIEW) ===== */}
      {!selectedHotel && (
        <>
          {/* Banner Hero */}
          <div className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-8 md:p-12 text-white shadow-2xl border border-slate-800">
            <div className="relative z-10 max-w-2xl">
              <span className="bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-red-500/30">
                ⭐ Đặt Phòng Thông Minh Cinema Style
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-4 mb-3">
                Đặt Khách Sạn & Chọn Phòng <span className="text-red-500">Trực Quan 3D</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Trải nghiệm giao diện sơ đồ chọn phòng tương tự như chọn ghế xem phim. Trực quan - Nhanh chóng - Đổi màu đỏ tức thì khi nhấp chọn!
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 border-l-4 border-red-500 pl-3">
                Danh Sách Khách Sạn Nổi Bật
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Chọn một khách sạn bên dưới để trải nghiệm sơ đồ chọn phòng rạp chiếu phim màu đỏ.
              </p>
            </div>

            <button
              onClick={fetchHotels}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              🔄 Làm mới danh sách
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onClick={setSelectedHotel}
              />
            ))}
          </div>
        </>
      )}

      {/* ===== ROOM SELECTION VIEW (SELECTED HOTEL) ===== */}
      {selectedHotel && (
        <div>
          {/* Back Navigation Bar */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelectedHotel(null)}
              className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-xl transition"
            >
              ← Quay lại danh sách Khách Sạn
            </button>

            {/* Toggle View Mode */}
            <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Sơ đồ rạp chiếu phim (Giao diện Cinema Grid)"
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-red-600 text-white shadow-md" : "text-slate-700 hover:text-slate-900"}`}
              >
                🎬 Sơ Đồ Cinema (Grid)
              </button>
              <button
                onClick={() => setViewMode("cards")}
                aria-label="Danh sách thẻ phòng truyền thống"
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === "cards" ? "bg-red-600 text-white shadow-md" : "text-slate-700 hover:text-slate-900"}`}
              >
                📋 Thẻ Phòng (List)
              </button>
            </div>
          </div>

          {/* Selected Hotel Header Info */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <img
              src={selectedHotel.image}
              alt={selectedHotel.name}
              className="w-full md:w-72 h-48 rounded-xl object-cover shadow border border-slate-200"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-1 rounded-md">
                  ⭐ {selectedHotel.rating || 4.8} / 5.0
                </span>
                <span className="text-slate-400 text-xs font-semibold">| Khách sạn cao cấp</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
                {selectedHotel.name}
              </h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                📍 {selectedHotel.location}
              </p>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                {selectedHotel.description}
              </p>

              {/* Amenities */}
              {selectedHotel.amenities && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedHotel.amenities.map((item, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Content View */}
          {viewMode === "grid" ? (
            <RoomGridSelector
              hotel={selectedHotel}
              onBookingSuccess={(updatedHotel) => {
                if (updatedHotel) setSelectedHotel(updatedHotel);
                fetchHotels();
              }}
            />
          ) : (

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Danh Sách Các Loại Phòng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomsForCards.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}