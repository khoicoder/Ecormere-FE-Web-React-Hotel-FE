function Header() {
  return (
    <header className="bg-white shadow-md px-6 py-3 flex items-center justify-between">

      {/* Logo */}
      <h1 className="text-xl font-bold text-blue-600 cursor-pointer">
        HotelBooking
      </h1>

      {/* Menu */}
      <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
        <a href="/" className="hover:text-blue-500">Home</a>
        <a href="/rooms" className="hover:text-blue-500">Rooms</a>
        <a href="/booking" className="hover:text-blue-500">Booking</a>
      </nav>

      {/* Auth */}
      <div className="flex gap-3">
        <a href="/login">
          <button className="px-4 py-1 border rounded-lg hover:bg-gray-100">
            Login
          </button>
        </a>

        <a href="/register">
          <button className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Register
          </button>
        </a>
      </div>
    </header>
  );
}

export default Header;