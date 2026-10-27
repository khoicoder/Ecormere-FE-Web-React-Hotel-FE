function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 mt-auto">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo + desc */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
              H
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Ecormere<span className="text-indigo-400">Hotel</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Hệ sinh thái đặt phòng khách sạn thông minh với sơ đồ chọn phòng trực quan Cinema Style và hệ thống quản trị khách sạn toàn quốc chuẩn SaaS.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Liên Kết Nhanh</h3>
          <ul className="space-y-2 text-slate-400 text-sm font-medium">
            <li><a href="/" className="hover:text-indigo-400 transition">Khám Phá Khách Sạn</a></li>
            <li><a href="/profile" className="hover:text-indigo-400 transition">Hồ Sơ & Đơn Đã Đặt</a></li>
            <li><a href="/login" className="hover:text-indigo-400 transition">Đăng Nhập Quản Trị</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Trung Tâm Hỗ Trợ</h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-center gap-2"><span>📍</span> Cần Thơ & TP. Hồ Chí Minh</li>
            <li className="flex items-center gap-2"><span>📞</span> 0362 629 669</li>
            <li className="flex items-center gap-2"><span>📧</span> contact@ecormerehotel.vn</li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-900 text-center py-5 text-slate-500 text-xs font-medium">
        © 2026 EcormereHotel SaaS Management. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
