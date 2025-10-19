import React from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Header() {
  const Navigate = useNavigate();

  const currentUser = useSelector((state) => state.user.currentUser);
  const [searchTerm, setSearchTerm] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("searchTerm", searchTerm);
    const searchQuery = urlParams.toString();
    Navigate(`/search?${searchQuery}`);
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTermFromUrl = urlParams.get("searchTerm");
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  return (
    <header className="bg-blue-800 text-white  w-full  shadow-md h-20 flex items-center sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between w-[90%] ">
        <div>
          <Link to="/" className="text-sm md:text-2xl font-bold ">
            Logo
          </Link>
        </div>
        <div className="flex items-center justify-center ">
          <form
            onSubmit={handleSubmit}
            className="flex w-[60%] sm:w-[80%]  items-center rounded-full border border-gray-300 bg-white/90 px-4 py-1 shadow-md backdrop-blur"
          >
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-blue-700"
            >
              <FaSearch className="text-blue-700" />
            </button>
          </form>
        </div>
        <nav className="space-x-4">
          <Link to="/" className="hidden md:inline-block">
            Home
          </Link>
          <Link to="/about" className="hidden md:inline-block">
            About
          </Link>

          {currentUser ? (
            <Link to="/profile">
              <img
                src={currentUser.avatar}
                alt="avatar"
                className="rounded-full w-10 h-10 inline-block"
              />
            </Link>
          ) : (
            <Link to="/signin">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
