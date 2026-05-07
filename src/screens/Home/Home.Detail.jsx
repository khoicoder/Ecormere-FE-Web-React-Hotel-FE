import { useEffect, useMemo, useState } from "react";
import HotelCard from "../../components/hotel/HotelCard";
import RoomCard from "../../components/room/RoomCard";
import { getHotels } from "../../services/hotelService";

export default function HomeDetail() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH HOTELS
  // =========================
  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getHotels();
      console.log("Fetched hotels:", res.data);
      const data = Array.isArray(res.data) ? res.data : [];
      
      setHotels(data);
    } catch (err) {
      console.error("Error fetching hotels:", err);
      setError("Không tải được dữ liệu khách sạn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getHotels();

        if (!isMounted) return;

        const data = Array.isArray(res.data) ? res.data : [];
        setHotels(data);
      } catch (err) {
        if (!isMounted) return;

        console.error("Error fetching hotels:", err);
        setError("Không tải được dữ liệu khách sạn. Vui lòng thử lại.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // SORT HOTEL BY RATING DESC
  // =========================
  const sortedHotels = useMemo(() => {
    return [...hotels].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [hotels]);

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <h2 className="text-xl font-semibold text-red-500">
            Đang tải dữ liệu, đợi chút...
          </h2>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR UI
  // =========================
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <h2 className="text-xl font-semibold text-red-600">Có lỗi xảy ra</h2>
          <p className="mt-2 text-gray-700">{error}</p>

          <button
            onClick={fetchHotels}
            className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // EMPTY STATE
  // =========================
  if (!selectedHotel && sortedHotels.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold">Chưa có khách sạn nào</h2>
          <p className="mt-2 text-gray-500">Dữ liệu từ DB đang trống.</p>

          <button
            onClick={fetchHotels}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================
  const rooms = selectedHotel?.rooms ?? [];

  return (
    <div className="p-6">
      {/* ===== HOTEL LIST ===== */}
      {!selectedHotel && (
        <>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold border-b-2 border-red-500 pb-2">Hotels nổi bật</h1>
              <p className="text-gray-500">
                Danh sách khách sạn được sắp xếp theo đánh giá từ cao đến thấp.
              </p>
            </div>

            <button
              onClick={fetchHotels}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Làm mới
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

      {/* ===== ROOM LIST ===== */}
      {selectedHotel && (
        <>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <button
                onClick={() => setSelectedHotel(null)}
                className="mb-3 text-blue-500 hover:underline"
              >
                ← Back
              </button>

              <h1 className="text-3xl font-bold">{selectedHotel?.name}</h1>
              <p className="text-gray-600">📍 {selectedHotel?.location}</p>
              <img
                src={selectedHotel?.image}
                alt={selectedHotel?.name}
                className="my-4 w-full max-w-md rounded-lg object-cover"
              /> 
              <p className="mt-1 text-sm text-gray-500">
                ⭐ {selectedHotel?.rating ?? "Chưa có đánh giá"}
              </p>

              <p className="mt-3 max-w-2xl text-gray-700">
                {selectedHotel?.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedHotel(null)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Xem lại danh sách
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))
            ) : (
              <div className="rounded-xl border bg-white p-6 text-gray-500 shadow-sm">
                Khách sạn này chưa có phòng.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}