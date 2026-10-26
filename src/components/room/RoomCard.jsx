import React from "react";

export default function RoomCard({ room, onSelect }) {
  const isAvailable = room.status === "AVAILABLE" || room.status === "available";
  const isOccupied = room.status === "OCCUPIED" || room.status === "booked";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Phòng {room.number || (room.name ? (room.name.match(/\d+/) ? room.name.match(/\d+/)[0] : room.id) : room.id)}
          </span>
          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
              isAvailable
                ? "bg-emerald-100 text-emerald-700"
                : isOccupied
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isAvailable ? "● Còn Trống" : isOccupied ? "● Đã Có Người Đặt" : "● Bảo Trì"}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 mt-2">
          {room.type || (room.name ? room.name.replace(/Phòng \d+\s*-?\s*/i, "").trim() : "Standard Room")}
        </h3>

        {isOccupied && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <span className="font-extrabold text-amber-900 block">
              👤 Đã được đặt bởi: @{room.bookedBy || "khách hàng"}
            </span>
            <span className="text-[11px] text-amber-700 block mt-0.5">
              📅 Lưu trú: {room.checkInDate || room.checkIn || "Hôm nay"} ➔ {room.checkOutDate || room.checkOut || "Ngày mai"}
            </span>
          </div>
        )}

        <div className="mt-3 text-sm text-slate-600 space-y-1">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>👥 Tối đa 2 - 4 người lớn</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>🛏️ Giường King Size & Ban công</span>
          </p>
        </div>
      </div>


      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Giá theo đêm</span>
          <span className="text-lg font-black text-red-600">
            {(room.price || 500000).toLocaleString("vi-VN")} đ
          </span>
        </div>

        {onSelect && isAvailable && (
          <button
            onClick={() => onSelect(room)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-red-200"
          >
            Chọn Phòng này
          </button>
        )}
      </div>
    </div>
  );
}