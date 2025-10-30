import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ListingItems from "../components/ListingItems.jsx";
import { useTranslation } from "react-i18next";
import API from "../../api/index.js";

function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);

  const [sidebarData, setSidebarData] = useState({
    searchTerm: "",
    governorate: "", // slug
    city: "", // slug
    area: "",

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
  const [govs, setGovs] = useState([]); // [{name, slug, nameAr}]
  const [cities, setCities] = useState([]); // [{name, slug, nameAr}]
  const [areas, setAreas] = useState([]); // [{name, slug, nameAr}]
  const isAr = i18n?.language?.startsWith("ar");
  const langParam = isAr ? "ar" : "en";
  const getDisplayName = (item) =>
    isAr && item?.nameAr ? item.nameAr : item?.name || "";
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm") || "";
    const governorateFromUrl = urlParams.get("gov") || "";
    const areaFromUrl = urlParams.get("area") || "";
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
      area: areaFromUrl,
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
          ? `${API}/listings/get?${searchQuery}`
          : `${API}/listings/get`;
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

  // Fetch governorates on mount and when language changes
  useEffect(() => {
    let active = true;
    fetch(`${API}/locations/governorates?lang=${langParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setGovs(Array.isArray(data) ? data : []);
      })
      .catch(() => setGovs([]));
    return () => {
      active = false;
    };
  }, [langParam]);

  // Fetch cities when governorate changes
  useEffect(() => {
    let active = true;
    if (!sidebarData.governorate) {
      setCities([]);
      setAreas([]);
      setSidebarData((prev) =>
        prev.city || prev.area ? { ...prev, city: "", area: "" } : prev
      );
      return;
    }
    fetch(
      `${API}/locations/governorates/${sidebarData.governorate}/cities?lang=${langParam}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.cities) ? data.cities : [];
        setCities(list);
        setSidebarData((prev) => {
          if (!list.some((c) => c.slug === prev.city)) {
            return { ...prev, city: "", area: "" };
          }
          return prev;
        });
      })
      .catch(() => {
        setCities([]);
        setAreas([]);
        setSidebarData((prev) =>
          prev.city || prev.area ? { ...prev, city: "", area: "" } : prev
        );
      });
    return () => {
      active = false;
    };
  }, [sidebarData.governorate, langParam]);

  // Fetch areas when city changes
  useEffect(() => {
    let active = true;
    if (!sidebarData.governorate || !sidebarData.city) {
      setAreas([]);
      setSidebarData((prev) => (prev.area ? { ...prev, area: "" } : prev));
      return;
    }
    fetch(
      `${API}/locations/governorates/${sidebarData.governorate}/cities/${sidebarData.city}/areas?lang=${langParam}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.areas) ? data.areas : [];
        setAreas(list);
        setSidebarData((prev) => {
          if (!list.some((a) => a.slug === prev.area)) {
            return { ...prev, area: "" };
          }
          return prev;
        });
      })
      .catch(() => {
        setAreas([]);
        setSidebarData((prev) => (prev.area ? { ...prev, area: "" } : prev));
      });
    return () => {
      active = false;
    };
  }, [sidebarData.governorate, sidebarData.city, langParam]);

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

    if (key === "governorate") {
      setSidebarData((prev) => ({
        ...prev,
        governorate: value,
        city: "",
        area: "",
      }));
      return;
    }

    if (key === "city") {
      setSidebarData((prev) => ({
        ...prev,
        city: value,
        area: "",
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
    if (sidebarData.area) urlParams.set("area", sidebarData.area);

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
      area: "",
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
              {t("search.search")}
            </label>
            <input
              type="text"
              id="searchTerm"
              name="searchTerm"
              value={sidebarData.searchTerm}
              placeholder={t("nav.search")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>

          {/* Row 2: Purpose + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 border-slate-600 bg-white border p-3 rounded-lg">
              <span className="whitespace-nowrap text-sm text-slate-600">
                {t("search.purpose")}:
              </span>
              <select
                name="purpose"
                aria-label="Purpose"
                className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                value={sidebarData.purpose}
                onChange={handleChange}
              >
                <option value="all">{t("search.all")}</option>
                <option value="rent">{t("search.rent")}</option>
                <option value="sale">{t("search.sale")}</option>
              </select>
            </label>

            <label className="flex items-center gap-2 border-slate-600 bg-white border p-3 rounded-lg">
              <span className="whitespace-nowrap text-sm text-slate-600">
                {t("search.type")}:
              </span>
              <select
                name="type"
                aria-label="Property type"
                className="w-full appearance-none bg-transparent text-sm outline-none cursor-pointer"
                value={sidebarData.type}
                onChange={handleChange}
              >
                <option value="all">{t("search.all")}</option>
                <option value="apartment">
                  {t("listing.propertyTypes.apartment")}
                </option>
                <option value="villa">
                  {t("listing.propertyTypes.villa")}
                </option>
                <option value="duplex">
                  {t("listing.propertyTypes.duplex")}
                </option>
                <option value="studio">
                  {t("listing.propertyTypes.studio")}
                </option>
                <option value="land">{t("listing.propertyTypes.land")}</option>
                <option value="shop">{t("listing.propertyTypes.shop")}</option>
                <option value="office">
                  {t("listing.propertyTypes.office")}
                </option>
                <option value="warehouse">
                  {t("listing.propertyTypes.warehouse")}
                </option>
                <option value="building">
                  {t("listing.propertyTypes.building")}
                </option>
                <option value="other">
                  {t("listing.propertyTypes.other")}
                </option>
              </select>
            </label>
          </div>

          {/* Row 3: Governorate + City + Area */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm">{t("search.governorate")}</span>
              <select
                name="governorate"
                className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                value={sidebarData.governorate}
                onChange={handleChange}
              >
                <option value="">{t("search.allGov")}</option>
                {govs.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {getDisplayName(g)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">{t("search.city")}</span>
              <select
                name="city"
                className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                value={sidebarData.city}
                onChange={handleChange}
                disabled={!sidebarData.governorate}
              >
                <option value="">
                  {sidebarData.governorate
                    ? `${t("search.allCities")}`
                    : `${t("search.selectGovFirst")}`}
                </option>
                {cities.map((c) => (
                  <option key={c.slug} value={String(c.slug)}>
                    {getDisplayName(c)}
                  </option>
                ))}
              </select>
            </label>

            {sidebarData.city && Array.isArray(areas) && areas.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-sm">{t("search.area")}</span>
                <select
                  name="area"
                  className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                  value={sidebarData.area}
                  onChange={handleChange}
                  disabled={
                    !sidebarData.governorate ||
                    !sidebarData.city ||
                    areas.length === 0
                  }
                >
                  <option value="">{t("search.allAreas")}</option>
                  {areas.map((a) => (
                    <option key={a.slug} value={String(a.slug)}>
                      {getDisplayName(a)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {/* Row 4: Price & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              value={sidebarData.minPrice}
              className="border p-3 rounded-lg"
              type="number"
              name="minPrice"
              placeholder={t("search.minPrice")}
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxPrice}
              className="border p-3 rounded-lg"
              type="number"
              name="maxPrice"
              placeholder={t("search.maxPrice")}
              onChange={handleChange}
            />
            <input
              value={sidebarData.minSize}
              className="border p-3 rounded-lg"
              type="number"
              name="minSize"
              placeholder={t("search.minSize")}
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxSize}
              className="border p-3 rounded-lg"
              type="number"
              name="maxSize"
              placeholder={t("search.maxSize")}
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
              placeholder={t("search.minBeds")}
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxBedrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="maxBedrooms"
              placeholder={t("search.maxBeds")}
              onChange={handleChange}
            />
            <input
              value={sidebarData.minBathrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="minBathrooms"
              placeholder={t("search.minBaths")}
              onChange={handleChange}
            />
            <input
              value={sidebarData.maxBathrooms}
              className="border p-3 rounded-lg"
              type="number"
              name="maxBathrooms"
              placeholder={t("search.maxBaths")}
              onChange={handleChange}
            />
          </div>

          {/* Row 6: Sort & toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <label className="flex gap-2 border rounded-md px-3 py-2">
              <span className="text-sm text-slate-600">
                {t("search.sort")}:
              </span>
              <select
                name="sortBy"
                className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
                value={`${sidebarData.sort}_${sidebarData.order}`}
                onChange={handleChange}
              >
                <option value="createdAt_desc">{t("search.newest")}</option>
                <option value="createdAt_asc">{t("search.oldest")}</option>
                <option value="price_asc">{t("search.priceLH")}</option>
                <option value="price_desc">{t("search.priceHL")}</option>
              </select>
            </label>

            <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                name="parking"
                checked={sidebarData.parking}
                onChange={handleChange}
              />
              <span className="text-sm">{t("listing.parking")}</span>
            </label>

            <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                name="furnished"
                checked={sidebarData.furnished}
                onChange={handleChange}
              />
              <span className="text-sm">{t("listing.furnished")}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              type="submit"
              className="bg-blue-700 text-white rounded-md p-2 hover:bg-blue-800 transition cursor-pointer"
            >
              {t("search.search")}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-gray-200 text-gray-800 rounded-md p-2 hover:bg-gray-300 transition cursor-pointer"
            >
              {t("search.reset")}
            </button>
          </div>
        </form>
      </section>

      {/* Results */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("search.searchResults")}</h2>
          <span className="text-slate-500 text-sm">
            {loading
              ? "Loading…"
              : `${t("search.showing")} ${listings.length} ${
                  listings.length === 1
                    ? t("search.listing")
                    : t("search.listings")
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
          <div className="text-slate-600">{t("search.noResults")}</div>
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
