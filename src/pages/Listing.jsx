import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  localToggle,
  rollbackToggle,
  toggleFavorite as toggleFavoriteAsync,
} from "../redux/user/favoritesSlice.js";

import ListingItems from "../components/ListingItems.jsx";

import {
  FaBath,
  FaBed,
  FaChair,
  FaParking,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaShare,
  FaHeart,
  FaPhone,
  FaRulerCombined,
} from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import API from "../config/api.js";
function Listing() {
  // --- Language-aware location rendering ---
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");

  const getLocalizedName = (obj) => {
    if (!obj) return "";
    return isAr ? obj.nameAr || obj.name || "" : obj.name || obj.nameAr || "";
  };

  const getDisplayAddress = (listing) => {
    const loc = listing?.location || {};
    const gov = loc.governorate;
    const city = loc.city;
    const area = loc.area;

    if (city && area) {
      // If area exists, show only City - Area
      return `${getLocalizedName(city)} - ${getLocalizedName(area)}`;
    } else if (gov && city) {
      // If no area, show Governorate - City
      return `${getLocalizedName(gov)} - ${getLocalizedName(city)}`;
    } else if (city) {
      return getLocalizedName(city);
    } else if (gov) {
      return getLocalizedName(gov);
    } else {
      return listing?.address || "";
    }
  };
  // --- Helpers to normalize backend shapes/types ---
  const asBool = (v) => v === true || v === "true" || v === 1 || v === "1";
  const asNum = (v) =>
    v === undefined || v === null || v === "" ? undefined : Number(v);
  const pick = (...vals) =>
    vals.find((v) => v !== undefined && v !== null && v !== "");

  const getPrice = (l) =>
    asNum(pick(l?.price, l?.regularPrice, l?.discountedPrice, l?.amount));
  const getSize = (l) => {
    // Match backend subdocuments first, then fall back to flat legacy fields
    return pick(
      // residential
      l?.residential?.size,
      // land
      l?.land?.plotArea,
      // commercial
      l?.commercial?.floorArea,
      // building
      l?.building?.landArea,
      // other
      l?.other?.size,
      // flat fallbacks
      l?.size,
      l?.sqm,
      l?.squareMeters,
      l?.squareMeter,
      l?.square_meters,
      l?.m2,
      l?.meter,
      l?.area,
      l?.areaSize,
      l?.area_in_sqm
    );
  };

  const getBedrooms = (l) =>
    pick(
      l?.residential?.bedrooms,
      l?.bedrooms,
      l?.beds,
      l?.numBedrooms,
      l?.rooms
    );

  const getBathrooms = (l) =>
    pick(
      l?.residential?.bathrooms,
      l?.bathrooms,
      l?.baths,
      l?.numBathrooms,
      l?.toilets,
      l?.wc
    );

  const getParking = (l) => {
    // Residential: boolean; Commercial: parkingSpots > 0
    const res = pick(
      l?.residential?.parking,
      l?.parking,
      l?.hasParking,
      l?.parkingAvailable
    );
    if (res !== undefined && res !== null && res !== "") return asBool(res);
    const spots = pick(l?.commercial?.parkingSpots);
    return spots != null ? Number(spots) > 0 : false;
  };

  const getFurnished = (l) =>
    asBool(
      pick(
        l?.residential?.furnished,
        l?.furnished,
        l?.isFurnished,
        l?.furnishing,
        l?.furnished_status
      )
    );

  const getAddress = (l) =>
    pick(
      l?.address,
      [l?.street, l?.houseNo, l?.district, l?.city, l?.governorate]
        .filter(Boolean)
        .join(", "),
      [l?.areaName, l?.cityName, l?.governorateName].filter(Boolean).join(", ")
    );

  const getGovSlug = (l) =>
    pick(
      l?.location?.governorate?.slug,
      l?.governorate?.slug,
      l?.location?.governorateSlug,
      l?.governorateSlug,
      l?.governorate
    );
  const getCitySlug = (l) =>
    pick(
      l?.location?.city?.slug,
      l?.city?.slug,
      l?.location?.citySlug,
      l?.citySlug,
      l?.city
    );

  // --- New helpers for category-specific fields ---
  const getCategory = (l) => {
    const c = l?.category ? String(l.category).toLowerCase().trim() : "";
    const allowed = [
      "apartment",
      "villa",
      "duplex",
      "studio",
      "land",
      "shop",
      "office",
      "warehouse",
      "building",
      "other",
    ];
    return allowed.includes(c) ? c : "other";
  };

  // Residential-only extras
  const getFloor = (l) => pick(l?.residential?.floor, l?.floor);
  const getLandArea = (l) =>
    asNum(
      pick(
        l?.building?.landArea, // buildings (and some villas saved here)
        l?.residential?.landArea, // villas if stored under residential
        l?.land?.plotArea, // land listings fallback
        l?.landArea // legacy flat field
      )
    );

  // Land-only (also check commercial frontage, normalize to number)
  const getFrontage = (l) =>
    asNum(pick(l?.commercial?.frontage, l?.land?.frontage, l?.frontage));
  const getZoning = (l) => pick(l?.land?.zoning, l?.zoning);
  const getCornerLot = (l) => asBool(pick(l?.land?.cornerLot, l?.cornerLot));

  // Commercial-only
  const getLicenseType = (l) =>
    pick(l?.commercial?.licenseType, l?.licenseType);
  const getHasMezz = (l) => asBool(pick(l?.commercial?.hasMezz, l?.hasMezz));
  const getParkingSpots = (l) =>
    asNum(pick(l?.commercial?.parkingSpots, l?.parkingSpots));

  // Building-only
  const getTotalFloors = (l) =>
    asNum(pick(l?.building?.totalFloors, l?.totalFloors));
  const getTotalUnits = (l) =>
    asNum(pick(l?.building?.totalUnits, l?.totalUnits));
  const getElevator = (l) => asBool(pick(l?.building?.elevator, l?.elevator));
  const getBuildYear = (l) => asNum(pick(l?.building?.buildYear, l?.buildYear));

  const toTitle = (s) =>
    String(s || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const getPurpose = (l) => {
    const p = String(l?.purpose || "")
      .toLowerCase()
      .trim();
    return p === "rent" || p === "sale" ? p : "";
  };
  const getNegotiable = (l) => asBool(l?.negotiable);
  // --- Always-render formatters ---
  const fmtNum = (v, unit = "") =>
    v !== undefined ? `${Number(v).toLocaleString()}${unit}` : "N/A";
  const fmtYesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "N/A");
  const fmtText = (v) =>
    v !== undefined && v !== null && String(v).trim() !== ""
      ? String(v)
      : "N/A";

  SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);
  const params = useParams();
  const { createdId } = params;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarQuery, setSimilarQuery] = useState("");
  const [owner, setOwner] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const phone = listing?.contact?.phone || "";
  const waEnabled = listing?.contact?.whatsapp !== false;
  const msg = encodeURIComponent(
    `${t("listing.hello")} - ${listing?.title || ""}`
  );
  const waLink = `https://wa.me/${phone.replace(/^\+/, "")}?text=${msg}`;

  // compute id as string for favorites
  const listingId = String(listing?._id || "");

  // Support both possible slice mounts (favorites or user.favorites)
  const isFavorite = useSelector((s) => {
    const fs = s.favorites || s.user?.favorites || {};
    if (fs?.lookup && typeof fs.lookup === "object") {
      return Boolean(fs.lookup[listingId]);
    }
    return Array.isArray(fs.ids) && fs.ids.includes(listingId);
  });

  const onHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!listingId) return;
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    const wasFavorite = Boolean(isFavorite);
    // optimistic update
    dispatch(localToggle(listingId));
    try {
      await dispatch(toggleFavoriteAsync({ listingId, wasFavorite })).unwrap();
    } catch (err) {
      dispatch(rollbackToggle(listingId));
      if (err?.unauthorized) {
        navigate("/signin");
      }
    }
  };
  const handleDelete = async () => {
    if (!listing?._id) return;
    const ok = window.confirm("Delete this listing?");
    if (!ok) return;
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        "";
      const res = await fetch(`${API}/listings/delete/${listing._id}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      // Navigate away after delete; simple redirect for now
      window.location.href = "/";
    } catch (err) {
      alert(err.message || "Failed to delete listing");
    }
  };
  const fetchSimilar = async (item) => {
    try {
      if (!item) return;
      const purpose = getPurpose(item);
      const category = getCategory(item);
      const gov = getGovSlug(item);
      const city = getCitySlug(item);

      const params = new URLSearchParams();
      if (purpose) params.set("purpose", purpose);
      if (category) params.set("category", category);
      if (gov) params.set("gov", gov);
      if (city) params.set("city", city);
      params.set("sort", "createdAt");
      params.set("order", "desc");
      params.set("limit", "12"); // fetch more, filter client-side

      const query = params.toString();
      setSimilarQuery(query.replace(/(&|^)limit=\d+/, "").replace(/^&/, ""));
      setSimilarLoading(true);
      const res = await fetch(`${API}/listings/get?${query}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.results || [];
      const currentId = String(item?._id || "");
      const filtered = list.filter(
        (x) => String(x?._id || x?.id || "") !== currentId
      );
      setSimilar(filtered.slice(0, 3));
    } catch (e) {
      console.error("Failed to load similar listings", e);
      setSimilar([]);
    } finally {
      setSimilarLoading(false);
    }
  };
  const fetchOwner = async (userId) => {
    if (!userId) return;
    try {
      setOwnerLoading(true);
      const res = await fetch(`${API}/user/public/${userId}`);
      if (!res.ok) throw new Error("Owner not available");
      const data = await res.json();
      setOwner(data || null);
    } catch (e) {
      console.warn("Failed to load owner info", e);
      setOwner(null);
    } finally {
      setOwnerLoading(false);
    }
  };

  const translateLicenseType = (rawValue) => {
    const key = String(rawValue || "")
      .toLowerCase()
      .trim();
    if (!key) {
      return "N/A";
    }
    return t(`createListing.options.licenseType.${key}`, {
      defaultValue: fmtText(rawValue) || "N/A",
    });
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        if (!createdId) {
          setError(true);
          setLoading(false);
          console.error("No createdId found in route params");
          return;
        }
        setLoading(true);
        const res = await fetch(`${API}/listings/get/${createdId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          console.error("Error fetching listings:", data.message);
          return;
        }
        setListing(data);
        fetchSimilar(data);
        fetchOwner(data?.userRef);
        try {
          console.log("[Listing] payload keys:", Object.keys(data));
        } catch (_) {}
        setLoading(false);
        setError(false);
      } catch (error) {
        setError(true);
        setLoading(false);
        console.error("Error fetching listings:", error);
      }
    };
    fetchListings();
  }, [createdId]);
  if (loading) {
    return (
      <p className="text-center mt-20 text-2xl font-semibold">{t("loading")}</p>
    );
  }
  if (error) {
    return (
      <p className="text-center mt-20 text-2xl font-semibold">
        {t("errorLoading")}
      </p>
    );
  }
  return (
    <main className="min-h-screen bg-white pt-8 pb-16 max-w-7xl mx-auto">
      {listing && (
        <div className=" mx-auto p-4 ">
          {listing.images && listing.images.length > 0 && (
            <div className="relative">
              <Swiper
                spaceBetween={10}
                navigation
                pagination={{ clickable: true }}
                scrollbar={{ draggable: true }}
              >
                {listing.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={image}
                      alt={listing.title}
                      className="w-full h-[550px] object-cover rounded"
                      onError={(e) => {
                        if (
                          e.currentTarget.src !==
                          window.location.origin + "/placeholder.jpg"
                        ) {
                          e.currentTarget.src = "/placeholder.jpg";
                        }
                      }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="absolute top-4 right-4 flex gap-3 z-20">
                <button
                  onClick={onHeartClick}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-md transition cursor-pointer"
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <FaHeart
                    className={`size-5 ${
                      isFavorite ? "text-red-600" : "text-gray-400"
                    }`}
                  />
                </button>
                <button
                  className="bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-md transition cursor-pointer"
                  title="Share"
                >
                  <FaShare className="text-blue-600 size-5" />
                </button>
              </div>
            </div>
          )}
          <div className=" my-6 gap-8">
            <h1 className="text-3xl font-bold mb-2 ">{listing.title}</h1>
            <div className="flex items-center gap-3 mb-2">
              {getPurpose(listing) && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    getPurpose(listing) === "rent"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {getPurpose(listing) === "rent"
                    ? t("listing.forRent")
                    : t("listing.forSale")}
                </span>
              )}
              {getCategory(listing) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                  {toTitle(
                    t(
                      `listing.propertyTypes.${getCategory(
                        listing
                      )?.toLowerCase()}`,
                      {
                        defaultValue: t("listing.propertyTypes.other"),
                      }
                    )
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-semibold text-gray-600">
                {getPrice(listing) !== undefined
                  ? `${getPrice(listing).toLocaleString()} ${t(
                      "listing.price"
                    )}`
                  : "Price on request"}
              </p>
              {getNegotiable(listing) && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                  {t("listing.negotiable")}
                </span>
              )}
            </div>
          </div>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              {t("listing.propertyDetails")}
            </h2>
            <ul className="flex flex-wrap gap-4 text-lg">
              {/* Always show location and date */}
              <li className="text-blue-600 ">
                <FaMapMarkerAlt className="inline-block mx-1" />
                {t("listing.location")}: {getDisplayAddress(listing) || "N/A"}
              </li>
              <li className="text-blue-600">
                <FaCalendarAlt className="inline-block mx-1" />
                {t("listing.listedOn")}:{" "}
                {listing.createdAt
                  ? new Date(listing.createdAt).toLocaleDateString()
                  : "N/A"}
              </li>
              <li className="text-blue-600">
                {t("search.purpose")}:{" "}
                {getPurpose(listing) === "rent"
                  ? t("listing.forRent")
                  : getPurpose(listing) === "sale"
                  ? t("listing.forSale")
                  : "N/A"}
              </li>
              <li className="text-blue-600">
                {t("listing.type")}:{" "}
                {toTitle(
                  t(
                    `listing.propertyTypes.${getCategory(
                      listing
                    ).toLowerCase()}` || "listing.propertyTypes.other"
                  )
                )}
              </li>

              {/* Category-specific blocks */}
              {(() => {
                const cat = getCategory(listing);

                if (["apartment", "duplex", "studio"].includes(cat)) {
                  return (
                    <>
                      <li className="text-blue-600">
                        <FaRulerCombined className="inline-block mx-1" />
                        {t("listing.size")}:{" "}
                        {fmtNum(getSize(listing), " " + t("listing.sizeUnit"))}
                      </li>
                      <li className="text-blue-600">
                        <FaBed className="inline-block mx-1" />
                        {t("listing.beds")}: {fmtNum(getBedrooms(listing))}
                      </li>
                      <li className="text-blue-600">
                        <FaBath className="inline-block mx-1" />
                        {t("listing.baths")}: {fmtNum(getBathrooms(listing))}
                      </li>
                      <li className="text-blue-600">
                        <FaChair className="inline-block mx-1" />
                        {t("listing.furnished")}:{" "}
                        {fmtYesNo(getFurnished(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getFurnished(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>
                      <li className="text-blue-600">
                        <FaParking className="inline-block mx-1" />
                        {t("listing.parking")}:{" "}
                        {fmtYesNo(getParking(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getParking(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.floor")}: {fmtNum(getFloor(listing))}
                      </li>
                    </>
                  );
                }

                if (cat === "villa" || cat === "فيلا") {
                  return (
                    <>
                      <li className="text-blue-600">
                        <FaRulerCombined className="inline-block mx-1" />
                        {t("listing.size")}:{" "}
                        {fmtNum(getSize(listing), " " + t("listing.sizeUnit"))}
                      </li>
                      <li className="text-blue-600">
                        <FaBed className="inline-block mx-1" />
                        {t("listing.beds")}: {fmtNum(getBedrooms(listing))}
                      </li>
                      <li className="text-blue-600">
                        <FaBath className="inline-block mx-1" />
                        {t("listing.baths")}: {fmtNum(getBathrooms(listing))}
                      </li>
                      <li className="text-blue-600">
                        <FaChair className="inline-block mx-1" />
                        {t("listing.furnished")}:{" "}
                        {fmtYesNo(getFurnished(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getFurnished(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>
                      <li className="text-blue-600">
                        <FaParking className="inline-block mx-1" />
                        {t("listing.parking")}:{" "}
                        {fmtYesNo(getParking(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getParking(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.landArea")}:{" "}
                        {fmtNum(
                          getLandArea(listing),
                          " " + t("listing.sizeUnit")
                        )}
                      </li>
                    </>
                  );
                }

                if (cat === "land" || cat === "أرض") {
                  return (
                    <>
                      <li className="text-blue-600">
                        <FaRulerCombined className="inline-block mx-1" />
                        {t("listing.plotArea")}:{" "}
                        {fmtNum(getSize(listing), " " + t("listing.sizeUnit"))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.frontage")}:{" "}
                        {fmtNum(getFrontage(listing), " " + t("listing.meter"))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.zoning")}:{" "}
                        {t(
                          `listing.zoningTypes.${String(
                            getZoning(listing) || ""
                          )
                            .toLowerCase()
                            .trim()}`,
                          { defaultValue: "N/A" }
                        )}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.cornerLot")}:{" "}
                        {fmtYesNo(getCornerLot(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getCornerLot(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>
                    </>
                  );
                }

                if (["shop", "warehouse"].includes(cat)) {
                  return (
                    <>
                      <li className="text-blue-600">
                        <FaRulerCombined className="inline-block mx-2" />
                        {t("listing.size")}:{" "}
                        {fmtNum(getSize(listing), " " + t("listing.sizeUnit"))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.frontage")}:{" "}
                        {fmtNum(getFrontage(listing), " " + t("listing.meter"))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.license")}:{" "}
                        {translateLicenseType(getLicenseType(listing))}
                      </li>

                      <li className="text-blue-600">
                        {t("listing.mezzanine")}:{" "}
                        {fmtYesNo(getHasMezz(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getHasMezz(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>

                      <li className="text-blue-600">
                        {t("listing.parkingSpots")}:{" "}
                        {fmtNum(getParkingSpots(listing))}
                      </li>
                    </>
                  );
                }

                if (cat === "office") {
                  return (
                    <>
                      <li className="text-blue-600">
                        <FaRulerCombined className="inline-block mx-1" />
                        {t("listing.floorArea")}:{" "}
                        {fmtNum(getSize(listing), " " + t("listing.sizeUnit"))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.license")}:{" "}
                        {fmtText(getLicenseType(listing))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.parkingSpots")}:{" "}
                        {fmtNum(getParkingSpots(listing))}
                      </li>
                    </>
                  );
                }

                if (cat === "building") {
                  return (
                    <>
                      <li className="text-blue-600">
                        {t("listing.totalFloors")}:{" "}
                        {fmtNum(getTotalFloors(listing))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.totalUnits")}:{" "}
                        {fmtNum(getTotalUnits(listing))}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.elevator")}:{" "}
                        {fmtYesNo(getElevator(listing)) === "Yes"
                          ? t("listing.yes")
                          : fmtYesNo(getElevator(listing)) === "No"
                          ? t("listing.no")
                          : "N/A"}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.landArea")}:{" "}
                        {fmtNum(
                          getLandArea(listing),
                          " " + t("listing.sizeUnit")
                        )}
                      </li>
                      <li className="text-blue-600">
                        {t("listing.buildYear")}:{" "}
                        {fmtNum(getBuildYear(listing))}
                      </li>
                    </>
                  );
                }

                // Generic fallback for unknown/other categories
                return (
                  <>
                    <li className="text-blue-600">
                      <FaRulerCombined className="inline-block mx-1" />
                      {t("listing.size")}:{" "}
                      {fmtNum(getSize(listing), " " + t("listing.sizeUnit"))}
                    </li>
                    <li className="text-blue-600">
                      <FaBed className="inline-block mx-1" />
                      {t("listing.beds")}: {fmtNum(getBedrooms(listing))}
                    </li>
                    <li className="text-blue-600">
                      <FaBath className="inline-block mx-1" />
                      {t("listing.baths")}: {fmtNum(getBathrooms(listing))}
                    </li>
                    <li className="text-blue-600">
                      {t("listing.floor")}: {fmtNum(getFloor(listing))}
                    </li>
                    <li className="text-blue-600">
                      {t("listing.parking")}:{" "}
                      {fmtYesNo(getParking(listing)) === "Yes"
                        ? t("listing.yes")
                        : fmtYesNo(getParking(listing)) === "No"
                        ? t("listing.no")
                        : "N/A"}
                    </li>
                    <li className="text-blue-600">
                      {t("listing.landArea")}:{" "}
                      {fmtNum(
                        getLandArea(listing),
                        " " + t("listing.sizeUnit")
                      )}
                    </li>
                    <li className="text-blue-600">
                      {t("listing.frontage")}:{" "}
                      {fmtNum(getFrontage(listing), " " + t("listing.meter"))}
                    </li>
                    <li className="text-blue-600">
                      {t("listing.license")}: {fmtText(getLicenseType(listing))}
                    </li>
                  </>
                );
              })()}
            </ul>
          </section>
          <div className="text-lg space-y-2 mb-6">
            <p className="text-gray-700 flex flex-col">
              <strong className="inline-block mr-2">
                {t("listing.description")}:
              </strong>
            </p>
            <p>{listing.description}</p>
          </div>
          {currentUser ? (
            String(listing.userRef) === String(currentUser._id) ? (
              // Owner view: Edit / Delete buttons
              <div className="mt-6 flex gap-4">
                <Link
                  to={`/update-listing/${listing._id}`}
                  className="px-9 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:opacity-90 cursor-pointer"
                >
                  {t("listing.edit")}
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:opacity-90 cursor-pointer"
                >
                  {t("listing.delete")}
                </button>
              </div>
            ) : (
              // Non-owner view: interaction icons
              <ul className="flex gap-2">
                {phone && (
                  <li>
                    <a
                      className="btn bg-blue-700 text-white hover:bg-blue-800 rounded-lg cursor-pointer py-4 px-6 transition"
                      href={`tel:${phone}`}
                    >
                      {t("listing.callSeller")}
                    </a>
                  </li>
                )}
                {waEnabled && phone && (
                  <li>
                    <a
                      className="btn rounded-lg bg-green-600 text-white hover:bg-green-700 px-6 py-4 transition"
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("listing.contactWhatsApp")}
                    </a>
                  </li>
                )}
              </ul>
            )
          ) : null}

          {/* Similar Listings */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                {t("listing.similarListings")}
              </h2>
              <Link
                to={`/search?${similarQuery}`}
                className="text-blue-700 hover:underline text-sm"
              >
                {t("search.showMoreListings")}
              </Link>
            </div>

            {similarLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[220px] w-full bg-slate-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : similar.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {t("listing.noSimilarListings")}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((l) => (
                  <ListingItems key={l._id || l.id} listing={l} />
                ))}
              </div>
            )}
          </section>

          {/* Listed By (owner) */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {t("listing.listedBy")}
            </h2>

            {ownerLoading ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                <div className="w-14 h-14 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ) : !owner ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                <img
                  src={
                    "https://static.vecteezy.com/system/resources/thumbnails/009/734/564/small_2x/default-avatar-profile-icon-of-social-media-user-vector.jpg"
                  }
                  alt="Owner avatar"
                  className="w-14 h-14 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {t("listing.seller")}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t("listing.member")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/search?userRef=${listing?.userRef || ""}`}
                    className="text-blue-700 hover:underline text-sm"
                  >
                    {t("listing.seeMoreFromThisSeller")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                <img
                  src={owner?.avatar}
                  alt={owner?.username || owner?.name || "Owner avatar"}
                  className="w-14 h-14 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {owner?.username || owner?.name || t("listing.seller")}
                  </p>
                  <p className="text-sm text-slate-500">
                    {owner?.createdAt
                      ? `${t("listing.memberSince")} ${new Date(
                          owner.createdAt
                        ).toLocaleDateString()}`
                      : t("listing.member")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/search?userRef=${listing?.userRef || ""}`}
                    className="text-blue-700 hover:underline text-sm"
                  >
                    {t("listing.seeMoreFromThisSeller")}
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default Listing;
