import { Link } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { FaBed, FaBath, FaRulerCombined } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  localToggle,
  rollbackToggle,
  toggleFavorite as toggleFavoriteAsync,
} from "../redux/user/favoritesSlice.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Listing card used across the app, including the favourites page.
 * Handles optimistic favourite toggling, fallback rendering, and navigation.
 */
function ListingItems({ listing }) {
  const { t, i18n } = useTranslation();
  // Use either `_id` (API) or `id` (legacy cards) so cards remain clickable.
  const id = String(listing?._id || listing?.id || "");

  // Guard component so a missing listing object does not blow up the UI.
  if (!listing || !id) {
    return null;
  }

  // Make sure we always show an image even if the listing has none.
  const img = listing?.images?.[0] || "/placeholder.jpg";

  const category = String(listing?.category || "").toLowerCase();
  const purpose = String(listing?.purpose || "").toLowerCase();
  const price =
    listing?.price !== undefined && listing?.price !== null
      ? Number(listing.price).toLocaleString()
      : null;
  const negotiable = Boolean(listing?.negotiable);

  // helpers
  const pick = (...vals) =>
    vals.find((v) => v !== undefined && v !== null && v !== "");
  const asNum = (v) =>
    v === undefined || v === null || v === "" ? undefined : Number(v);
  const toTitle = (s) =>
    String(s || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // spec values
  const beds = asNum(pick(listing?.residential?.bedrooms, listing?.bedrooms));
  const baths = asNum(
    pick(listing?.residential?.bathrooms, listing?.bathrooms)
  );

  // size by category (simple rules for card)
  const residentialSize = asNum(
    pick(listing?.residential?.size, listing?.other?.size, listing?.size)
  );
  const plotArea = asNum(pick(listing?.land?.plotArea));
  const floorArea = asNum(
    pick(listing?.commercial?.floorArea, listing?.floorArea)
  );
  const buildingLand = asNum(pick(listing?.building?.landArea));

  let sizeValue;
  if (["apartment", "duplex", "studio", "villa"].includes(category))
    sizeValue = residentialSize;
  else if (category === "land") sizeValue = plotArea;
  else if (["shop", "office", "warehouse"].includes(category))
    sizeValue = floorArea;
  else if (category === "building") sizeValue = buildingLand;
  else sizeValue = residentialSize || plotArea || floorArea || buildingLand;

  const sizeText =
    sizeValue !== undefined ? `${Number(sizeValue).toLocaleString()} sqm` : "-";

  // Location helpers align with the detail page so cards switch language too.
  const isAr = i18n.language?.startsWith("ar");
  const getLocalizedName = (obj) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    const name = isAr ? obj?.nameAr || obj?.name : obj?.name || obj?.nameAr;
    return name || "";
  };

  const getDisplayAddress = (l) => {
    const loc = l?.location || {};
    const gov = loc?.governorate;
    const city = loc?.city;
    const area = loc?.area;

    if (city && area) {
      return `${getLocalizedName(city)} - ${getLocalizedName(area)}`.trim();
    }
    if (gov && city) {
      return `${getLocalizedName(gov)} - ${getLocalizedName(city)}`.trim();
    }
    if (city) return getLocalizedName(city);
    if (gov) return getLocalizedName(gov);
    return l?.address || "";
  };

  const displayAddress = getDisplayAddress(listing);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((s) => s.user);
  // Expose favourite status from Redux with a fast lookup fallback.
  const isFavorite = useSelector((s) => {
    const fs = s.favorites || s.user?.favorites || {};
    if (fs?.lookup && typeof fs.lookup === "object") {
      return Boolean(fs.lookup[id]);
    }
    return fs?.ids?.includes?.(id);
  });

  const onHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent parent <Link> navigation
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    const wasFavorite = Boolean(isFavorite);
    // Flip the icon immediately while the network request is in flight.
    dispatch(localToggle(id));
    try {
      // Persist the change on the backend; unwrap throws if the thunk fails.
      await dispatch(
        toggleFavoriteAsync({ listingId: id, wasFavorite })
      ).unwrap();
    } catch (err) {
      // Undo the optimistic change when the API rejects the toggle.
      dispatch(rollbackToggle(id));
      if (err?.unauthorized) {
        navigate("/signin");
      }
    }
  };

  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px] mr-4">
      <Link to={`/listing/${id}`}>
        <div className="relative">
          <img
            src={img}
            alt="listing cover"
            className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              if (e.currentTarget.src !== "/placeholder.jpg") {
                e.currentTarget.src = "/placeholder.jpg";
              }
            }}
          />
          {/* Purpose badge */}
          {purpose && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
                purpose === "rent"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {purpose === "rent" ? t("listing.forRent") : t("listing.forSale")}
            </span>
          )}
          {/* Favorite icon */}
          <button
            onClick={onHeartClick}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 p-2 rounded-full cursor-pointer transition-transform hover:scale-110"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <FaHeart
              className={`h-5 w-5 drop-shadow transition-colors ${
                isFavorite ? "text-red-600" : "text-gray-300"
              }`}
            />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-lg font-semibold text-slate-700">
              {listing?.title || toTitle(category)}
            </p>
            {category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {t(`listing.propertyTypes.${category}`, {
                  defaultValue: toTitle(category),
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-600">
            <MdLocationOn className="h-4 w-4 text-blue-700" />
            <p className="text-sm truncate w-full">{displayAddress || "-"}</p>
          </div>

          <div className="mt-1 font-semibold flex items-center gap-2">
            <p className="text-slate-800">
              {price && `${price} ${t("listing.price")}`}
            </p>
            {negotiable && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                {t("listing.negotiable")}
              </span>
            )}
          </div>

          <div className="mt-1 text-slate-700 flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs font-bold">
              <FaBed className="text-blue-700" />
              <span>
                {beds !== undefined
                  ? `${beds} ${
                      beds === 1 ? t("listing.bed") : t("listing.beds")
                    }`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold">
              <FaBath className="text-blue-700" />
              <span>
                {baths !== undefined
                  ? `${baths} ${
                      baths === 1 ? t("listing.bath") : t("listing.baths")
                    }`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold">
              <FaRulerCombined className="text-blue-700" />
              <span>
                <span>
                  {sizeValue !== undefined
                    ? `${sizeValue} ${t("listing.sizeUnit")}`
                    : "-"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ListingItems;
