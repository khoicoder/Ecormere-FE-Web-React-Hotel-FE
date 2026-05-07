export default function HotelCard({ hotel, onClick }) {

  return (
    <div
      onClick={() => onClick(hotel)}
      className="cursor-pointer bg-white shadow-lg rounded-xl overflow-hidden hover:scale-105 transition duration-300"
    >

      {/* IMAGE */}
      <img
        src={hotel.image}
        alt={hotel.name}
        className="w-full h-52 object-cover"
      />

      {/* CONTENT */}
      <div className="p-5">

        <h2 className="text-xl font-bold">
          {hotel.name}
        </h2>

        <h3 className="text-gray-500 mt-1">
          📍 {hotel.location}
        </h3>

        <p className="mt-2 text-yellow-500 font-medium">
          ⭐ {hotel.rating}
        </p>

        <p className="mt-2 text-red-500 font-semibold">
          Từ {hotel.priceFrom?.toLocaleString("vi-VN")}đ
        </p>

        <p className="text-gray-500 mt-2">
          {hotel?.rooms?.length || 0} rooms
        </p>

      </div>
    </div>
  );
}