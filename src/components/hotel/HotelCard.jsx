export default function HotelCard({ hotel, onClick }) {
  return (
    <div
      onClick={() => onClick(hotel)}
      className="cursor-pointer bg-white shadow-lg rounded-xl p-5 hover:scale-105 transition"
    >
      <h2 className="text-xl font-semibold">{hotel.name}</h2>
      <h3 className="text-lg text-gray-600">{hotel.location}</h3>
      
      <p className="text-gray-500 mt-2">
        {hotel.rooms.length || 0} rooms
      </p>
    </div>
  );
}