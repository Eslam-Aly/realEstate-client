import React from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LangSwitch from "./LangSwitch.jsx";
import { t } from "i18next";
import { useTranslation } from "react-i18next";

function Header() {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

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
    <header
      data-testid="navbar"
      dir="ltr"
      className="bg-blue-700 text-white  w-full  shadow-md h-16 md:h-20 flex items-center sticky top-0 z-50"
    >
      <div className="container mx-auto flex items-center justify-between w-[90%] ">
        <div>
          <Link to="/" className="text-sm md:text-2xl font-bold cursor-pointer">
            <img
              src="logoHeader.png"
              alt="logo"
              className="h-6 md:h-8 lg:h-10  w-auto object-contain"
            />
          </Link>
        </div>
        <div className="flex items-center justify-center ">
          <form
            data-testid="home-search-bar"
            dir={isRTL ? "rtl" : "ltr"}
            onSubmit={handleSubmit}
            className="flex w-[60%] sm:w-[80%] items-center rounded-full border
            border-gray-300 bg-white/90 px-4 py-1 shadow-md backdrop-blur"
          >
            <input
              data-testid="home-search-input"
              type="text"
              placeholder={t("nav.search")}
              className="w-full bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              data-testid="home-search-submit"
              type="submit"
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-blue-700"
            >
              <FaSearch className="text-blue-700" />
            </button>
          </form>
        </div>
        <nav className="flex items-center gap-2 md:gap-6 text-sm md:text-base">
          <Link to="/" className="hidden md:inline-block">
            {t("nav.home")}
          </Link>

          <LangSwitch />
          {currentUser ? (
            <Link data-testid="navbar-profile-link" to="/profile">
              <img
                src={currentUser.avatar}
                alt="avatar"
                className="rounded-full w-9 h-9 inline-block"
              />
            </Link>
          ) : (
            <Link data-testid="navbar-login-link" to="/signin">
              {t("nav.signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
