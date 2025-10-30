import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ListingItems from "../components/ListingItems.jsx";
import API from "../../api/index.js";

/**
 * Lists the current user's saved listings. Anonymous visitors are redirected
 * to the sign-in screen before the fetch ever runs.
 */
export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setL] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useSelector((s) => s.user);

  useEffect(() => {
    if (!currentUser) {
      navigate("/signin", { replace: true });
      return;
    }
    let alive = true;
    // Fetch the current user's favourites (up to 24 cards at a time).
    (async () => {
      try {
        setL(true);
        const res = await fetch(`${API}/favorites?limit=24`, {
          credentials: "include",
        });
        if (res.status === 401) {
          if (alive) navigate("/signin", { replace: true });
          return;
        }
        const data = await res.json();
        if (alive) setItems(Array.isArray(data?.results) ? data.results : []);
      } finally {
        if (alive) setL(false);
      }
    })();
    return () => {
      // Prevent state updates once the component has unmounted.
      alive = false;
    };
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-slate-500 text-lg">
        Loading your favorites…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600">
        <h2 className="text-2xl font-semibold mb-2">No Favorites Yet ❤️</h2>
        <p className="text-slate-500 text-center max-w-md">
          You haven’t added any listings to your favorites yet. Explore listings
          and click the heart icon to save your favorite ones!
        </p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Your Favorite Listings ❤️
        </h1>
        <span className="text-slate-500 text-sm">
          Showing {items.length} {items.length === 1 ? "listing" : "listings"}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ">
        {items.map((l) => (
          <ListingItems key={l._id || l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
