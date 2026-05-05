import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || null;
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setOpen(false);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md px-6 py-3 flex items-center justify-between relative">
      <h1 className="text-xl font-bold text-blue-600 cursor-pointer">
        <Link to="/">HotelBooking</Link>
      </h1>

      <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <Link to="/rooms" className="hover:text-blue-500">Rooms</Link>
        <Link to="/booking" className="hover:text-blue-500">Booking</Link>
      </nav>

      <div className="flex items-center gap-3">
        {!token ? (
          <>
            <Link to="/login">
              <button className="px-4 py-1 border rounded-lg hover:bg-gray-100">
                Login
              </button>
            </Link>

            <Link to="/register">
              <button className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Register
              </button>
            </Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {avatarLetter}
              </div>
              <span className="hidden sm:block text-gray-700 font-medium">
                {username}
              </span>
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-48 bg-white border rounded-xl shadow-lg overflow-hidden z-50">
                <Link
                  to="/home"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100"
                >
                  Home
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100"
                >
                  Settings
                </Link>


                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-500"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}