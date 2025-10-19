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

import {
  FaBath,
  FaBed,
  FaChair,
  FaParking,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaShare,
  FaRegHeart,
  FaPhone,
  FaRulerCombined,
} from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";
function Listing() {
  SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);
  const params = useParams();
  const { createdId } = params;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useSelector((state) => state.user);
  const handleDelete = async () => {
    if (!listing?._id) return;
    const ok = window.confirm("Delete this listing?");
    if (!ok) return;
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        "";
      const res = await fetch(`/api/listings/delete/${listing._id}`, {
        method: "DELETE",
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
        const res = await fetch(`/api/listings/get/${createdId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          console.error("Error fetching listings:", data.message);
          return;
        }
        setListing(data);
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
      <p className="text-center mt-20 text-2xl font-semibold">Loading...</p>
    );
  }
  if (error) {
    return (
      <p className="text-center mt-20 text-2xl font-semibold">
        Error loading listing.
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
                <button className="bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-md transition">
                  <FaRegHeart className="text-red-600 size-5" />
                </button>
                <button className="bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-md transition">
                  <FaShare className="text-blue-600 size-5" />
                </button>
              </div>
            </div>
          )}
          <div className=" my-6 gap-8">
            <h1 className="text-3xl font-bold mb-4 ">{listing.title}</h1>
            <p className="text-2xl font-semibold text-gray-600">
              ${Number(listing.price).toLocaleString()}
            </p>
          </div>

          <ul className="space-y-2 flex flex-row flex-wrap gap-4 text-lg mb-6">
            <li className="text-blue-600">
              <FaBed className="inline-block mr-2" />
              Bedrooms: {listing.bedrooms}
            </li>
            <li className="text-blue-600">
              <FaBath className="inline-block mr-2" />
              Bathrooms: {listing.bathrooms}
            </li>
            <li className="text-blue-600">
              <FaParking className="inline-block mr-2" />
              Parking: {listing.parking ? "Yes" : "No"}
            </li>
            <li className="text-blue-600">
              <FaChair className="inline-block mr-2" />
              Furnished: {listing.furnished ? "Yes" : "No"}
            </li>
            <li className="text-blue-600">
              <FaMapMarkerAlt className="inline-block mr-2" />
              Location: {listing.address || "N/A"}
            </li>
            <li className="text-blue-600">
              <FaCalendarAlt className="inline-block mr-2" />
              Listed on: {new Date(listing.createdAt).toLocaleDateString()}
            </li>
            <li className="text-blue-600">
              <FaRulerCombined className="inline-block mr-2" />
              Size: {listing.size} sqm
            </li>
          </ul>
          <div className="text-lg space-y-2">
            <p className="text-gray-700 flex flex-col">
              <strong className="inline-block mr-2">Description:</strong>
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
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:opacity-90 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ) : (
              // Non-owner view: interaction icons

              <button className=" mt-6 py-4 px-12 rounded-lg bg-blue-600 w-fit text-white flex items-center hover:bg-blue-500 cursor-pointer">
                <span className="pr-4">Contact Seller</span>
                <LuMessageCircleMore className=" size-6 inline-block" />
              </button>
            )
          ) : null}
        </div>
      )}
    </main>
  );
}

export default Listing;
