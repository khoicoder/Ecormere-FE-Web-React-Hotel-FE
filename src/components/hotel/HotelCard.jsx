import React from "react";

export default function HotelCard({ hotel, onClick }) {
  const displayPrice = hotel.pricePerNight || hotel.priceFrom || 650000;
  const roomCount = hotel.floors
    ? hotel.floors.reduce((acc, f) => acc + f.rooms.length, 0)
    : hotel?.rooms?.length || 10;

  return (
    <div
      onClick={() => onClick(hotel)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/80 flex flex-col justify-between"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative overflow-hidden h-52">
        <img
          src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1 shadow">
          ⭐ {hotel.rating || 4.8}
        </div>

        {/* Cinema Tag */}
        <div className="absolute bottom-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow uppercase tracking-wider">
          🎬 Sơ đồ phòng Cinema Grid
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition line-clamp-1">
            {hotel.name}
          </h2>

          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 line-clamp-1">
            📍 {hotel.location}
          </p>

          <p className="text-slate-600 text-xs mt-2.5 line-clamp-2 leading-relaxed">
            {hotel.description || "Khách sạn cao cấp với dịch vụ phòng tiện nghi, sơ đồ chọn phòng trực quan."}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Giá từ chỉ</span>
            <span className="text-lg font-black text-red-600 tracking-tight">
              {displayPrice.toLocaleString("vi-VN")} <span className="text-xs font-semibold text-slate-500">đ/đêm</span>
            </span>
          </div>

          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 group-hover:bg-red-600 group-hover:text-white transition">
            Chọn Phòng →
          </span>
        </div>
      </div>
    </div>
  );
}