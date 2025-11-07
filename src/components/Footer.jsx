import React from "react";
import { t } from "i18next";

// Basic, responsive footer that matches a modern real-estate site layout.
// Uses Tailwind utility classes and keeps styling neutral so it blends with your
// existing theme (inherits background/text from parent or page). Tweak the
// wrapper classes (bg-*/text-*) in <footer> if you want a fixed palette.
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className=" bg-gray-100 mt-16 w-full shadow-inner">
      {/* Max-width container */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top section: brand + quick nav */}
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
          {/* Brand / short blurb */}
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              {/* Logo placeholder (replace with your SVG/Image if available) */}
              <img
                src="logoFooter.png"
                alt="logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {t("footer.paragraph")}
            </p>
            {/* Social links */}
            <div
              className="flex items-center gap-4 mt-4"
              aria-label="Social links"
            >
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="transition hover:opacity-80 text-blue-700"
              >
                {/* GitHub icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.486 2 12.021c0 4.428 2.865 8.18 6.839 9.504.5.094.683-.218.683-.486 0-.24-.01-1.037-.015-1.882-2.782.607-3.37-1.19-3.37-1.19-.455-1.166-1.11-1.477-1.11-1.477-.908-.622.07-.609.07-.609 1.003.07 1.53 1.032 1.53 1.032.893 1.532 2.344 1.09 2.914.833.091-.65.35-1.09.636-1.34-2.22-.254-4.555-1.114-4.555-4.957 0-1.095.39-1.99 1.03-2.69-.103-.254-.447-1.277.098-2.662 0 0 .84-.27 2.75 1.026A9.6 9.6 0 0 1 12 6.844c.85.004 1.705.115 2.505.338 1.909-1.296 2.748-1.026 2.748-1.026.546 1.385.202 2.408.1 2.662.64.7 1.028 1.595 1.028 2.69 0 3.852-2.339 4.7-4.566 4.95.36.31.68.92.68 1.855 0 1.338-.012 2.415-.012 2.743 0 .27.18.583.69.484C19.14 20.197 22 16.448 22 12.02 22 6.486 17.523 2 12 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="transition hover:opacity-80 text-blue-700"
              >
                {/* X icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M18.146 2.25h3.21l-7.01 8.01 8.243 11.49h-6.457l-5.048-6.6-5.77 6.6H1.104l7.49-8.564L.75 2.25h6.64l4.57 6.02 6.186-6.02Zm-1.124 18.06h1.778L7.05 4.38H5.15l11.872 15.93Z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="transition hover:opacity-80 text-blue-700"
              >
                {/* LinkedIn icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.339 18.339H6.169V9.75H8.34v8.589ZM7.254 8.74a1.254 1.254 0 1 1 0-2.508 1.254 1.254 0 0 1 0 2.507ZM18.338 18.339h-2.17v-4.179c0-.997-.02-2.28-1.39-2.28-1.392 0-1.605 1.087-1.605 2.207v4.252h-2.17V9.75h2.083v1.176h.03c.29-.55 1.002-1.13 2.062-1.13 2.206 0 2.614 1.453 2.614 3.342v5.201Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav
            className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3 md:grid-cols-4 md:gap-10"
            aria-label="Footer Navigation"
          >
            <div>
              <h3 className="mb-3 font-semibold text-blue-700">
                {t("footer.explore.title")}
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a className="hover:underline" href="/search?purpose=sale">
                    {t("footer.explore.buy")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/search?purpose=rent">
                    {t("footer.explore.rent")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/createlistingform">
                    {t("footer.explore.list")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-blue-700">
                {t("footer.company.title")}
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a className="hover:underline" href="/about">
                    {t("footer.company.about")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/contact">
                    {t("footer.company.contact")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/careers">
                    {t("footer.company.careers")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-blue-700">
                {t("footer.legal.title")}
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a className="hover:underline" href="/impressum">
                    {t("footer.legal.impressum")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/privacy">
                    {t("footer.legal.privacy")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/terms">
                    {t("footer.legal.terms")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-blue-700">
                {t("footer.quickLinks.title")}
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a
                    className="hover:underline"
                    href="/search?category=apartment"
                  >
                    {t("footer.quickLinks.apartments")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/search?category=villa">
                    {t("footer.quickLinks.villas")}
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/search?category=shop">
                    {t("footer.quickLinks.shops")}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 " />

        {/* Bottom bar: copyright */}
        <div className="flex flex-col gap-4 py-6 items-center justify-center">
          {/* Copyright */}
          <p className="text-sm text-gray-500 ">
            {t("footer.rightsReserved", { year })} | {t("footer.aqarDot")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
