import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAdminHotels } from "../../services/hotelService";
import { fetchBookingsAPI } from "../../services/bookingService";
import { createMaintenanceTicket } from "../../services/maintenanceService";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button, { Input, Select } from "../../components/ui/FormControls";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { LoadingState, EmptyState, Alert } from "../../components/ui/FeedbackStates";

export default function ReceptionistRoomPlan() {
  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Filters
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Báo hỏng / Sự cố nhanh cho phòng
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [targetRoom, setTargetRoom] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    equipmentName: "",
    assignedStaff: "Bộ phận Kỹ thuật ca trực",
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const username = localStorage.getItem("username") || "Lễ Tân";

  // Load Hotel of Receptionist & Live Bookings
  const loadHotelAndRooms = async () => {
    try {
      setLoading(true);
      const [hotelsRes, bookingsRes] = await Promise.all([
        getAdminHotels(),
        fetchBookingsAPI(),
      ]);

      const hotelList = Array.isArray(hotelsRes?.data) ? hotelsRes.data : [];
      // Lễ tân chỉ có duy nhất 1 khách sạn mà mình trực thuộc
      if (hotelList.length > 0) {
        setHotel(hotelList[0]);
      } else {
        setHotel(null);
      }
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
    } catch (err) {
      console.error("Lỗi khi tải sơ đồ phòng lễ tân:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelAndRooms();
    const handleUpdate = () => loadHotelAndRooms();
    window.addEventListener("booking-updated", handleUpdate);
    return () => window.removeEventListener("booking-updated", handleUpdate);
  }, []);

  // Tổ chức phòng theo Tầng từ danh sách phòng thực tế
  const { floors, allRooms, stats, roomTypes } = useMemo(() => {
    const rawRooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
    if (rawRooms.length === 0) {
      return {
        floors: [],
        allRooms: [],
        stats: { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0, occupancyRate: 0 },
        roomTypes: [],
      };
    }

    const typeSet = new Set();
    const floorMap = {};

    let totalAvail = 0;
    let totalOcc = 0;
    let totalRes = 0;
    let totalMaint = 0;

    rawRooms.forEach((room) => {
      const rType = room.type || "Tiêu chuẩn";
      typeSet.add(rType);

      // Bóc tách số phòng và tầng từ tên phòng (VD: "Phòng 101" -> 101 -> Tầng 1)
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
      } else if (room.floor) {
        floorNum = Number(room.floor);
      }

      // Đối soát với đơn đặt phòng thực tế (Live Bookings)
      const activeBooking = bookings.find(
        (b) =>
          Number(b.roomId) === Number(room.id) &&
          b.status !== "CANCELLED" &&
          b.status !== "EXPIRED" &&
          b.stayStatus !== "CHECKED_OUT"
      );

      let computedStatus = room.status || "AVAILABLE";
      if (room.status === "MAINTENANCE") {
        computedStatus = "MAINTENANCE";
        totalMaint++;
      } else if (activeBooking) {
        if (activeBooking.stayStatus === "CHECKED_IN" || activeBooking.status === "CHECKED_IN") {
          computedStatus = "OCCUPIED";
          totalOcc++;
        } else {
          computedStatus = "RESERVED";
          totalRes++;
        }
      } else if (room.status === "OCCUPIED" || room.status === "BOOKED") {
        computedStatus = "OCCUPIED";
        totalOcc++;
      } else {
        computedStatus = "AVAILABLE";
        totalAvail++;
      }

      const enrichedRoom = {
        ...room,
        roomNumber: roomNum,
        displayStatus: computedStatus,
        activeBooking: activeBooking || null,
        floorNumber: floorNum,
      };

      if (!floorMap[floorNum]) {
        floorMap[floorNum] = {
          floorNumber: floorNum,
          name: `Tầng ${floorNum}`,
          rooms: [],
        };
      }
      floorMap[floorNum].rooms.push(enrichedRoom);
    });

    const sortedFloors = Object.values(floorMap).sort((a, b) => a.floorNumber - b.floorNumber);
    const totalRooms = rawRooms.length;
    const occupancyRate = totalRooms > 0 ? Math.round(((totalOcc + totalRes) / totalRooms) * 100) : 0;

    return {
      floors: sortedFloors,
      allRooms: sortedFloors.flatMap((f) => f.rooms),
      stats: {
        total: totalRooms,
        available: totalAvail,
        occupied: totalOcc,
        reserved: totalRes,
        maintenance: totalMaint,
        occupancyRate,
      },
      roomTypes: Array.from(typeSet).filter(Boolean),
    };
  }, [hotel, bookings]);

  // Bộ lọc phòng hiển thị
  const filteredFloors = useMemo(() => {
    return floors
      .filter((fl) => selectedFloor === "ALL" || String(fl.floorNumber) === String(selectedFloor))
      .map((fl) => {
        const matchingRooms = fl.rooms.filter((room) => {
          // Lọc theo hạng phòng
          const matchType = selectedType === "ALL" || (room.type || "Tiêu chuẩn") === selectedType;

          // Lọc theo trạng thái
          const matchStatus =
            selectedStatus === "ALL" ||
            room.displayStatus === selectedStatus;

          // Tìm kiếm
          const q = searchQuery.trim().toLowerCase();
          const matchSearch =
            !q ||
            String(room.roomNumber).toLowerCase().includes(q) ||
            String(room.name || "").toLowerCase().includes(q) ||
            (room.activeBooking?.customerName && room.activeBooking.customerName.toLowerCase().includes(q)) ||
            (room.activeBooking?.username && room.activeBooking.username.toLowerCase().includes(q));

          return matchType && matchStatus && matchSearch;
        });

        return {
          ...fl,
          rooms: matchingRooms,
        };
      })
      .filter((fl) => fl.rooms.length > 0);
  }, [floors, selectedFloor, selectedType, selectedStatus, searchQuery]);

  // Xử lý mở modal báo sự cố kỹ thuật cho phòng cụ thể
  const handleOpenMaintenance = (room) => {
    setTargetRoom(room);
    setMaintenanceForm({
      title: `Báo hỏng phòng ${room.roomNumber || room.name}`,
      description: "",
      priority: room.displayStatus === "OCCUPIED" ? "HIGH" : "MEDIUM",
      equipmentName: "",
      assignedStaff: "Bộ phận Kỹ thuật ca trực",
    });
    setMaintenanceModalOpen(true);
  };

  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.title || !maintenanceForm.description) {
      alert("Vui lòng điền tiêu đề và mô tả sự cố!");
      return;
    }

    try {
      setSubmittingTicket(true);
      await createMaintenanceTicket({
        hotelId: hotel?.id || 1,
        hotelName: hotel?.name || "",
        roomId: targetRoom?.id || null,
        roomNumber: targetRoom?.roomNumber || targetRoom?.name || "",
        equipmentName: maintenanceForm.equipmentName || "Trang thiết bị phòng",
        title: maintenanceForm.title,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        type: "REPAIR",
        assignedStaff: maintenanceForm.assignedStaff,
      });

      setMsg(`✅ Đã gửi phiếu báo hỏng cho Phòng ${targetRoom?.roomNumber || targetRoom?.name} tới đội Kỹ thuật!`);
      setMaintenanceModalOpen(false);
      setTimeout(() => setMsg(""), 3500);
      loadHotelAndRooms();
    } catch (err) {
      alert("Lỗi khi gửi phiếu bảo trì: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SaaS Page Header dành riêng cho Lễ Tân */}
      <PageHeader
        title={`Sơ Đồ Phòng Theo Tầng: ${hotel?.name || "Khách Sạn Của Bạn"}`}
        subtitle={`Sơ đồ buồng phòng thời gian thực, quản lý tình trạng phòng trống, có khách và bảo trì theo từng tầng. Ca trực: @${username}`}
        badge="Lễ Tân Cơ Sở"
        badgeVariant="success"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/receptionist/dashboard">
              <Button
                variant="primary"
                size="sm"
                icon={<span>🛎️</span>}
                title="Đến bàn làm việc lễ tân đón tiếp khách"
              >
                Bàn Lễ Tân
              </Button>
            </Link>
            <Link to="/admin/maintenance">
              <Button
                variant="secondary"
                size="sm"
                icon={<span>🛠️</span>}
                title="Xem danh sách toàn bộ phiếu kỹ thuật"
              >
                Phiếu Bảo Trì
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              icon={<span>🔄</span>}
              onClick={loadHotelAndRooms}
            >
              Làm Mới
            </Button>
          </div>
        }
      />

      {msg && (
        <Alert
          type="info"
          message={msg}
          onClose={() => setMsg("")}
        />
      )}

      {loading ? (
        <LoadingState message="Đang tải sơ đồ buồng phòng theo tầng..." />
      ) : !hotel ? (
        <EmptyState
          icon="🏨"
          title="Chưa Được Bổ Nhiệm Khách Sạn"
          description="Tài khoản Lễ tân của bạn chưa được liên kết với khách sạn cơ sở nào. Vui lòng liên hệ Admin của bạn."
        />
      ) : (
        <>
          {/* Status KPI Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                🏢 Tổng Số Phòng
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.total}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {floors.length} tầng
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Còn Trống
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  {stats.available}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  Sẵn sàng đón
                </span>
              </div>
            </div>

            <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                Đang Lưu Trú
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-800 dark:text-blue-200">
                  {stats.occupied}
                </span>
                <span className="text-[10px] text-blue-600 font-bold">
                  Đang ở
                </span>
              </div>
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                Đã Giữ Chỗ
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
                  {stats.reserved}
                </span>
                <span className="text-[10px] text-amber-600 font-bold">
                  Chờ Check-in
                </span>
              </div>
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Bảo Trì Kỹ Thuật
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-800 dark:text-rose-200">
                  {stats.maintenance}
                </span>
                <span className="text-[10px] text-rose-600 font-bold">
                  Tạm ngưng
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                📊 Tỷ Lệ Lấp Đầy
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-indigo-800 dark:text-indigo-200">
                  {stats.occupancyRate}%
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">
                  Công suất phòng
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Filter Toolbar */}
          <Card>
            <div className="p-4 space-y-3.5 text-xs">
              {/* Floor Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 mr-1">
                  Chọn Tầng:
                </span>
                <button
                  onClick={() => setSelectedFloor("ALL")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                    selectedFloor === "ALL"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  🏢 Tất Cả Các Tầng ({allRooms.length})
                </button>
                {floors.map((fl) => (
                  <button
                    key={fl.floorNumber}
                    onClick={() => setSelectedFloor(String(fl.floorNumber))}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                      selectedFloor === String(fl.floorNumber)
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Tầng {fl.floorNumber} ({fl.rooms.length} phòng)
                  </button>
                ))}
              </div>

              {/* Sub-Filters: Type, Status, Search */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Pills */}
                  <span className="text-slate-400 font-medium">Trạng thái:</span>
                  {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "AVAILABLE", label: "🟢 Trống", color: "hover:border-emerald-400" },
                    { key: "OCCUPIED", label: "🔵 Đang ở", color: "hover:border-blue-400" },
                    { key: "RESERVED", label: "🟡 Giữ chỗ", color: "hover:border-amber-400" },
                    { key: "MAINTENANCE", label: "🔴 Bảo trì", color: "hover:border-rose-400" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setSelectedStatus(st.key)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition ${
                        selectedStatus === st.key
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                          : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 ${st.color}`
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}

                  {/* Room Type Dropdown */}
                  {roomTypes.length > 0 && (
                    <div className="w-44 ml-2">
                      <Select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        options={[
                          { value: "ALL", label: "Tất cả hạng phòng" },
                          ...roomTypes.map((t) => ({ value: t, label: `🛏️ ${t}` })),
                        ]}
                      />
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="w-full sm:w-64">
                  <Input
                    placeholder="Tìm số phòng, tên khách..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Floor-by-Floor Room Plan Sections */}
          {filteredFloors.length === 0 ? (
            <EmptyState
              icon="🚪"
              title="Không tìm thấy phòng nào phù hợp"
              description="Thử thay đổi bộ lọc tầng, trạng thái hoặc từ khóa tìm kiếm."
            />
          ) : (
            <div className="space-y-6">
              {filteredFloors.map((fl) => {
                const floorTotal = fl.rooms.length;
                const floorAvail = fl.rooms.filter((r) => r.displayStatus === "AVAILABLE").length;
                const floorOcc = fl.rooms.filter((r) => r.displayStatus === "OCCUPIED" || r.displayStatus === "RESERVED").length;
                const floorMaint = fl.rooms.filter((r) => r.displayStatus === "MAINTENANCE").length;

                return (
                  <div key={fl.floorNumber} className="space-y-3">
                    {/* Floor Header Bar */}
                    <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-sm">
                          F{fl.floorNumber}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm tracking-tight text-white">
                            Tầng {fl.floorNumber}
                          </h3>
                          <span className="text-[10px] text-slate-400 block -mt-0.5">
                            {floorTotal} phòng thuộc tầng này
                          </span>
                        </div>
                      </div>

                      {/* Floor Mini Stats */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          🟢 {floorAvail} trống
                        </span>
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          🔵 {floorOcc} có khách
                        </span>
                        {floorMaint > 0 && (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            🔴 {floorMaint} bảo trì
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Floor Room Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                      {fl.rooms.map((room) => {
                        const isAvail = room.displayStatus === "AVAILABLE";
                        const isOcc = room.displayStatus === "OCCUPIED";
                        const isRes = room.displayStatus === "RESERVED";
                        const isMaint = room.displayStatus === "MAINTENANCE";

                        const borderColor = isAvail
                          ? "border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400"
                          : isOcc
                          ? "border-blue-200 dark:border-blue-800/60 hover:border-blue-400"
                          : isRes
                          ? "border-amber-200 dark:border-amber-800/60 hover:border-amber-400"
                          : "border-rose-200 dark:border-rose-800/60 hover:border-rose-400";

                        const bgColor = isAvail
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                          : isOcc
                          ? "bg-blue-50/40 dark:bg-blue-950/20"
                          : isRes
                          ? "bg-amber-50/40 dark:bg-amber-950/20"
                          : "bg-rose-50/40 dark:bg-rose-950/20";

                        const badgeLabel = isAvail
                          ? "Còn Trống"
                          : isOcc
                          ? "Đang Ở"
                          : isRes
                          ? "Đã Giữ Chỗ"
                          : "Bảo Trì";

                        const badgeColor = isAvail
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                          : isOcc
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                          : isRes
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300";

                        return (
                          <div
                            key={room.id}
                            className={`rounded-2xl border ${borderColor} ${bgColor} p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-900 text-xs`}
                          >
                            {/* Card Top: Number & Badge */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base font-black text-slate-900 dark:text-white">
                                    🚪 #{room.roomNumber}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                  {badgeLabel}
                                </span>
                              </div>

                              {/* Room Type & Base Price */}
                              <div className="mt-1 flex items-baseline justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {room.type || "Tiêu chuẩn"}
                                </span>
                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                  {typeof room.price === "number"
                                    ? room.price.toLocaleString("vi-VN")
                                    : room.price || 500000}{" "}
                                  đ
                                </span>
                              </div>

                              {/* Guest Info if Occupied or Reserved */}
                              {(isOcc || isRes) && room.activeBooking && (
                                <div className="mt-2.5 p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                                      👤 {room.activeBooking.customerName || room.activeBooking.username || "Khách lưu trú"}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      #{room.activeBooking.id}
                                    </span>
                                  </div>
                                  {room.activeBooking.phone && (
                                    <span className="text-[10px] text-slate-500 block">
                                      📞 {room.activeBooking.phone}
                                    </span>
                                  )}
                                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                                    <span>Lưu trú:</span>
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                      {room.activeBooking.checkInDate || room.activeBooking.checkIn || "Hôm nay"}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {isMaint && (
                                <div className="mt-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[11px] text-rose-700 dark:text-rose-300">
                                  <div className="font-bold flex items-center gap-1">
                                    <span>⚠️</span> Đang bảo trì kỹ thuật
                                  </div>
                                  <span className="text-[10px] opacity-80 block mt-0.5">
                                    Tạm ngưng nhận khách
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-1.5">
                              {isAvail ? (
                                <Link to="/receptionist/dashboard" className="flex-1">
                                  <button className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition text-center shadow-sm">
                                    🛎️ Nhận Khách
                                  </button>
                                </Link>
                              ) : (isOcc || isRes) ? (
                                <Link to="/receptionist/dashboard" className="flex-1">
                                  <button className="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition text-center shadow-sm">
                                    💳 Thu Tiền / Trả Phòng
                                  </button>
                                </Link>
                              ) : null}

                              {/* Quick Maintenance Button */}
                              <button
                                onClick={() => handleOpenMaintenance(room)}
                                title="Báo sự cố hỏng hóc cho phòng này"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition"
                              >
                                🛠️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Quick Report Maintenance Ticket */}
      <Modal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        title={`Báo Sự Cố Phòng #${targetRoom?.roomNumber || targetRoom?.name}`}
        size="md"
      >
        <form onSubmit={handleSubmitMaintenance} className="space-y-4 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Cơ sở & Vị trí</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {hotel?.name} — Phòng #{targetRoom?.roomNumber} (Tầng {targetRoom?.floorNumber})
              </strong>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {targetRoom?.type || "Tiêu chuẩn"}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu Đề Báo Hỏng *
            </label>
            <Input
              required
              placeholder="VD: Điều hòa chảy nước, khóa thẻ từ chập chờn..."
              value={maintenanceForm.title}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thiết Bị Gặp Vấn Đề
              </label>
              <Input
                placeholder="VD: Điều Hòa, Đèn, Khóa từ, Vòi sen..."
                value={maintenanceForm.equipmentName}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, equipmentName: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức Độ Ưu Tiên
              </label>
              <Select
                value={maintenanceForm.priority}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                options={[
                  { value: "LOW", label: "🟢 Thấp - Định kỳ" },
                  { value: "MEDIUM", label: "🟡 Trung bình" },
                  { value: "HIGH", label: "🔴 Khẩn cấp - Phòng đang có khách" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô Tả Chi Tiết Sự Cố *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 text-xs outline-none focus:border-indigo-500"
              placeholder="Mô tả cụ thể hiện trạng hỏng hóc để kỹ thuật chuẩn bị công cụ xử lý..."
              value={maintenanceForm.description}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setMaintenanceModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submittingTicket}
            >
              {submittingTicket ? "Đang gửi..." : "Gửi Phiếu Báo Kỹ Thuật"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
