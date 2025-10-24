// Ensure you have client/public/placeholder.jpg available; set VITE_DEFAULT_LISTING_IMAGE to override in prod.
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_IMAGE_URL =
  import.meta?.env?.VITE_DEFAULT_LISTING_IMAGE || "/placeholder.jpg";

import { app } from "../firebase.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { useSelector } from "react-redux";

/** 1) Main selectors */
const PURPOSES = ["rent", "sale"];
const CATEGORIES = [
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

/** 2) Field registry (one place to extend) */
const FIELD_DEFS = {
  // shared
  title: { label: "Title", type: "text", required: true },
  address: { label: "Address", type: "location" },
  description: {
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Describe the property, nearby landmarks, terms, etc.",
  },
  price: { label: "Price", type: "number", min: 0, required: true },
  size: { label: "Size (sqm)", type: "number", min: 0 },
  negotiable: { label: "Negotiable", type: "checkbox" },

  // residential-only
  bedrooms: {
    label: "Bedrooms",
    type: "select",
    options: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ],
  },
  bathrooms: {
    label: "Bathrooms",
    type: "select",
    options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  floor: {
    label: "Floor",
    type: "select",
    options: Array.from({ length: 51 }, (_, i) => i),
  },
  furnished: { label: "Furnished", type: "checkbox" },
  parking: { label: "Parking", type: "checkbox" },

  // land-only
  plotArea: {
    label: "Plot Area (sqm)",
    type: "number",
    min: 0,
    required: true,
  },
  frontage: { label: "Frontage (m)", type: "number", min: 0 },
  zoning: {
    label: "Zoning",
    type: "select",
    options: ["residential", "commercial", "agricultural", "industrial"],
  },
  cornerLot: { label: "Corner Lot", type: "checkbox" },

  // commercial-only
  floorArea: {
    label: "Floor Area (sqm)",
    type: "number",
    min: 0,
    required: true,
  },
  licenseType: {
    label: "License Type",
    type: "select",
    options: ["retail", "office", "restaurant", "warehouse", "clinic", "other"],
  },
  hasMezz: { label: "Mezzanine", type: "checkbox" },
  parkingSpots: { label: "Parking Spots", type: "number", min: 0, step: 1 },

  // whole-building
  totalFloors: {
    label: "Total Floors",
    type: "number",
    min: 1,
    step: 1,
    required: true,
  },
  totalUnits: { label: "Total Units", type: "number", min: 1, step: 1 },
  elevator: { label: "Elevator", type: "checkbox" },
  landArea: { label: "Land Area (sqm)", type: "number", min: 0 },
  buildYear: {
    label: "Build Year",
    type: "number",
    min: 1900,
    max: new Date().getFullYear(),
  },
};

/** 3) Category → which fields show */
const FIELDS_BY_CATEGORY = {
  apartment: [
    "title",
    "address",
    "description",
    "price",
    "size",
    "bedrooms",
    "bathrooms",
    "floor",
    "furnished",
    "parking",
  ],
  villa: [
    "title",
    "address",
    "description",
    "price",
    "size",
    "bedrooms",
    "bathrooms",
    "furnished",
    "parking",
    "landArea",
  ],
  duplex: [
    "title",
    "address",
    "description",
    "price",
    "size",
    "bedrooms",
    "bathrooms",
    "floor",
    "furnished",
    "parking",
  ],
  studio: [
    "title",
    "address",
    "description",
    "price",
    "size",
    "bathrooms",
    "floor",
    "furnished",
    "parking",
  ],
  land: [
    "title",
    "address",
    "description",
    "price",
    "plotArea",
    "frontage",
    "zoning",
    "cornerLot",
  ],
  shop: [
    "title",
    "address",
    "description",
    "price",
    "floorArea",
    "frontage",
    "licenseType",
    "hasMezz",
    "parkingSpots",
  ],
  office: [
    "title",
    "address",
    "description",
    "price",
    "floorArea",
    "licenseType",
    "parkingSpots",
  ],
  warehouse: [
    "title",
    "address",
    "description",
    "price",
    "floorArea",
    "frontage",
    "parkingSpots",
  ],
  building: [
    "title",
    "address",
    "description",
    "price",
    "totalFloors",
    "totalUnits",
    "elevator",
    "landArea",
    "buildYear",
  ],
  other: ["title", "address", "description", "price", "size"],
};

export default function CreateListingForm() {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState("rent");
  const [category, setCategory] = useState("apartment");
  const [form, setForm] = useState({}); // all dynamic fields live here

  // Location (governorate/city) state
  const [govs, setGovs] = useState([]); // [{name, slug}]
  const [cities, setCities] = useState([]); // [{name, slug}]
  const [selectedGov, setSelectedGov] = useState(null); // {name, slug}
  const [selectedCity, setSelectedCity] = useState(null); // {name, slug}
  const [otherCityText, setOtherCityText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Firebase uploader states
  const currentUser = useSelector((state) => state.user?.currentUser);

  const [file, setFile] = useState([]); // FileList from input
  const [images, setImages] = useState([]); // uploaded image URLs
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);

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
    if (!selectedGov) {
      setCities([]);
      setSelectedCity(null);
      setOtherCityText("");
      return;
    }
    fetch(`/api/locations/cities/${selectedGov.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setCities(Array.isArray(data) ? data : []);
        setSelectedCity(null);
        setOtherCityText("");
      })
      .catch(() => {
        setCities([]);
        setSelectedCity(null);
      });
    return () => {
      active = false;
    };
  }, [selectedGov]);

  // 4) compute which fields to render
  const visibleFields = useMemo(() => {
    const base = FIELDS_BY_CATEGORY[category] ?? [];
    // ensure Negotiable shows for all categories (deduped)
    return Array.from(new Set([...base, "negotiable"]));
  }, [category]);

  const onChange = (key, value, def = FIELD_DEFS[key]) => {
    let v = value;
    if (def?.type === "number" && v !== "" && v !== null) v = Number(v);
    if (def?.type === "checkbox") v = Boolean(value);
    if (
      def?.type === "select" &&
      Array.isArray(def?.options) &&
      typeof def.options[0] === "number"
    ) {
      v = v === "" ? "" : Number(v);
    }
    setForm((p) => ({ ...p, [key]: v }));
  };

  const API_BASE = import.meta?.env?.VITE_API_BASE || "/api";
  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("access_token") || "";

  // Firebase image uploader helpers
  const clearFileInput = () => {
    setFile([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const userId = currentUser?._id || "anon";
      const fileName = `${userId}-${file.name}-${uuidv4()}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const percent = Math.round(progress);
          setUploadProgress(percent);
          setImageUploadError("");
        },
        (error) => reject(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleImageSubmit = async () => {
    // replicate old constraints: max 6 total images
    const current = images.length;
    const selected = file?.length || 0;
    if (selected === 0) {
      setImageUploadError("Please select at least one image to upload");
      return;
    }
    if (selected > 6) {
      setImageUploadError("You can only select up to 6 images at once");
      clearFileInput();
      return;
    }
    if (current + selected > 6) {
      const remaining = 6 - current;
      setImageUploadError(
        `You can only upload ${remaining} more image(s). You already have ${current} image(s)`
      );
      clearFileInput();
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const promises = [];
      for (let i = 0; i < selected; i++) promises.push(storeImage(file[i]));
      const uploaded = await Promise.all(promises);
      setImages((prev) => prev.concat(uploaded));
      setImageUploadError("");
    } catch (err) {
      setImageUploadError("Image upload failed (2 MB max per image)");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      clearFileInput();
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    // Minimal client validation for non-location fields
    for (const key of visibleFields) {
      if (key === "address") continue; // address validated via governorate/city below
      const def = FIELD_DEFS[key];
      if (def?.required && (form[key] === undefined || form[key] === "")) {
        setSubmitError(`${def.label} is required`);
        return;
      }
    }

    // Validate location (governorate & city)
    if (!selectedGov) {
      setSubmitError("Governorate is required");
      return;
    }
    if (!selectedCity) {
      setSubmitError("City/Area is required");
      return;
    }

    // Set images fallback if none uploaded
    const finalImages =
      images && images.length > 0 ? images : [DEFAULT_IMAGE_URL];

    // Compose a human-friendly address string for display/compat
    const addressDisplay = `${selectedGov.name} - ${selectedCity.name}${
      selectedCity.slug === "other" && otherCityText
        ? ` (${otherCityText})`
        : ""
    }`;

    const payload = {
      purpose,
      category,
      ...form,
      address: addressDisplay, // keep for backward compatibility
      images: finalImages,
      location: {
        governorate: { slug: selectedGov.slug, name: selectedGov.name },
        city: { slug: selectedCity.slug, name: selectedCity.name },
        city_other_text: selectedCity.slug === "other" ? otherCityText : "",
      },
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/listings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create listing");
      }
      setSubmitSuccess("Listing created successfully");
      // Optional: reset minimal fields but keep selectors
      setForm({});
      setSelectedGov(null);
      setSelectedCity(null);
      setOtherCityText("");
      setImages([]);
      setImageUploadError("");
      setUploadProgress(0);
      clearFileInput();
      // console.log created listing id
      console.log("Created listing:", data?.listing || data);
      const createdId = data?.listing?._id || data?._id;
      if (createdId) {
        navigate(`/listing/${createdId}`);
      }
    } catch (err) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 space-y-4 shadow-lg rounded-md mt-16"
    >
      <h1 className="text-2xl font-bold text-center mb-8">Create Listing</h1>
      {/* Top selectors */}
      <div className="grid grid-cols-2 gap-3 ">
        <label className="flex items-center gap-2 border p-3 rounded-lg">
          <span className="text-sm text-slate-600">Purpose:</span>
          <select
            className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 border p-3 rounded-lg">
          <span className="text-sm text-slate-600">Type:</span>
          <select
            className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {toTitle(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Dynamic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleFields.map((key) => {
          const def = FIELD_DEFS[key];
          const v = def.type === "checkbox" ? !!form[key] : form[key] ?? "";
          // Custom renderer for address/location
          if (key === "address") {
            return (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2 "
              >
                {/* Governorate */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Governorate</span>
                  <select
                    className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                    value={selectedGov?.slug || ""}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const g = govs.find((x) => x.slug === slug) || null;
                      setSelectedGov(g);
                    }}
                  >
                    <option value="" disabled>
                      Select Governorate
                    </option>
                    {govs.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* City */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm">City / Area</span>
                  <select
                    className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                    value={selectedCity?.slug || ""}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const c =
                        cities.find((x) => String(x.slug) === slug) || null;
                      setSelectedCity(c);
                    }}
                    disabled={!selectedGov}
                  >
                    <option value="" disabled>
                      {selectedGov ? "Select City" : "Select Governorate first"}
                    </option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Other City Free-text when city === other */}
                {selectedCity?.slug === "other" && (
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm">Specify Area (optional)</span>
                    <input
                      className="border rounded-md px-3 py-2"
                      type="text"
                      placeholder="e.g., Near Ring Road, Abu Rawash"
                      value={otherCityText}
                      onChange={(e) => setOtherCityText(e.target.value)}
                    />
                  </label>
                )}
              </div>
            );
          }
          if (def.type === "select") {
            return (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm">{def.label}</span>
                <select
                  className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                  value={v || ""}
                  onChange={(e) => onChange(key, e.target.value, def)}
                >
                  <option value="" disabled>
                    Select {def.label}
                  </option>
                  {def.options.map((o) => (
                    <option key={o} value={o}>
                      {toTitle(o)}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (def.type === "checkbox") {
            return (
              <label
                key={key}
                className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={v}
                  onChange={(e) => onChange(key, e.target.checked, def)}
                />
                <span className="text-sm">{def.label}</span>
              </label>
            );
          }
          if (def.type === "textarea") {
            return (
              <label
                key={key}
                className="flex flex-col gap-1 col-span-1 sm:col-span-2"
              >
                <span className="text-sm">{def.label}</span>
                <textarea
                  className="border rounded-md px-3 py-2 min-h-28"
                  placeholder={def.placeholder}
                  value={v}
                  onChange={(e) => onChange(key, e.target.value, def)}
                />
              </label>
            );
          }
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-sm">{def.label}</span>
              <input
                className="border rounded-md px-3 py-2"
                type={def.type}
                min={def.min}
                max={def.max}
                step={def.step}
                placeholder={def.placeholder}
                value={v}
                onChange={(e) => onChange(key, e.target.value, def)}
              />
            </label>
          );
        })}
      </div>

      {/* Images uploader (Firebase) */}
      <div className="flex flex-col gap-3 sm:col-span-2">
        <div className="flex gap-2">
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
            type="button"
            disabled={uploading}
            onClick={handleImageSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition cursor-pointer disabled:opacity-80"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
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

        {images.length > 0 &&
          images.map((url, index) => (
            <div
              key={url}
              className="flex justify-between p-3 border items-center rounded-lg"
            >
              <img
                src={url}
                alt="listing"
                className="w-20 h-20 object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="p-2 text-red-700 rounded-lg uppercase hover:opacity-75"
              >
                Delete
              </button>
            </div>
          ))}
        {images.length === 0 && (
          <p className="text-xs text-slate-500">
            No images selected — a default image will be used.
          </p>
        )}
      </div>

      {(submitError || submitSuccess) && (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            submitError
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {submitError || submitSuccess}
        </div>
      )}

      <button
        disabled={submitting}
        className={`w-full rounded-lg px-4 py-3 text-white cursor-pointer hover:bg-blue-500 ${
          submitting ? "bg-indigo-400" : "bg-indigo-600 hover:opacity-95"
        }`}
      >
        {submitting ? "Creating…" : "Create Listing"}
      </button>
    </form>
  );
}

function toTitle(s) {
  if (s == null) return "";
  s = String(s); // <-- ensure it's a string
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
