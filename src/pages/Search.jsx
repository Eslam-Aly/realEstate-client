import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ListingItems from "../components/ListingItems.jsx";

function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [sidebarData, setSidebarData] = useState({
    searchTerm: "",
    type: "all",
    parking: false,
    furnished: false,
    sort: "createdAt",
    order: "desc",
  });
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm") || "";
    const typeFromUrl = urlParams.get("type");
    const normalizedType =
      typeFromUrl === "rent" || typeFromUrl === "sale" ? typeFromUrl : "all";
    const parkingFromUrl = urlParams.get("parking") === "true";
    const furnishedFromUrl = urlParams.get("furnished") === "true";
    const sortFromUrl = urlParams.get("sort") || "createdAt";
    const orderFromUrl = urlParams.get("order") === "asc" ? "asc" : "desc";
    setSidebarData((prevData) => ({
      ...prevData,
      searchTerm: searchTermFromUrl,
      type: normalizedType,
      parking: parkingFromUrl,
      furnished: furnishedFromUrl,
      order: orderFromUrl,
      sort: sortFromUrl,
    }));
    const fetchListings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(location.search);
        const typeParam = params.get("type");
        if (!typeParam || typeParam === "all") {
          params.delete("type");
        }
        const sortParam = params.get("sort") || "createdAt";
        const orderParam =
          params.get("order") && params.get("order").toLowerCase() === "asc"
            ? "asc"
            : "desc";
        params.set("sort", sortParam);
        params.set("order", orderParam);
        if (params.get("searchTerm") === "") {
          params.delete("searchTerm");
        }
        const searchQuery = params.toString();
        const endpoint = searchQuery
          ? `/api/listings/get?${searchQuery}`
          : `/api/listings/get`;
        const response = await fetch(endpoint);
        const data = await response.json();
        setListings(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    if (
      e.target.id === "rent" ||
      e.target.id === "sale" ||
      e.target.id === "all"
    ) {
      setSidebarData((prevData) => ({
        ...prevData,
        type: e.target.id,
      }));
    }
    if (e.target.id === "parking" || e.target.id === "furnished") {
      setSidebarData((prevData) => ({
        ...prevData,
        [e.target.id]: e.target.checked,
      }));
    }
    if (e.target.id === "searchTerm") {
      setSidebarData((prevData) => ({
        ...prevData,
        searchTerm: e.target.value,
      }));
    }
    if (e.target.id === "sortBy") {
      const [sortField, sortOrder] = e.target.value.split("_");
      setSidebarData((prevData) => ({
        ...prevData,
        sort: sortField,
        order: sortOrder || "desc",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    if (sidebarData.searchTerm.trim()) {
      urlParams.set("searchTerm", sidebarData.searchTerm.trim());
    }
    if (sidebarData.type !== "all") {
      urlParams.set("type", sidebarData.type);
    }
    if (sidebarData.parking) {
      urlParams.set("parking", "true");
    }
    if (sidebarData.furnished) {
      urlParams.set("furnished", "true");
    }
    urlParams.set("sort", sidebarData.sort);
    urlParams.set("order", sidebarData.order);
    const searchQuery = urlParams.toString();
    navigate(searchQuery ? `/search?${searchQuery}` : "/search");
  };
  return (
    <div className="min-h-screen   flex ">
      <div className="w-1/3">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto p-4 my-4   flex flex-col gap-6"
        >
          <div className="gap-4 flex flex-col  ">
            <label htmlFor="search" className="whitespace-nowrap">
              Search
            </label>
            <input
              type="text"
              id="searchTerm"
              value={sidebarData.searchTerm}
              placeholder="Search..."
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 "
            />
          </div>

          <label htmlFor="type">Type</label>
          <div className="gap-2 flex items-center">
            <input
              type="checkbox"
              id="all"
              onChange={handleChange}
              checked={sidebarData.type === "all"}
            />
            <span className="mr-2">Rent & Sale</span>
            <input
              type="checkbox"
              id="rent"
              onChange={handleChange}
              checked={sidebarData.type === "rent"}
            />
            <span className="mr-2">Rent</span>
            <input
              type="checkbox"
              id="sale"
              onChange={handleChange}
              checked={sidebarData.type === "sale"}
            />
            <span>Sale</span>
          </div>
          <label htmlFor="">Amenities: </label>
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              name=""
              id="parking"
              onChange={handleChange}
              checked={sidebarData.parking}
            />

            <label htmlFor="parking" className="mr-2">
              Parking
            </label>
            <input
              type="checkbox"
              name=""
              id="furnished"
              onChange={handleChange}
              checked={sidebarData.furnished}
            />
            <label htmlFor="furnished">Furnished</label>
          </div>
          <div>
            <label htmlFor="" className="mr-2">
              Sort By:{" "}
            </label>
            <select
              name=""
              id="sortBy"
              onChange={handleChange}
              value={`${sidebarData.sort}_${sidebarData.order}`}
            >
              <option value="regularPrice_asc">Price: Low to High</option>
              <option value="regularPrice_desc">Price: High to Low</option>
              <option value="createdAt_desc">Newest Listings</option>
              <option value="createdAt_asc">Oldest Listings</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 transition mt-4 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>
      <div className="border mx-3 text-gray-300"></div>

      <div className="">
        <h2 className="text-2xl font-bold text-center my-4">Search Results</h2>
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Example listing card */}

          {/* Repeat listing cards as needed */}
          {loading && <p className="col-span-full text-center">Loading...</p>}
          {!loading && listings.length === 0 && (
            <p className="col-span-full text-center text-gray-500">
              No listings found.
            </p>
          )}
          {!loading &&
            listings.map((listing) => (
              <div
                key={listing._id}
                className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition"
              >
                <div className="h-40 bg-gray-200">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold truncate">
                    {listing.title}
                  </h3>
                  <p className="text-blue-600 font-bold">
                    ${listing.regularPrice?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {listing.bedrooms} Beds • {listing.bathrooms} Baths
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/listing/${listing._id}`)}
                    className="mt-2 inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Search;
