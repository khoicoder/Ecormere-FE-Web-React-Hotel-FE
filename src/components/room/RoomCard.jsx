export default function RoomCard({ room }) {
  const statusColor =
    room.status === "available"
      ? "text-green-500"
      : room.status === "booked"
      ? "text-red-500"
      : "text-yellow-500";

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-semibold">{room.name}</h2>

      <p className={`mt-2 text-sm font-medium ${statusColor}`}>
        {room.status}
      </p>
     


      {/* <p className="text-gray-500 text-sm mt-2">
        {room.description}
      </p> */}
    </div>
  );
}