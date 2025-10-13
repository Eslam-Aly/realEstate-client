import { set } from "mongoose";
import { useState, useRef, useEffect } from "react";
import { app } from "../firebase.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";

function UpdateListing() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState([]);
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const currentUser = useSelector((state) => state.user.currentUser);
  const params = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    regularPrice: "",
    discountedPrice: "",
    bedrooms: "",
    bathrooms: "",
    parking: false,
    furnished: false,
    images: [],
    type: "",
    offer: false,
    userRef: currentUser._id,
  });

  useEffect(() => {
    const fetchListingData = async () => {
      const listingId = params.listingId;
      console.log("Listing ID:", listingId);
      try {
        const res = await fetch(`/api/listings/get/${listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message);
        } else {
          setFormData(data);
        }
      } catch (error) {
        console.error("Error fetching listing data:", error);
      }
    };

    fetchListingData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearFileInput = () => {
    setFile([]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleImageSubmit = (e) => {
    if (file.length > 0 && file.length + formData.images.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      setUploadProgress(0);
      const promises = [];
      for (let i = 0; i < file.length; i++) {
        promises.push(storeImage(file[i]));
      }
      Promise.all(promises)
        .then((images) => {
          setFormData({ ...formData, images: formData.images.concat(images) });
          setImageUploadError(false);
          setUploading(false);
          setUploadProgress(0);
          clearFileInput(); // Clear input after successful upload
        })
        .catch((err) => {
          setImageUploadError("Image upload failed (2 mb max per image)");
          setUploading(false);
          setUploadProgress(0);
          clearFileInput(); // Clear input after error
        });
    } else if (file.length === 0) {
      setImageUploadError("Please select at least one image to upload");
      setUploading(false);
      clearFileInput();
    } else if (file.length > 6) {
      setImageUploadError("You can only select up to 6 images at once");
      setUploading(false);
      clearFileInput();
    } else {
      const remainingSlots = 6 - formData.images.length;
      setImageUploadError(
        `You can only upload ${remainingSlots} more image(s). You already have ${formData.images.length} image(s)`
      );
      setUploading(false);
      clearFileInput();
    }
  };
  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = `${currentUser._id}-${file.name}-${uuidv4()}`;
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
          setImageUploadError(false);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
            setLoading(false);
          });
        }
      );
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/listings/update/${params.listingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success === false) {
        setError(data.message);
      }
      navigate(`/api/listings/get/${params.listingId}`);
    } catch (error) {
      setError(error.message);
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border border-gray-300 rounded-lg shadow-lg flex flex-col gap-4 items-center">
      <h1 className="text-4xl font-semibold mb-4">Update Listing</h1>
      <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <select
            className="border p-3 rounded-lg"
            name="type"
            onChange={handleChange}
            value={formData.type}
            required
          >
            <option className="hidden" value="">
              Select Type
            </option>
            <option className="hidden" value="apartmentRent">
              Apartment for rent
            </option>
            <option className="hidden" value="apartmentSale">
              Apartment for sale
            </option>
            <option className="hidden" value="villaRent">
              Villa for rent
            </option>
            <option className="hidden" value="villaSale">
              Villa for sale
            </option>
            <option className="hidden" value="other">
              Other
            </option>
          </select>
          <input
            required
            value={formData.title}
            className="border p-3 rounded-lg"
            type="text"
            name="title"
            placeholder="Title"
            onChange={handleChange}
          />
          <input
            required
            value={formData.address}
            className="border p-3 rounded-lg"
            type="text"
            name="address"
            placeholder="Address"
            onChange={handleChange}
          />
          <textarea
            required
            value={formData.description}
            className="border p-3 rounded-lg"
            name="description"
            placeholder="Description"
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            required
            value={formData.regularPrice}
            className="border p-3 rounded-lg"
            type="number"
            name="regularPrice"
            placeholder="Regular Price"
            onChange={handleChange}
          />
          <input
            value={formData.discountedPrice}
            className="border p-3 rounded-lg"
            type="number"
            name="discountedPrice"
            placeholder="Discounted Price"
            onChange={handleChange}
          />
          <input
            required
            value={formData.bedrooms}
            className="border p-3 rounded-lg"
            type="number"
            name="bedrooms"
            placeholder="Bedrooms"
            onChange={handleChange}
          />
          <input
            required
            value={formData.bathrooms}
            className="border p-3 rounded-lg"
            type="number"
            name="bathrooms"
            placeholder="Bathrooms"
            onChange={handleChange}
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            Parking:
            <input
              checked={formData.parking}
              type="checkbox"
              name="parking"
              onChange={handleChange}
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            Furnished:
            <input
              checked={formData.furnished}
              type="checkbox"
              name="furnished"
              onChange={handleChange}
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            Offer:
            <input
              checked={formData.offer}
              className="cursor-pointer"
              type="checkbox"
              name="offer"
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="flex flex- gap-2 ">
          <input
            ref={fileRef}
            className="border p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            type="file"
            name="images"
            multiple
            accept="image/*"
            onChange={(e) => setFile(e.target.files)}
          />
          <button
            disabled={uploading}
            onClick={handleImageSubmit}
            type="button"
            className="bg-green-600 text-white p-2 rounded-lg font-semibold hover:bg-green-500 transition cursor-pointer w-1/3 disabled:opacity-80"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {uploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-sm text-center mt-1">
              {uploadProgress}% uploaded
            </p>
          </div>
        )}
        {imageUploadError && (
          <p className="text-red-700 text-sm">{imageUploadError}</p>
        )}
        {formData.images.length > 0 &&
          formData.images.map((url, index) => (
            <div
              key={url}
              className="flex justify-between p-3 border items-center"
            >
              <img
                src={url}
                alt="listing"
                className="w-20 h-20 object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75"
              >
                Delete
              </button>
            </div>
          ))}
        <button
          disabled={uploading || loading}
          className="bg-blue-600 text-white p-3  rounded-lg font-semibold hover:bg-blue-500 transition cursor-pointer"
          type="submit"
        >
          {loading ? "Updating..." : "Update Listing"}
        </button>
        {error && <p className="text-red-700 text-sm">{error}</p>}
      </form>
    </div>
  );
}

export default UpdateListing;
