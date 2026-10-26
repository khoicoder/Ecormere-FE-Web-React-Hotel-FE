import React, { useState, useEffect, useMemo } from 'react';
import {
  createBooking,
  cancelBooking,
  getBookingsByHotel,
  syncHotelWithBookings
} from '../../services/bookingService';

export default function RoomGridSelector({ hotel, onBookingSuccess }) {
  const [activeHotel, setActiveHotel] = useState(() => syncHotelWithBookings(hotel));
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [checkInDate, setCheckInDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [showModal, setShowModal] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [hotelBookings, setHotelBookings] = useState([]);

  const currentUsername = localStorage.getItem("username") || "user";
  const userRole = localStorage.getItem("userRole") || "USER";

  // Sync hotel & live bookings from backend
  const refreshHotelState = async () => {
    if (!hotel) return;
    setActiveHotel(hotel);
    try {
      const bookings = await getBookingsByHotel(hotel.id);
      setHotelBookings(Array.isArray(bookings) ? bookings : []);
    } catch (err) {
      console.warn("Could not load hotel bookings:", err);
      setHotelBookings([]);
    }
  };

  useEffect(() => {
    refreshHotelState();
  }, [hotel]);

  // Listen to cross-component booking events
  useEffect(() => {
    const handleUpdate = () => {
      refreshHotelState();
    };
    window.addEventListener("booking-updated", handleUpdate);
    return () => window.removeEventListener("booking-updated", handleUpdate);
  }, [hotel]);

  // Derive structured floors dynamically from real database rooms
  const floors = useMemo(() => {
    if (activeHotel?.floors && activeHotel.floors.length > 0) {
      return activeHotel.floors;
    }
    const rawRooms = activeHotel?.rooms || [];
    if (rawRooms.length === 0) return [];

    const floorMap = {};
    rawRooms.forEach(room => {
      let roomNum = String(room.id);
      let floorNum = 1;
      const match = (room.name || "").match(/\d+/);
      if (match) {
        roomNum = match[0];
        const parsed = parseInt(roomNum, 10);
        if (parsed >= 1000) {
          floorNum = Math.floor((parsed % 1000) / 100) || 1;
        } else {
          floorNum = Math.floor(parsed / 100) || 1;
        }
      }

      // Check if this room has an active booking in hotelBookings
      const activeBooking = (hotelBookings || []).find(b => 
        Number(b.roomId) === Number(room.id) &&
        b.status !== 'CANCELLED'
      );

      const isOccupied = activeBooking != null || room.status === 'OCCUPIED' || room.status === 'BOOKED';

      const enrichedRoom = {
        ...room,
        number: roomNum,
        type: room.type || (room.name || "").replace(/Phòng \d+\s*-?\s*/i, "").trim() || "Tiêu chuẩn",
        price: room.price || 650000,
        status: isOccupied ? 'OCCUPIED' : (room.status || 'AVAILABLE'),
        bookedBy: activeBooking ? (activeBooking.username || activeBooking.customerName || "Khách") : (isOccupied ? "Khách VIP" : null),
        bookingId: activeBooking?.id,
        checkIn: activeBooking?.checkInDate || activeBooking?.checkIn,
        checkOut: activeBooking?.checkOutDate || activeBooking?.checkOut
      };

      if (!floorMap[floorNum]) {
        const floorTitle = floorNum === 1 ? "Tầng 1 - Standard & Superior"
          : floorNum === 2 ? "Tầng 2 - Deluxe & Suite"
          : floorNum === 3 ? "Tầng 3 - Executive & VIP"
          : `Tầng ${floorNum} - Panorama & Penthouse`;

        floorMap[floorNum] = {
          floorNumber: floorNum,
          name: floorTitle,
          rooms: []
        };
      }
      floorMap[floorNum].rooms.push(enrichedRoom);
    });

    return Object.values(floorMap).sort((a, b) => a.floorNumber - b.floorNumber);
  }, [activeHotel, hotelBookings]);

  const allRooms = floors.flatMap(f => f.rooms);

  const toggleRoomSelection = (roomId, status) => {
    if (status !== 'AVAILABLE') return;
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const selectedRooms = allRooms.filter(r => selectedRoomIds.includes(r.id));

  // Calculate nights
  const calculateNights = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.max(end - start, 86400000);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const nights = calculateNights();
  const totalPrice = selectedRooms.reduce((sum, room) => sum + (room.price || 500000) * nights, 0);

  const handleConfirmBooking = () => {
    if (selectedRooms.length === 0) return;
    setShowModal(true);
  };

  const executeBooking = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập tài khoản để thực hiện đặt phòng!");
      window.location.href = "/login";
      return;
    }

    try {
      setBookingSuccessMsg(true);

      // Book every selected room sequentially
      for (const room of selectedRooms) {
        await createBooking({
          hotelId: activeHotel.id,
          hotelName: activeHotel.name,
          room,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          username: currentUsername
        });
      }

      await refreshHotelState();

      setTimeout(() => {
        setBookingSuccessMsg(false);
        setShowModal(false);
        setSelectedRoomIds([]);
        setFeedbackMsg(`🎉 Đặt thành công ${selectedRooms.length} phòng cho tài khoản @${currentUsername}!`);
        setTimeout(() => setFeedbackMsg(""), 4000);
        if (onBookingSuccess) onBookingSuccess(activeHotel);
      }, 1500);
    } catch (err) {
      console.error("Booking error:", err);
      const errMsg = err.response?.data?.message || err.message || "Có lỗi khi đặt phòng, vui lòng thử lại!";
      alert("❌ Đặt phòng không thành công:\n" + errMsg);
      setBookingSuccessMsg(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng này? Phòng sẽ được giải phóng về trạng thái còn trống.")) {
      try {
        await cancelBooking(bookingId);
        await refreshHotelState();
        setFeedbackMsg("Đã hủy đơn đặt phòng thành công!");
        setTimeout(() => setFeedbackMsg(""), 3000);
      } catch (err) {
        alert("Lỗi khi hủy phòng: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="space-y-8 my-6">
      {/* ===== CINEMA GRID CONTAINER ===== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700">
        {/* Header & Legend */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-red-500/40">
                Cinema Style Interactive
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                👤 Đang đăng nhập: <strong className="text-white">@{currentUsername}</strong>
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-2">Sơ Đồ Trực Quan Chọn Phòng</h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Nhấp trực tiếp vào ô phòng trống để chọn (đổi màu đỏ rực rỡ). Các phòng màu xám có hiển thị rõ <strong className="text-amber-300">Ai đang đặt phòng nào</strong>.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/90 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-500/30 border-2 border-emerald-500 shadow-sm shadow-emerald-500/50"></div>
              <span className="text-emerald-300 font-semibold">Còn Trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-red-600 border-2 border-red-400 shadow-sm shadow-red-500/80 animate-pulse"></div>
              <span className="text-red-400 font-bold">Bạn Đang Chọn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-purple-900/80 border-2 border-purple-400"></div>
              <span className="text-purple-300 font-bold">Bạn Đang Đặt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-600"></div>
              <span className="text-slate-400">Khách Khác Đặt</span>
            </div>
          </div>
        </div>

        {feedbackMsg && (
          <div className="my-4 p-3 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40 animate-fadeIn flex items-center justify-between">
            <span>{feedbackMsg}</span>
            <span className="text-emerald-400">✓ Đã đồng bộ hệ thống</span>
          </div>
        )}

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">📅 Ngày nhận phòng (Check-in)</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">📅 Ngày trả phòng (Check-out)</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Screen / Reception Stage Graphic */}
        <div className="w-full text-center my-4">
          <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full shadow-[0_0_15px_rgba(239,68,68,0.7)]"></div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-1 block">
            ▲ LỄ TÂN & HƯỚNG NHÌN TOÀN CẢNH (RECEPTION & MAIN SCREEN VIEW) ▲
          </span>
        </div>

        {/* Rooms Floor Grid */}
        <div className="space-y-8 my-6">
          {floors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-800/30 rounded-2xl border border-slate-700/40">
              Đang tải sơ đồ phòng của khách sạn từ cơ sở dữ liệu...
            </div>
          ) : (
            floors.map((floor) => (
              <div key={floor.floorNumber} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  {floor.name}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {floor.rooms.map((room) => {
                    const isSelected = selectedRoomIds.includes(room.id);
                    const isAvailable = room.status === 'AVAILABLE';
                    const isOccupied = room.status === 'OCCUPIED' || room.status === 'BOOKED';
                    const isMyBooking = isOccupied && (room.bookedBy || "").toLowerCase() === currentUsername.toLowerCase();
                    const isMaintenance = room.status === 'MAINTENANCE' || room.status === 'OUT_OF_SERVICE';

                    return (
                      <button
                        key={room.id}
                        onClick={() => toggleRoomSelection(room.id, room.status)}
                        disabled={!isAvailable}
                        className={`
                          relative group flex flex-col justify-between items-center p-3.5 rounded-2xl transition-all duration-300 select-none border text-left
                          ${isSelected
                            ? 'bg-gradient-to-t from-red-700 via-red-600 to-red-500 border-red-400 text-white scale-105 shadow-[0_0_20px_rgba(239,68,68,0.7)] ring-2 ring-red-400 cursor-pointer'
                            : isMyBooking
                            ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-md shadow-purple-900/50 ring-1 ring-purple-400/50 cursor-default'
                            : isOccupied
                            ? 'bg-slate-800/80 border-slate-700 text-slate-400 cursor-not-allowed opacity-90'
                            : isAvailable
                            ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-100 hover:bg-emerald-900/60 hover:border-emerald-500 hover:scale-105 hover:shadow-lg hover:shadow-emerald-900/40 cursor-pointer'
                            : 'bg-slate-800/60 border-slate-700/40 text-slate-500 cursor-not-allowed opacity-50'
                          }
                        `}
                      >
                        {/* Top indicator badge */}
                        <div className="w-full flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className={isSelected ? 'text-white' : isMyBooking ? 'text-purple-300' : isAvailable ? 'text-emerald-400' : 'text-slate-400'}>
                            {room.type?.split(' ')[0] || "Phòng"}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 bg-white text-red-600 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow">
                              ✓
                            </span>
                          )}
                          {isMyBooking && !isSelected && (
                            <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                              BẠN
                            </span>
                          )}
                          {isMaintenance && (
                            <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded-full border border-amber-500/40">
                              BẢO TRÌ
                            </span>
                          )}
                        </div>

                        {/* Room Number */}
                        <div className="my-1 text-center w-full">
                          <span className="text-xl font-black tracking-tight block">
                            P.{room.number}
                          </span>
                          <span className="text-[11px] opacity-90 block truncate font-medium">
                            {room.type}
                          </span>
                        </div>

                        {/* Occupancy Indicator / Who is booking */}
                        {isOccupied ? (
                          <div className="w-full mt-2 pt-1 border-t border-slate-700/60 text-center">
                            <span className={`text-[10px] font-extrabold block truncate px-1 rounded ${
                              isMyBooking
                                ? 'bg-purple-900/80 text-purple-200'
                                : 'bg-slate-900/80 text-amber-300'
                            }`}>
                              👤 {isMyBooking ? "Bạn đang đặt" : `@${room.bookedBy || "Khách đặt"}`}
                            </span>
                          </div>
                        ) : isMaintenance ? (
                          <div className="mt-2 text-xs font-semibold text-amber-400">
                            Đang bảo trì
                          </div>
                        ) : (
                          <div className={`mt-2 text-xs font-extrabold px-2 py-0.5 rounded-md ${isSelected ? 'bg-red-900/60 text-white' : 'bg-emerald-900/60 text-emerald-300'}`}>
                            {(room.price || 500000).toLocaleString('vi-VN')} đ
                          </div>
                        )}

                        {/* Tooltip hover info */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-white text-[10px] py-1.5 px-3 rounded-xl border border-slate-700 shadow-2xl whitespace-nowrap z-30 pointer-events-none">
                          {isOccupied ? (
                            <span>
                              🔒 Phòng {room.number}: Đã đặt bởi <strong className="text-amber-400">@{room.bookedBy || "khách"}</strong> ({room.checkIn || "Hôm nay"} ➔ {room.checkOut || "Ngày mai"})
                            </span>
                          ) : isAvailable ? (
                            <span>Nhấp để chọn phòng {room.number}</span>
                          ) : (
                            <span>Phòng đang bảo trì kỹ thuật</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Summary Bar */}
        <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium">
              Danh sách phòng bạn đang chọn ({selectedRooms.length} phòng - {nights} đêm):
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRooms.length > 0 ? (
                selectedRooms.map(r => (
                  <span
                    key={r.id}
                    className="bg-red-600/90 text-white text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-red-900/40 animate-fadeIn"
                  >
                    🏢 Phòng {r.number} ({r.type})
                    <button
                      onClick={() => toggleRoomSelection(r.id, 'AVAILABLE')}
                      className="hover:text-amber-200 font-extrabold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm italic">
                  Chưa chọn phòng nào. Vui lòng nhấp vào ô phòng màu xanh phía trên.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Tổng tiền ước tính</span>
              <span className="text-2xl font-black text-red-400 tracking-tight">
                {totalPrice.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={selectedRooms.length === 0}
              className={`
                px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center gap-2
                ${selectedRooms.length > 0
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white hover:scale-105 shadow-red-600/40 active:scale-95'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              🛒 Đặt Phòng Ngay ({selectedRooms.length})
            </button>
          </div>
        </div>
      </div>

      {/* ===== AI ĐANG ĐẶT PHÒNG NÀO (LIVE OCCUPANCY TRACKER) ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-xl font-black text-slate-900">
                Bảng Theo Dõi: AI ĐANG ĐẶT PHÒNG NÀO (Live Occupancy)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách chi tiết theo thời gian thực khách hàng và phòng đã được đặt tại <strong className="text-slate-800">{activeHotel?.name}</strong>
            </p>
          </div>

          <div className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold self-start sm:self-auto">
            Tổng cộng: <strong className="text-red-600">{(hotelBookings || []).length}</strong> phòng đang được đặt
          </div>
        </div>

        {(!hotelBookings || hotelBookings.length === 0) ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Hiện chưa có phòng nào được đặt tại khách sạn này. Tất cả các phòng đang sẵn sàng!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Phòng Số & Loại</th>
                  <th className="py-3.5 px-6">Người Đang Đặt (Username)</th>
                  <th className="py-3.5 px-6">Thời Gian Lưu Trú</th>
                  <th className="py-3.5 px-6">Tổng Chi Phí</th>
                  <th className="py-3.5 px-6">Trạng Thái</th>
                  <th className="py-3.5 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(hotelBookings || []).map((b) => {
                  const bUser = b.username || b.bookedBy || b.customerName || "user";
                  const isMine = bUser.toLowerCase() === currentUsername.toLowerCase();
                  const canCancel = isMine || userRole === "ADMIN" || userRole === "SUPER_ADMIN";
                  const checkInDisplay = b.checkInDate || b.checkIn || "Hôm nay";
                  const checkOutDisplay = b.checkOutDate || b.checkOut || "Ngày mai";
                  const roomNum = b.roomNumber || (b.roomName ? (b.roomName.match(/\d+/) ? b.roomName.match(/\d+/)[0] : b.roomId) : b.roomId);

                  return (
                    <tr key={b.id} className={`hover:bg-slate-50/80 transition ${isMine ? 'bg-purple-50/40' : ''}`}>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-sm">
                            {roomNum}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">Phòng {roomNum}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{b.roomType || "Standard"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">@{bUser}</span>
                          {isMine && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                              CHÍNH BẠN
                            </span>
                          )}
                        </div>
                        {b.customerName && b.customerName !== bUser && (
                          <span className="text-[11px] text-slate-400 block">{b.customerName}</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="font-semibold block">{checkInDisplay} ➔ {checkOutDisplay}</span>
                      </td>

                      <td className="py-4 px-6 font-black text-red-600 text-xs">
                        {(b.totalPrice || 0).toLocaleString('vi-VN')} đ
                      </td>

                      <td className="py-4 px-6">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          b.status === "CHECKED_IN"
                            ? "bg-purple-100 text-purple-800"
                            : b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          ● {b.status === "CHECKED_IN" ? "Đang Lưu Trú" : b.status === "CONFIRMED" ? "Đã Xác Nhận" : b.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {canCancel && b.status !== "CANCELLED" && b.status !== "CHECKED_OUT" ? (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition"
                          >
                            ✕ Hủy Đặt
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Đã khóa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>

            {bookingSuccessMsg ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 border border-emerald-500/40 animate-bounce">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-white">Đặt Phòng Thành Công!</h3>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                  Phòng của bạn đã được chuyển sang trạng thái <strong>OCCUPIED (Đã Đặt)</strong> và gán quyền sở hữu cho tài khoản <strong>@{currentUsername}</strong>.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
                  Xác Nhận Đặt {selectedRooms.length} Phòng
                </h3>

                <div className="space-y-3 my-4 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span>Khách sạn:</span>
                    <span className="font-semibold text-white">{activeHotel?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span>Người đặt phòng:</span>
                    <span className="font-bold text-red-400">@{currentUsername}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span>Thời gian:</span>
                    <span className="font-semibold text-white">{checkInDate} ➔ {checkOutDate} ({nights} đêm)</span>
                  </div>
                  <div className="py-1 border-b border-slate-800">
                    <span>Phòng đã chọn:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRooms.map(r => (
                        <span key={r.id} className="bg-red-950 text-red-300 border border-red-700/60 px-2 py-0.5 rounded text-xs font-bold">
                          P.{r.number} ({r.type})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between py-2 text-base font-black text-red-400">
                    <span>Tổng tiền thanh toán:</span>
                    <span>{totalPrice.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-semibold text-xs transition"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    onClick={executeBooking}
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-3 rounded-xl font-bold text-xs transition shadow-lg shadow-red-600/30"
                  >
                    Xác Nhận Giữ Phòng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
