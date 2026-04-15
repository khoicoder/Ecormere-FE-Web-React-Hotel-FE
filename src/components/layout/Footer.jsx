function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-10">
      
      {/* Main */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Logo + desc */}
        <div>
          <h2 className="text-xl font-bold text-blue-400 mb-3">
            HotelBooking
          </h2>
          <p className="text-gray-400 text-sm">
            Book your dream hotel with the best price and experience.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="hover:text-white cursor-pointer">Home</li>
            <li className="hover:text-white cursor-pointer">Rooms</li>
            <li className="hover:text-white cursor-pointer">Booking</li>
            <li className="hover:text-white cursor-pointer">Contact</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold mb-3">Contact</h3>
          <p className="text-gray-400 text-sm">📍 Can Tho, Vietnam</p>
          <p className="text-gray-400 text-sm">📞 0362629669</p>
          <p className="text-gray-400 text-sm">🌐 www.facebook.com/Ma.progame.101</p>
          <p className="text-gray-400 text-sm">📧 hotelwithme@gmail.com</p>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700 text-center py-4 text-gray-400 text-sm">
        © 2026 HotelBooking. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;