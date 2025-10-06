import React from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="bg-blue-800 text-white  w-full  shadow-md h-20 flex items-center sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between w-[90%] ">
        <div>
          <Link to="/" className="text-sm md:text-2xl font-bold">
            Real-Estate App
          </Link>
        </div>
        <div>
          <form className="rounded-md flex items-center px-2 py-1  border border-gray-300">
            <input
              type="text"
              placeholder="Search..."
              className=" focus:outline-none "
            />
            <button type="submit">
              <FaSearch className="text-white" />
            </button>
          </form>
        </div>
        <nav className="space-x-4">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
