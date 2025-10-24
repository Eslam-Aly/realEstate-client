import { useSelector } from "react-redux";
import { useRef, useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase.js";
import {
  updateUserSuccess,
  updateUserFaliure,
  updateUserStart,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFaliure,
  signOutStart,
  signOutSuccess,
  signOutFaliure,
} from "../redux/user/userSlice.js";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import ListingItems from "../components/ListingItems.jsx";

function Profile() {
  const dispatch = useDispatch();
  const [file, setFile] = useState(undefined);
  const fileRef = useRef(null);
  const currentUser = useSelector((state) => state.user.currentUser);
  const { loading, error } = useSelector((state) => state.user);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingsError, setShowListingsError] = useState(false);
  const [showListings, setShowListings] = useState([]);
  const [favPreview, setFavPreview] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState("");

  useEffect(() => {
    if (file) {
      console.log(file);
      handleFileUpload(file);
    }
  }, [file]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setFavLoading(true);
        setFavError("");
        const res = await fetch(`/api/favorites?limit=6`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Favorites fetch failed (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.results || [];
        if (alive) setFavPreview(list);
      } catch (e) {
        if (alive) setFavError(e.message || "Failed to load favorites");
      } finally {
        if (alive) setFavLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;
    handleShowListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  const authHeaders = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        const percent = Math.round(progress);
        console.log("Upload is " + percent + "% done");
        setUploadProgress(percent);
        setUploadStatus(`Uploading... ${percent}%`);
      },
      (error) => {
        setFileUploadError(true);
        setUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, avatar: downloadURL });
          setUploadProgress(null);
          setUploadStatus("File uploaded successfully.");
        });
      }
    );
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFaliure(data.message));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFaliure(error.message));
    }
  };
  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFaliure(data.message));
        return;
      }
      dispatch(deleteUserSuccess());
    } catch (error) {
      dispatch(deleteUserFaliure(error.message));
    }
  };
  const handleSignOut = async () => {
    try {
      dispatch(signOutStart());
      const res = await fetch(`/api/auth/signout`);
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutFaliure(data.message));
        return;
      }
      dispatch(signOutSuccess());
    } catch (error) {
      dispatch(signOutFaliure(error.message));
    }
  };
  const handleShowListings = async () => {
    try {
      setShowListingsError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      console.log(res);
      console.log(currentUser._id);
      const data = await res.json();
      if (data.success === false) {
        setShowListingsError(true);
        return;
      }
      setShowListings(data);
    } catch (error) {
      setShowListingsError(true);
    }
  };
  const handleDeleteListing = async (listingId) => {
    const ok = window.confirm("Delete this listing?");
    if (!ok) return;
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        "";
      const res = await fetch(`/api/listings/delete/${listingId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Delete failed");
      }
      setShowListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
    } catch (error) {
      alert(error.message || "Error deleting listing");
    }
  };

  return (
    <div className="pb-12">
      <h1 className="text-3xl text-center font-semibold my-7">Profile</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto mt-16 p-6 rounded-lg shadow-lg flex flex-col gap-5"
      >
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          ref={fileRef}
          hidden
          accept="image/*"
        />
        <div className="relative mx-auto w-28 h-28">
          <img
            src={formData.avatar || currentUser.avatar}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover ring-1 ring-slate-200"
          />
          <button
            type="button"
            className="absolute left-[60%] top-[60%] bg-gray-200 p-2 rounded-full cursor-pointer hover:bg-gray-300 transition"
            onClick={(e) => {
              e.preventDefault();
              fileRef.current.click();
            }}
          >
            <FaCamera />
          </button>
        </div>
        {uploadProgress !== null && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        {uploadStatus && (
          <p className="text-sm text-center mt-2 text-gray-600">
            {uploadStatus}
          </p>
        )}
        <input
          type="username"
          defaultValue={currentUser.username}
          id="username"
          placeholder="username"
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="email"
          id="email"
          defaultValue={currentUser.email}
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="password"
          id="password"
          defaultValue={currentUser.password}
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />
        <button
          disabled={loading}
          type="submit"
          className="bg-blue-800 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-80"
        >
          {loading ? "Loading..." : "Update Profile"}
        </button>
        <Link
          className="text-white bg-green-600 p-3 rounded-lg font-semibold text-center hover:bg-green-500 transition cursor-pointer"
          to="/createlistingform"
        >
          Create Listing
        </Link>
      </form>
      {error && (
        <p className="text-red-500 text-center mt-5 max-w-lg mx-auto">
          {error}
        </p>
      )}
      {updateSuccess && (
        <p className="text-green-500 text-center mt-5 max-w-lg mx-auto">
          User updated successfully!
        </p>
      )}
      <div className="mt-4 flex justify-between max-w-lg mx-auto text-red-600">
        <button
          onClick={handleDeleteUser}
          className="hover:underline cursor-pointer"
        >
          Delete Account
        </button>
        <button
          onClick={handleSignOut}
          className="hover:underline cursor-pointer"
        >
          Sign Out
        </button>
      </div>
      {/* Favorites preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Your Favorites
          </h2>
          <Link
            to="/favorites"
            className="text-blue-700 hover:underline text-sm"
          >
            See all
          </Link>
        </div>

        {favLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] w-full bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : favError ? (
          <p className="text-red-600 text-sm">{favError}</p>
        ) : favPreview.length === 0 ? (
          <p className="text-slate-500 text-sm">You have no favorites yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favPreview.map((l) => (
              <ListingItems key={l._id || l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
      {/* Your Listings grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Your Listings
          </h2>
          <span className="text-slate-500 text-sm">
            {showListings.length}{" "}
            {showListings.length === 1 ? "listing" : "listings"}
          </span>
        </div>

        {showListingsError && (
          <p className="text-red-600 text-sm mb-4">
            Error fetching your listings.
          </p>
        )}

        {showListings.length === 0 ? (
          <p className="text-slate-500 text-sm">
            You haven’t created any listings yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showListings.map((l) => (
              <div key={l._id} className="group">
                <ListingItems listing={l} />
                <div className="mt-2 flex gap-2 w-[94%]">
                  <Link to={`/update-listing/${l._id}`} className="flex-1">
                    <button className="w-full py-2 rounded-md text-white bg-blue-700 hover:bg-blue-600 transition">
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDeleteListing(l._id)}
                    className="flex-1 py-2 rounded-md text-white bg-red-600 hover:bg-red-500 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Profile;
