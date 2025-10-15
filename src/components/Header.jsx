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
          <Link to="/" className="text-sm md:text-2xl font-bold">
            Real-Estate App
          </Link>
        </div>
        <div>
          <form
            onSubmit={handleSubmit}
            className="rounded-md flex items-center px-2 py-1  border border-gray-300"
          >
            <input
              type="text"
              placeholder="Search..."
              className=" focus:outline-none "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">
              <FaSearch className="text-white" />
            </button>
          </form>
        </div>
        <nav className="space-x-4">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>

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
