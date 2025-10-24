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
    governorate: "", // slug
    city: "", // slug
    purpose: "all", // UI field: all | rent | sale
    type: "all", // UI field: all | apartment | villa | commercial | land | building
    parking: false,
    furnished: false,
    minPrice: "",
    maxPrice: "",
    minSize: "",
    maxSize: "",
    minBedrooms: "",
    maxBedrooms: "",
    minBathrooms: "",
    maxBathrooms: "",
    sort: "createdAt",
    order: "desc",
  });
  const [govs, setGovs] = useState([]); // [{name, slug}]
  const [cities, setCities] = useState([]); // [{name, slug}]
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm") || "";
    const governorateFromUrl = urlParams.get("gov") || "";
    const cityFromUrl = urlParams.get("city") || "";
    const purposeFromUrl = urlParams.get("purpose") || "all";
    const baseTypeFromUrl = urlParams.get("category") || "all";

    const parkingFromUrl = urlParams.get("parking") === "true";
    const furnishedFromUrl = urlParams.get("furnished") === "true";
    const sortFromUrl = urlParams.get("sort") || "createdAt";
    const orderFromUrl = urlParams.get("order") === "asc" ? "asc" : "desc";

    const minPriceFromUrl = urlParams.get("min") || "";
    const maxPriceFromUrl = urlParams.get("max") || "";
    const minBedroomsFromUrl = urlParams.get("minBedrooms") || "";
    const maxBedroomsFromUrl = urlParams.get("maxBedrooms") || "";
    const minBathroomsFromUrl = urlParams.get("minBathrooms") || "";
    const maxBathroomsFromUrl = urlParams.get("maxBathrooms") || "";
    const minSizeFromUrl = urlParams.get("minSize") || "";
    const maxSizeFromUrl = urlParams.get("maxSize") || "";
    const exactBedrooms = urlParams.get("bedrooms") || "";
    const exactBathrooms = urlParams.get("bathrooms") || "";

    setSidebarData((prevData) => ({
      ...prevData,
      searchTerm: searchTermFromUrl,
      governorate: governorateFromUrl,
      city: cityFromUrl,
      purpose: purposeFromUrl,
      type: baseTypeFromUrl,
      parking: parkingFromUrl,
      furnished: furnishedFromUrl,
      order: orderFromUrl,
      sort: sortFromUrl,
      minPrice: minPriceFromUrl,
      maxPrice: maxPriceFromUrl,
      minSize: minSizeFromUrl,
      maxSize: maxSizeFromUrl,
      // Support both new min/max params and legacy exact values
      minBedrooms: minBedroomsFromUrl || exactBedrooms,
      maxBedrooms: maxBedroomsFromUrl || exactBedrooms,
      minBathrooms: minBathroomsFromUrl || exactBathrooms,
      maxBathrooms: maxBathroomsFromUrl || exactBathrooms,
    }));
    const fetchListings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(location.search);
        // No longer normalize/remove "type"
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
        // Robust parser: accept array or {results: [...]}
        const list = Array.isArray(data) ? data : data?.results || [];
        setListings(list);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [location.search]);

  // Fetch governorates on mount
  useEffect(() => {
    let active = true;
    fetch("/api/locations/governorates")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setGovs(Array.isArray(data) ? data : []);
      })
      .catch(() => setGovs([]));
    return () => {
      active = false;
    };
  }, []);

  // Fetch cities when governorate changes
  useEffect(() => {
    let active = true;
    if (!sidebarData.governorate) {
      setCities([]);
      return;
    }
    fetch(`/api/locations/cities/${sidebarData.governorate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => setCities([]));
    // reset city if it doesn't belong to the new list
    setSidebarData((prev) => ({ ...prev, city: "" }));
    return () => {
      active = false;
    };
  }, [sidebarData.governorate]);

  const handleChange = (e) => {
    const { name, id, type, value, checked } = e.target;
    const key = name || id;

    if (key === "sortBy") {
      const [sortField, sortOrder] = value.split("_");
      setSidebarData((prev) => ({
        ...prev,
        sort: sortField,
        order: sortOrder || "desc",
      }));
      return;
    }

    if (key === "parking" || key === "furnished") {
      setSidebarData((prev) => ({ ...prev, [key]: !!checked }));
      return;
    }

    setSidebarData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();

    // free text
    if (sidebarData.searchTerm.trim()) {
      urlParams.set("searchTerm", sidebarData.searchTerm.trim());
    }

    // location
    if (sidebarData.governorate) urlParams.set("gov", sidebarData.governorate);
    if (sidebarData.city) urlParams.set("city", sidebarData.city);

    // purpose & category
    if (sidebarData.purpose !== "all")
      urlParams.set("purpose", sidebarData.purpose);
    if (sidebarData.type !== "all") urlParams.set("category", sidebarData.type);

    // features
    if (sidebarData.parking) urlParams.set("parking", "true");
    if (sidebarData.furnished) urlParams.set("furnished", "true");

    // price range → backend expects min/max
    if (String(sidebarData.minPrice).trim() !== "")
      urlParams.set("min", String(sidebarData.minPrice).trim());
    if (String(sidebarData.maxPrice).trim() !== "")
      urlParams.set("max", String(sidebarData.maxPrice).trim());

    // size range (sqm)
    if (String(sidebarData.minSize).trim() !== "")
      urlParams.set("minSize", String(sidebarData.minSize).trim());
    if (String(sidebarData.maxSize).trim() !== "")
      urlParams.set("maxSize", String(sidebarData.maxSize).trim());

    // bedrooms / bathrooms ranges
    if (String(sidebarData.minBedrooms).trim() !== "")
      urlParams.set("minBedrooms", String(sidebarData.minBedrooms).trim());
    if (String(sidebarData.maxBedrooms).trim() !== "")
      urlParams.set("maxBedrooms", String(sidebarData.maxBedrooms).trim());
    if (String(sidebarData.minBathrooms).trim() !== "")
      urlParams.set("minBathrooms", String(sidebarData.minBathrooms).trim());
    if (String(sidebarData.maxBathrooms).trim() !== "")
      urlParams.set("maxBathrooms", String(sidebarData.maxBathrooms).trim());

    // sort/order
    urlParams.set("sort", sidebarData.sort);
    urlParams.set("order", sidebarData.order);

    const searchQuery = urlParams.toString();
    navigate(searchQuery ? `/search?${searchQuery}` : "/search");
  };

  const resetFilters = () => {
    setSidebarData({
      searchTerm: "",
      governorate: "",
      city: "",
      purpose: "all",
      type: "all",
      parking: false,
      furnished: false,
      minPrice: "",
      maxPrice: "",
      minSize: "",
      maxSize: "",
      minBedrooms: "",
      maxBedrooms: "",
      minBathrooms: "",
      maxBathrooms: "",
      sort: "createdAt",
      order: "desc",
    });
    navigate("/search");
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search controls stacked (like Home) */}
      <section className="mb-8">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 flex flex-col gap-6"
        >
          {/* Row 1: Search term */}
          <div className="gap-2 flex flex-col">
            <label
              htmlFor="searchTerm"
              className="text-sm font-medium text-slate-700"
            >
              Search
            </label>
            <input
              type="text"
              id="searchTerm"
              name="searchTerm"
              value={sidebarData.searchTerm}
              placeholder="Search..."
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>

          {/* Row 2: Purpose + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 border-slate-600 bg-white border p-3 rounded-lg">
              <span className="whitespace-nowrap text-sm text-slate-600">
                Purpose:
              </span>
              <select
                name="purpose"
                aria-label="Purpose"
                className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                value={sidebarData.purpose}
                onChange={handleChange}
              >
                <option value="all">All</option>
                <option value="rent">Rent</option>
                <option value="sale">Sale</option>
              </select>
            </label>

            <label className="flex items-center gap-2 border-slate-600 bg-white border p-3 rounded-lg">
              <span className="whitespace-nowrap text-sm text-slate-600">
                Type:
              </span>
              <select
                name="type"
                aria-label="Property type"
                className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                value={sidebarData.type}
                onChange={handleChange}
              >
                <option value="all">All</option>
                <option value="apartment">Apartments</option>
                <option value="villa">Villas</option>
                <option value="duplex">Duplex</option>
                <option value="studio">Studios</option>
                <option value="land">Lands</option>
                <option value="shop">Shops</option>
                <option value="office">Offices</option>
                <option value="warehouse">Warehouses</option>
                <option value="building">Buildings</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          {/* Row 3: Governorate + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Governorate</span>
              <select
                name="governorate"
                className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                value={sidebarData.governorate}
                onChange={handleChange}
              >
                <option value="">All Governorates</option>
                {govs.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">City / Area</span>
              <select
                name="city"
                className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                value={sidebarData.city}
                onChange={handleChange}
                disabled={!sidebarData.governorate}
              >
                <option value="">
                  {sidebarData.governorate
                    ? "All Cities"
                    : "Select Governorate first"}
                </option>
                {cities.map((c) => (
                  <option key={c.slug} value={String(c.slug)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 4: Price & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              value={sidebarData.minPrice}
              className="border p-3 rounded-lg"
              type="number"
              name="minPrice"
              placeholder="Min Price"
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxPrice}
              className="border p-3 rounded-lg"
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              onChange={handleChange}
            />
            <input
              value={sidebarData.minSize}
              className="border p-3 rounded-lg"
              type="number"
              name="minSize"
              placeholder="Min Size (sqm)"
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxSize}
              className="border p-3 rounded-lg"
              type="number"
              name="maxSize"
              placeholder="Max Size (sqm)"
              onChange={handleChange}
            />
          </div>

          {/* Row 5: Beds & Baths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              value={sidebarData.minBedrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="minBedrooms"
              placeholder="Min Bedrooms"
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxBedrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="maxBedrooms"
              placeholder="Max Bedrooms"
              onChange={handleChange}
            />
            <input
              value={sidebarData.minBathrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="minBathrooms"
              placeholder="Min Bathrooms"
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxBathrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="maxBathrooms"
              placeholder="Max Bathrooms"
              onChange={handleChange}
            />
          </div>

          {/* Row 6: Sort & toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <label className="flex gap-2 border rounded-md px-3 py-2">
              <span className="text-sm text-slate-600">Sort:</span>
              <select
                name="sortBy"
                className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
                value={`${sidebarData.sort}_${sidebarData.order}`}
                onChange={handleChange}
              >
                <option value="createdAt_desc">Newest</option>
                <option value="createdAt_asc">Oldest</option>
                <option value="price_asc">Price (Low → High)</option>
                <option value="price_desc">Price (High → Low)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                name="parking"
                checked={sidebarData.parking}
                onChange={handleChange}
              />
              <span className="text-sm">Parking</span>
            </label>

            <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                name="furnished"
                checked={sidebarData.furnished}
                onChange={handleChange}
              />
              <span className="text-sm">Furnished</span>
            </label>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              type="submit"
              className="bg-blue-700 text-white rounded-md p-2 hover:bg-blue-800 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-gray-200 text-gray-800 rounded-md p-2 hover:bg-gray-300 transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* Results */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Search Results</h2>
          <span className="text-slate-500 text-sm">
            {loading
              ? "Loading…"
              : `Showing ${listings.length} ${
                  listings.length === 1 ? "listing" : "listings"
                }`}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-[320px] sm:h-[220px] w-full bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-slate-600">No listings found.</div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingItems key={listing._id || listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Search;
