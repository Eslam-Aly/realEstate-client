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
    type: "rent",
    parking: false,
    furnished: false,
    sort: "createdAt",
    order: "desc",
  });
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm") || "";
    const typeFromUrl = urlParams.get("type");
    const validTypes = [
      "apartmentRent",
      "apartmentSale",
      "villaRent",
      "villaSale",
      "other",
      "rent",
      "sale",
    ];
    const normalizedType = validTypes.includes(typeFromUrl)
      ? typeFromUrl
      : "all";
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
        console.log("Fetching from:", endpoint);
        const response = await fetch(endpoint);
        const data = await response.json();
        console.log("Search results:", data);
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
    if (e.target.id === "type") {
      setSidebarData((prevData) => ({
        ...prevData,
        type: e.target.value,
      }));
      setTypeRent(e.target.value === "rent");
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
  const [purpose, setPurpose] = useState("all");
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
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 border-slate-600 bg-white border p-3 rounded-lg">
              <span className="whitespace-nowrap text-sm text-slate-600 ">
                Purpose:{" "}
              </span>
              <select
                name="purpose"
                aria-label="Property type"
                className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                value={sidebarData.purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  handleChange(e);
                }}
              >
                <option value="" disabled>
                  Select purpose
                </option>
                <option value="all">All</option>
                <option value="rent">Rent</option>
                <option value="sale">Sale</option>
              </select>
            </label>
            <label className="flex items-center gap-2 border-slate-600 bg-white  border p-3 rounded-lg">
              <span className="whitespace-nowrap text-sm text-slate-600">
                Type:{" "}
              </span>
              {purpose === "rent" && (
                <select
                  name="type"
                  aria-label="Property type"
                  className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer "
                  value={sidebarData.type}
                  onChange={handleChange}
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
                  value={sidebarData.type}
                  onChange={handleChange}
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
                  value={sidebarData.type}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="all">All</option>
                  <option value="apartment">Apartments</option>
                  <option value="villa">Villas</option>
                  <option value="commercial">Commercials</option>
                  <option value="land">Lands</option>
                  <option value="building">Buildings</option>
                </select>
              )}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="minPrice"
              placeholder="Min Price"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="minSize"
              placeholder="Min Size (sqm)"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="maxSize"
              placeholder="Max Size (sqm)"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="minBedrooms"
              placeholder="Min Bedrooms"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="maxBedrooms"
              placeholder="Max Bedrooms"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="minBathrooms"
              placeholder="Min Bathrooms"
              onChange={handleChange}
            />
            <input
              value=""
              className="border p-3 rounded-lg"
              type="number"
              name="maxBathrooms"
              placeholder="Max Bathrooms"
              onChange={handleChange}
            />
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
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
          {/* Repeat listing cards as needed */}
          {loading && <p className="col-span-full text-center">Loading...</p>}
          {!loading && listings.length === 0 && (
            <p className="col-span-full text-center text-gray-500">
              No listings found.
            </p>
          )}
          {!loading &&
            listings.map((listing) => (
              <div className="flex flex-wrap " key={listing._id}>
                <ListingItems listing={listing} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Search;
