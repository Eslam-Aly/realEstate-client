import { useEffect } from "react";
import { useParams } from "react-router-dom";
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
} from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";
function Listing() {
  SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);
  const params = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useSelector((state) => state.user);
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(`/api/listings/get/${params.listingId}`);
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
  }, [params.listingId]);
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
    <main className="min-h-screen bg-white pt-8 pb-16">
      {listing && (
        <div className=" mx-auto p-4 ">
          {listing.images && listing.images.length > 0 && (
            <Swiper
              spaceBetween={10}
              navigation
              pagination={{ clickable: true }}
              scrollbar={{ draggable: true }}
              onSwiper={(swiper) => console.log(swiper)}
              onSlideChange={() => console.log("slide change")}
            >
              {listing.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={image}
                    alt={listing.title}
                    className="w-full h-[550px] object-cover rounded"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
          <div className=" my-6 gap-8">
            <h1 className="text-3xl font-bold mb-4 ">{listing.title}</h1>
            <p className="text-2xl font-semibold text-gray-600">
              ${listing.regularPrice}
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
          </ul>
          <div className="text-lg space-y-2">
            <p className="text-gray-700 flex flex-col">
              <strong className="inline-block mr-2">Description:</strong>
            </p>
            <p>{listing.description}</p>
          </div>
          {currentUser && listing.userRef !== currentUser._id && (
            <div className="mt-6 flex gap-4">
              <button>
                <LuMessageCircleMore className="text-blue-600 size-6 inline-block" />
              </button>
              <button>
                <FaRegHeart className="size-6 inline-block" />
              </button>
              <button>
                <FaShare className="text-blue-600 size-6 inline-block" />
              </button>
              <button>
                <FaPhone className="text-green-600 size-6 inline-block" />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default Listing;
