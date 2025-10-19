import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ListingItems from "../components/ListingItems";
import heroImage from "../assets/hero.jpg";

function Home() {
  const [listings, setListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purpose, setPurpose] = useState("all");
  console.log(listings);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        // Fetch recent listings (all types)
        const response = await fetch(
          "/api/listings/get?limit=4&sort=createdAt&order=desc"
        );
        const data = await response.json();
        setListings(data);

        // Fetch rent listings
        await fetchRentListings();
        console.log(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRentListings = async () => {
      try {
        const response = await fetch("/api/listings/get?type=rent&limit=4");
        const data = await response.json();
        setRentListings(data);

        // Fetch sale listings
        await fetchSaleListings();
      } catch (error) {
        console.error("Error fetching rent listings:", error);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const response = await fetch("/api/listings/get?type=sale&limit=4");
        const data = await response.json();
        setSaleListings(data);
      } catch (error) {
        console.error("Error fetching sale listings:", error);
      }
    };

    fetchListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
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
            Find your next perfect place with ease
          </h1>

          {/* Search bar */}
          <div className="mt-6 flex justify-center">
            <form
              className="w-full max-w-3xl rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur transition hover:bg-white"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* type */}
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    Purpose:{" "}
                  </span>
                  <select
                    aria-label="Property type"
                    className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="" disabled>
                      Select purpose
                    </option>
                    <option value="all">All</option>
                    <option value="rent">Rent</option>
                    <option value="sale">Sale</option>
                  </select>
                </label>

                {/* Type */}

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    Type:{" "}
                  </span>
                  {purpose === "rent" && (
                    <select
                      name="type"
                      aria-label="Property type"
                      className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer "
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      <option value="apartment">Apartments for Rent</option>
                      <option value="villa">Villas for Rent</option>
                      <option value="commercial">Commercials for Rent</option>
                      <option value="land">Lands for Rent</option>
                      <option value="building">Buildings for Rent</option>
                    </select>
                  )}
                  {purpose === "sale" && (
                    <select
                      name="type"
                      aria-label="Property type"
                      className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer 
                "
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      <option value="apartment">Apartments for Sale</option>
                      <option value="villa">Villas for Sale</option>
                      <option value="commercial">Commercials for Sale</option>
                      <option value="land">Lands for Sale</option>
                      <option value="building">Buildings for Sale</option>
                    </select>
                  )}
                  {purpose === "all" && (
                    <select
                      name="type"
                      aria-label="Property type"
                      className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      <option value="apartment">Apartments</option>
                      <option value="villa">Villas</option>
                      <option value="commercial">Commercials</option>
                      <option value="land">Lands</option>
                      <option value="building">Buildings</option>
                    </select>
                  )}
                </label>

                {/* Location */}
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    Location:{" "}
                  </span>
                  <select
                    aria-label="Location"
                    className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose location
                    </option>
                    {/* Replace with your governorate/city data */}
                    <option value="cairo">Cairo</option>
                    <option value="giza">Giza</option>
                    <option value="alex">Alexandria</option>
                  </select>
                </label>

                {/* Search button */}
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Listings Sections */}
      <section className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
        {loading ? (
          <div className="text-center text-gray-500">Loading listings...</div>
        ) : (
          <>
            {/* Recent Listings */}
            {listings && listings.length > 0 && (
              <div className="">
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent listings
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={"/search"}
                  >
                    Show more listings
                  </Link>
                </div>
                <div className="flex flex-wrap  gap-4">
                  {listings.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Rent Listings */}
            {rentListings && rentListings.length > 0 && (
              <div className="">
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent places for rent
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={"/search?type=rent"}
                  >
                    Show more places for rent
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {rentListings.map((listing) => (
                    <ListingItems listing={listing} key={listing._id} />
                  ))}
                </div>
              </div>
            )}

            {/* Sale Listings */}
            {saleListings && saleListings.length > 0 && (
              <div className="">
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">
                    Recent places for sale
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to={"/search?type=sale"}
                  >
                    Show more places for sale
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {saleListings.map((listing) => (
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
