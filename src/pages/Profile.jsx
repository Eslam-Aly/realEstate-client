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

  useEffect(() => {
    if (file) {
      console.log(file);
      handleFileUpload(file);
    }
  }, [file]);

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
    try {
      const res = await fetch(`/api/listings/delete/${listingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        alert("Error deleting listing");
        return;
      }
      setShowListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
    } catch (error) {
      alert("Error deleting listing");
    }
  };
  return (
    <div>
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
        <div className="relative w-26 h-26 mx-auto">
          <img
            src={formData.avatar || currentUser.avatar}
            alt="avatar"
            className=" rounded-full  object-cover"
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
          to="/create-listing"
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
        <button
          onClick={handleShowListings}
          className="  text-green-600 p-3 rounded-lg font-semibold hover:underline transition cursor-pointer"
        >
          Show Listings
        </button>
      </div>
      {showListingsError && (
        <p className="text-red-500 text-center mt-5 max-w-lg mx-auto">
          Error fetching listings
        </p>
      )}
      {showListings.length > 0 &&
        showListings.map((listing) => (
          <div
            key={listing._id}
            className="mt-5 max-w-lg mx-auto border p-4 rounded-lg space-y-4"
          >
            <a
              href={`/listing/${listing._id}`}
              className="text-lg font-semibold hover:underline block"
            >
              {listing.title}
            </a>
            <img
              src={listing.images[0]}
              alt="listing image"
              className="w-full h-64 object-cover rounded-md"
            />

            <div className=" flex justify-between">
              <button
                onClick={() => handleDeleteListing(listing._id)}
                className="text-white hover:bg-red-500 w-24 h-10 bg-red-600 rounded-lg cursor-pointer"
              >
                Delete
              </button>
              <Link to={`/update-listing/${listing._id}`}>
                <button className="text-white hover:bg-blue-500 w-24 h-10 bg-blue-600 rounded-lg cursor-pointer">
                  Edit
                </button>
              </Link>
            </div>
          </div>
        ))}
    </div>
  );
}

export default Profile;
