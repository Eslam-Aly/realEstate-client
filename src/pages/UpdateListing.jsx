import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { app } from "../firebase.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_IMAGE_URL =
  import.meta?.env?.VITE_DEFAULT_LISTING_IMAGE || "/placeholder.jpg";
const API_BASE = import.meta?.env?.VITE_API_BASE || "/api";
const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("access_token") || "";

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

/** 2) Field registry */
const FIELD_DEFS = {
  title: { label: "Title", type: "text", required: true },
  address: { label: "Address", type: "location" },
  description: { label: "Description", type: "textarea", required: true },
  price: { label: "Price", type: "number", min: 0, required: true },
  size: { label: "Size (sqm)", type: "number", min: 0 },

  bedrooms: {
    label: "Bedrooms",
    type: "select",
    options: Array.from({ length: 21 }, (_, i) => i),
  },
  bathrooms: {
    label: "Bathrooms",
    type: "select",
    options: Array.from({ length: 11 }, (_, i) => i),
  },
  floor: {
    label: "Floor",
    type: "select",
    options: Array.from({ length: 51 }, (_, i) => i),
  },
  furnished: { label: "Furnished", type: "checkbox" },
  parking: { label: "Parking", type: "checkbox" },
  negotiable: { label: "Negotiable", type: "checkbox" },

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

export default function UpdateListing() {
  const navigate = useNavigate();
  const params = useParams();
  const { currentUser } = useSelector((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Top selectors
  const [purpose, setPurpose] = useState("rent");
  const [category, setCategory] = useState("apartment");

  // Dynamic fields
  const [form, setForm] = useState({});

  // Location (governorate/city)
  const [govs, setGovs] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedGov, setSelectedGov] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [otherCityText, setOtherCityText] = useState("");

  // Images (Firebase)
  const [file, setFile] = useState([]);
  const [images, setImages] = useState([]);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);

  const visibleFields = useMemo(() => {
    const base = FIELDS_BY_CATEGORY[category] ?? [];
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

  // Load governorates on mount
  useEffect(() => {
    let active = true;
    fetch(`/api/locations/governorates`)
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

  // Load listing data
  useEffect(() => {
    const id = params.listingId;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/listings/get/${id}`);
        const data = await res.json();
        if (!res.ok || data?.success === false)
          throw new Error(data?.message || "Failed to load listing");

        // Top selectors
        setPurpose(data.purpose || "rent");
        setCategory(data.category || "apartment");

        // Images
        setImages(
          Array.isArray(data.images) && data.images.length
            ? data.images
            : [DEFAULT_IMAGE_URL]
        );

        // Location prefill
        const loc = data.location || {};
        const gov = loc.governorate || null;
        const city = loc.city || null;
        setOtherCityText(loc.city_other_text || "");

        if (gov?.slug) {
          const resCities = await fetch(`/api/locations/cities/${gov.slug}`);
          const list = await resCities.json();
          setCities(Array.isArray(list) ? list : []);
          setSelectedGov(gov);
          if (city?.slug) {
            const match = (Array.isArray(list) ? list : []).find(
              (c) => String(c.slug) === String(city.slug)
            );
            setSelectedCity(match || city);
          }
        }

        // Map subdocs into flat form
        const f = {
          title: data.title || "",
          description: data.description || "",
          price: data.price ?? "",

          size: data.residential?.size ?? data.other?.size ?? "",
          bedrooms: data.residential?.bedrooms ?? "",
          bathrooms: data.residential?.bathrooms ?? "",
          floor: data.residential?.floor ?? "",
          furnished: data.residential?.furnished ?? false,
          parking: data.residential?.parking ?? false,

          plotArea: data.land?.plotArea ?? "",
          frontage: data.land?.frontage ?? data.commercial?.frontage ?? "",
          zoning: data.land?.zoning ?? "",
          cornerLot: data.land?.cornerLot ?? false,

          floorArea: data.commercial?.floorArea ?? "",
          licenseType: data.commercial?.licenseType ?? "",
          hasMezz: data.commercial?.hasMezz ?? false,
          parkingSpots: data.commercial?.parkingSpots ?? "",

          totalFloors: data.building?.totalFloors ?? "",
          totalUnits: data.building?.totalUnits ?? "",
          elevator: data.building?.elevator ?? false,
          landArea: data.building?.landArea ?? "",
          buildYear: data.building?.buildYear ?? "",
          negotiable: Boolean(data.negotiable),
        };
        setForm(f);
      } catch (e) {
        setSubmitError(e.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.listingId]);

  // When governorate changes via UI
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
      })
      .catch(() => setCities([]));
    return () => {
      active = false;
    };
  }, [selectedGov?.slug]);

  // Firebase helpers
  const clearFileInput = () => {
    setFile([]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const storeImage = async (file) =>
    new Promise((resolve, reject) => {
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
          setUploadProgress(Math.round(progress));
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

  const handleImageSubmit = async () => {
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
      const uploaded = await Promise.all(
        Array.from({ length: selected }, (_, i) => storeImage(file[i]))
      );
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

    // validate required fields (excluding address handled via selectors)
    for (const key of visibleFields) {
      if (key === "address") continue;
      const def = FIELD_DEFS[key];
      if (def?.required && (form[key] === undefined || form[key] === "")) {
        setSubmitError(`${def.label} is required`);
        return;
      }
    }

    if (!selectedGov) {
      setSubmitError("Governorate is required");
      return;
    }
    if (!selectedCity) {
      setSubmitError("City/Area is required");
      return;
    }

    const finalImages =
      images && images.length > 0 ? images : [DEFAULT_IMAGE_URL];

    const addressDisplay = `${selectedGov.name} - ${selectedCity.name}${
      selectedCity.slug === "other" && otherCityText
        ? ` (${otherCityText})`
        : ""
    }`;

    const payload = {
      purpose,
      category,
      ...form,
      address: addressDisplay,
      images: finalImages,
      location: {
        governorate: { slug: selectedGov.slug, name: selectedGov.name },
        city: { slug: selectedCity.slug, name: selectedCity.name },
        city_other_text: selectedCity.slug === "other" ? otherCityText : "",
      },
    };

    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/listings/update/${params.listingId}`,
        {
          method: "PATCH", // your routes use PATCH for update
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false)
        throw new Error(data?.message || "Update failed");

      navigate(`/listing/${params.listingId}`);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 space-y-4 shadow-lg rounded-md mt-16"
    >
      <h1 className="text-2xl font-bold text-center mb-8">Update Listing</h1>

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

          if (key === "address") {
            return (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2"
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

        {Array.isArray(images) &&
          images.map((url, index) => (
            <div
              key={url + index}
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
      </div>

      {submitError && (
        <div className="text-sm rounded-md px-3 py-2 bg-red-50 text-red-700">
          {submitError}
        </div>
      )}

      <button
        disabled={uploading || loading}
        className="w-full rounded-lg px-4 py-3 text-white cursor-pointer hover:bg-blue-500 bg-indigo-600 disabled:opacity-70"
      >
        {loading ? "Updating…" : "Update Listing"}
      </button>
    </form>
  );
}

function toTitle(s) {
  if (s == null) return "";
  s = String(s);
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
