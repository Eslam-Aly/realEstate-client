import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ListingItems from "../components/ListingItems";

function Home() {
  const [listings, setListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div>
      {/* Hero Section */}
      <div className="flex flex-col gap-6 p-28 px-3 max-w-6xl mx-auto">
        <h1 className="text-slate-700 font-bold text-3xl lg:text-6xl">
          Find your next <span className="text-slate-500">perfect</span>
          <br />
          place with ease
        </h1>
        <div className="text-gray-400 text-xs sm:text-sm">
          Real estate app is the best place to find your next perfect place to
          live.
          <br />
          We have a wide range of properties for you to choose from.
        </div>
        <Link
          to={"/search"}
          className="text-xs sm:text-sm text-blue-800 font-bold hover:underline"
        >
          Let's get started...
        </Link>
      </div>

      {/* Listings Sections */}
      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
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
      </div>
    </div>
  );
}

export default Home;
