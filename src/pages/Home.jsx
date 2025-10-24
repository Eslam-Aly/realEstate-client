import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import ListingItems from "../components/ListingItems";
import heroImage from "../assets/hero.jpg";
import { useTranslation } from "react-i18next";

function Home() {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [aptRent, setAptRent] = useState([]);
  const [aptSale, setAptSale] = useState([]);
  const [villaRent, setVillaRent] = useState([]);
  const [villaSale, setVillaSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purpose, setPurpose] = useState("all");
  const [category, setCategory] = useState("");
  const [govs, setGovs] = useState([]);
  const [cities, setCities] = useState([]);
  const [govSlug, setGovSlug] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const urls = [
          "/api/listings/get?limit=6&sort=createdAt&order=desc",
          "/api/listings/get?purpose=rent&type=rent&category=apartment&limit=6&sort=createdAt&order=desc",
          "/api/listings/get?purpose=sale&type=sale&category=apartment&limit=6&sort=createdAt&order=desc",
          "/api/listings/get?purpose=rent&type=rent&category=villa&limit=6&sort=createdAt&order=desc",
          "/api/listings/get?purpose=sale&type=sale&category=villa&limit=6&sort=createdAt&order=desc",
        ];
        const resps = await Promise.all(urls.map((u) => fetch(u)));
        const jsons = await Promise.all(resps.map((r) => r.json()));
        if (!alive) return;
        const safe = (d) => (Array.isArray(d) ? d : d?.results || []);
        setListings(safe(jsons[0]));
        setAptRent(safe(jsons[1]));
        setAptSale(safe(jsons[2]));
        setVillaRent(safe(jsons[3]));
        setVillaSale(safe(jsons[4]));
      } catch (err) {
        console.error("Home fetch error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/locations/governorates");
        const data = await res.json();
        if (!alive) return;
        setGovs(Array.isArray(data) ? data : []);
      } catch (e) {
        setGovs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!govSlug) {
      setCities([]);
      setCitySlug("");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/locations/cities/${govSlug}`);
        const data = await res.json();
        if (!alive) return;
        setCities(Array.isArray(data) ? data : []);
      } catch (e) {
        setCities([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [govSlug]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (purpose && purpose !== "all") {
      params.set("purpose", purpose); // new style
      params.set("type", purpose); // legacy/alt style
    }
    if (category) params.set("category", category);
    if (govSlug) params.set("gov", govSlug); // backend expects `gov`
    if (citySlug) params.set("city", citySlug);
    params.set("sort", "createdAt");
    params.set("order", "desc");
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative isolate min-h-[70vh] w-full overflow-hidden ">
        {/* Background image */}
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />

        {/* Dark/gradient overlay for readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-black/80 via-black/30 to-transparent" />

        {/* Content (top-left) */}
        <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10 md:pt-24">
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow md:text-6xl">
            {t("search.title")}
          </h1>

          {/* Search bar */}
          <div className="mt-6 flex justify-center">
            <form
              className="w-full max-w-3xl rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur "
              onSubmit={handleSearch}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {/* Purpose */}
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    {t("search.purpose")}
                  </span>
                  <select
                    aria-label="Purpose"
                    className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="rent">Rent</option>
                    <option value="sale">Sale</option>
                  </select>
                </label>

                {/* Category (Type) */}
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    {t("search.type")}
                  </span>
                  <select
                    aria-label="Property type"
                    className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="duplex">Duplex</option>
                    <option value="studio">Studio</option>
                    <option value="land">Land</option>
                    <option value="shop">Shop</option>
                    <option value="office">Office</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="building">Building</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                {/* Governorate */}
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    {t("search.governorate")}
                  </span>
                  <select
                    aria-label="Governorate"
                    className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    value={govSlug}
                    onChange={(e) => setGovSlug(e.target.value)}
                  >
                    <option value="">Any</option>
                    {govs.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* City */}
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    {t("search.city")}
                  </span>
                  <select
                    aria-label="City"
                    className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    value={citySlug}
                    onChange={(e) => setCitySlug(e.target.value)}
                    disabled={!govSlug}
                  >
                    <option value="">
                      {govSlug ? "Any" : "Select governorate first"}
                    </option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Search button */}
                <button
                  type="submit"
                  className="sm:col-span-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 cursor-pointer"
                >
                  {t("search.search")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Listings Sections */}
      <section className="max-w-6xl mx-auto p-3 md:p-6 flex flex-col gap-8 my-10">
        {loading ? (
          <div className="text-center text-gray-500">Loading listings...</div>
        ) : (
          <>
            {/* Recent Listings (all) */}
            {listings && listings.length > 0 && (
              <div>
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent listings
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={"/search?sort=createdAt&order=desc"}
                  >
                    Show more listings
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {listings.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Apartments for Rent */}
            {aptRent && aptRent.length > 0 && (
              <div>
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent apartments for rent
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={
                      "/search?purpose=rent&type=rent&category=apartment&sort=createdAt&order=desc"
                    }
                  >
                    Show more apartments for rent
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {aptRent.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Apartments for Sale */}
            {aptSale && aptSale.length > 0 && (
              <div>
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent apartments for sale
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={
                      "/search?purpose=sale&type=sale&category=apartment&sort=createdAt&order=desc"
                    }
                  >
                    Show more apartments for sale
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {aptSale.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Villas for Rent */}
            {villaRent && villaRent.length > 0 && (
              <div>
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent villas for rent
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={
                      "/search?purpose=rent&type=rent&category=villa&sort=createdAt&order=desc"
                    }
                  >
                    Show more villas for rent
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {villaRent.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Villas for Sale */}
            {villaSale && villaSale.length > 0 && (
              <div>
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent villas for sale
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={
                      "/search?purpose=sale&type=sale&category=villa&sort=createdAt&order=desc"
                    }
                  >
                    Show more villas for sale
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {villaSale.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Home;
