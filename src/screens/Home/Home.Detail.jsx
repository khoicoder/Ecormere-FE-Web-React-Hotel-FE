  import {useEffect, useState} from "react";
  import HotelCard from "../../components/hotel/HotelCard";
  import RoomCard from "../../components/room/RoomCard";
  // import { getHotels } from "../../services/hotelService"; // bật khi có BE
  export default function HomeDetail() {
  const [hotels , setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const localHotels = [
  {
    id: 101,
    name: "Hotel Cần Thơ",
    location: "Cần Thơ",
    rating: 4.5,
    priceFrom: 350000,
    image: "https://picsum.photos/400/250?random=1",
    description: "Khách sạn trung tâm, gần bến Ninh Kiều",
    rooms: [
      { id: 1011, name: "Room 101", type: "Single", price: 350000, status: "available" },
      { id: 1012, name: "Room 102", type: "Double", price: 500000, status: "booked" },
      { id: 1013, name: "Room 103", type: "VIP", price: 800000, status: "maintenance" },
    ],
  },

  {
    id: 102,
    name: "Hotel Sài Gòn",
    location: "TP.HCM",
    rating: 4.8,
    priceFrom: 500000,
    image: "https://picsum.photos/400/250?random=2",
    description: "View thành phố cực đẹp",
    rooms: [
      { id: 1021, name: "Room 201", type: "Single", price: 500000, status: "available" },
      { id: 1022, name: "Room 202", type: "Double", price: 700000, status: "booked" },
      { id: 1023, name: "Room 203", type: "VIP", price: 1200000, status: "available" },
    ],
  },

  {
    id: 103,
    name: "Hotel Đà Nẵng Beach",
    location: "Đà Nẵng",
    rating: 4.7,
    priceFrom: 450000,
    image: "https://picsum.photos/400/250?random=3",
    description: "Gần biển, view đẹp",
    rooms: [
      { id: 1031, name: "Room 301", type: "Single", price: 450000, status: "available" },
      { id: 1032, name: "Room 302", type: "Double", price: 650000, status: "available" },
      { id: 1033, name: "Room 303", type: "VIP", price: 1000000, status: "booked" },
    ],
  },

  {
    id: 104,
    name: "Hotel Hà Nội Center",
    location: "Hà Nội",
    rating: 4.6,
    priceFrom: 400000,
    image: "https://picsum.photos/400/250?random=4",
    description: "Ngay phố cổ, tiện đi lại",
    rooms: [
      { id: 1041, name: "Room 401", type: "Single", price: 400000, status: "available" },
      { id: 1042, name: "Room 402", type: "Double", price: 600000, status: "booked" },
      { id: 1043, name: "Room 403", type: "VIP", price: 950000, status: "maintenance" },
    ],
  },

  {
    id: 105,
    name: "Hotel Phú Quốc Resort",
    location: "Phú Quốc",
    rating: 4.9,
    priceFrom: 900000,
    image: "https://picsum.photos/400/250?random=5",
    description: "Resort nghỉ dưỡng cao cấp",
    rooms: [
      { id: 1051, name: "Room 501", type: "Villa", price: 2000000, status: "available" },
      { id: 1052, name: "Room 502", type: "Deluxe", price: 1500000, status: "booked" },
      { id: 1053, name: "Room 503", type: "VIP", price: 2500000, status: "available" },
    ],
  },
];
  useEffect(() => {
    setHotels(localHotels);
    console.log("Loaded hotels:", localHotels);

      // 👉 sau này bật API thì mở đoạn dưới
      /*
      const fetchHotels = async () => {
        try {
          const res = await getHotels();
          setHotels(res.data);
        } catch (err) {
          console.error("API error:", err);
          setHotels(localHotels); // fallback
        }
      };
      fetchHotels();
      */
  }, []);

console.log("selectedHotel:", selectedHotel);

  return (
      <div className="p-6">

        {/* ===== LIST HOTEL ===== */}
        {!selectedHotel && (
          <>
            <h1 className="text-2xl font-bold mb-4">🔥 Hotels nổi bật</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hotels?.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onClick={setSelectedHotel}
                />
              ))}
            </div>
          </>
        )}

        {/* ===== LIST ROOMS ===== */}
        {selectedHotel && (
          <>
            <button
              onClick={() => setSelectedHotel(null)}
              className="mb-4 text-blue-500"
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold mb-4">
              {selectedHotel?.name} - Rooms
            </h1>
            <h2 className="text-lg text-gray-600">{selectedHotel?.location}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedHotel?.rooms?.map((room) => (
                <RoomCard key={room.id} room={room}/>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }