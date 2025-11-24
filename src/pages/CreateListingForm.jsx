// Ensure you have client/public/placeholder.jpg available; set VITE_DEFAULT_LISTING_IMAGE to override in prod.
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../config/api.js";
import apiFetch from "../lib/apiFetch.js";

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

// ---------------------------- Option metadata ----------------------------
const PURPOSE_OPTIONS = [
  { value: "rent", labelKey: "createListing.purpose.rent" },
  { value: "sale", labelKey: "createListing.purpose.sale" },
];

const CATEGORY_OPTIONS = [
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

const ZONING_OPTIONS = [
  "residential",
  "commercial",
  "agricultural",
  "industrial",
];

const LICENSE_OPTIONS = [
  "retail",
  "office",
  "restaurant",
  "warehouse",
  "clinic",
  "other",
];

// ---------------------------- Field configuration (translation keys) ----------------------------
const FIELD_CONFIG = {
  // shared
  title: {
    labelKey: "createListing.fields.title",
    type: "text",
    required: true,
  },
  address: { labelKey: "createListing.fields.address", type: "location" },
  description: {
    labelKey: "createListing.fields.description",
    type: "textarea",
    required: true,
    placeholderKey: "createListing.fields.descriptionPlaceholder",
  },
  price: {
    labelKey: "createListing.fields.price",
    type: "number",
    min: 0,
    required: true,
  },
  size: { labelKey: "createListing.fields.size", type: "number", min: 0 },
  negotiable: { labelKey: "createListing.fields.negotiable", type: "checkbox" },

  // residential-only
  bedrooms: {
    labelKey: "createListing.fields.bedrooms",
    type: "select",
    options: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ],
  },
  bathrooms: {
    labelKey: "createListing.fields.bathrooms",
    type: "select",
    options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  floor: {
    labelKey: "createListing.fields.floor",
    type: "select",
    options: Array.from({ length: 51 }, (_, i) => i),
  },
  furnished: { labelKey: "createListing.fields.furnished", type: "checkbox" },
  parking: { labelKey: "createListing.fields.parking", type: "checkbox" },

  // land-only
  plotArea: {
    labelKey: "createListing.fields.plotArea",
    type: "number",
    min: 0,
    required: true,
  },
  frontage: {
    labelKey: "createListing.fields.frontage",
    type: "number",
    min: 0,
  },
  zoning: {
    labelKey: "createListing.fields.zoning",
    type: "select",
    options: ZONING_OPTIONS,
  },
  cornerLot: { labelKey: "createListing.fields.cornerLot", type: "checkbox" },

  // commercial-only
  floorArea: {
    labelKey: "createListing.fields.floorArea",
    type: "number",
    min: 0,
    required: true,
  },
  licenseType: {
    labelKey: "createListing.fields.licenseType",
    type: "select",
    options: LICENSE_OPTIONS,
  },
  hasMezz: { labelKey: "createListing.fields.hasMezz", type: "checkbox" },
  parkingSpots: {
    labelKey: "createListing.fields.parkingSpots",
    type: "number",
    min: 0,
    step: 1,
  },

  // whole-building
  totalFloors: {
    labelKey: "createListing.fields.totalFloors",
    type: "number",
    min: 1,
    step: 1,
    required: true,
  },
  totalUnits: {
    labelKey: "createListing.fields.totalUnits",
    type: "number",
    min: 1,
    step: 1,
  },
  elevator: { labelKey: "createListing.fields.elevator", type: "checkbox" },
  landArea: {
    labelKey: "createListing.fields.landArea",
    type: "number",
    min: 0,
  },
  buildYear: {
    labelKey: "createListing.fields.buildYear",
    type: "number",
    min: 1900,
    max: new Date().getFullYear(),
  },
};

// ---------------------------- Category → which fields show ----------------------------
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
  const { t, i18n } = useTranslation();
  const isAr = i18n?.language?.startsWith("ar");
  const langParam = isAr ? "ar" : "en";
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0].value);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [form, setForm] = useState({}); // all dynamic fields live here

  // ---------------------------- Location (governorate/city) state ----------------------------
  const [govs, setGovs] = useState([]); // [{name, slug}]
  const [cities, setCities] = useState([]); // [{name, slug}]
  const [selectedGov, setSelectedGov] = useState(null); // {name, slug}
  const [selectedCity, setSelectedCity] = useState(null); // {name, slug}
  const [areas, setAreas] = useState([]); // [{name, slug}]
  const [selectedArea, setSelectedArea] = useState(null); // {name, slug}

  const [otherCityText, setOtherCityText] = useState("");

  const getDisplayName = (item) =>
    isAr && item?.nameAr ? item.nameAr : item?.name || "";

  const getOptionLabel = (fieldKey, option) => {
    if (typeof option === "number") return option;
    return t(`createListing.options.${fieldKey}.${option}`, {
      defaultValue: toTitle(option),
    });
  };

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
  const MAX_IMAGES = 6;

  // ---------------------------- Location fetching ----------------------------
  // Fetch governorates on mount & language change
  useEffect(() => {
    // Fetches the list of governorates when the component mounts or the language changes.
    let active = true;
    fetch(`${API}/locations/governorates?lang=${langParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setGovs(list);
        setSelectedGov((prev) => {
          if (!prev) return prev;
          return list.find((g) => g.slug === prev.slug) || null;
        });
      })
      .catch(() => {
        setGovs([]);
        setSelectedGov(null);
        setSelectedCity(null);
        setOtherCityText("");
      });
    return () => {
      active = false;
    };
  }, [langParam]);

  // Fetch cities when governorate changes
  useEffect(() => {
    // Fetches the list of cities for the selected governorate.
    let active = true;
    if (!selectedGov) {
      setCities([]);
      setSelectedCity(null);
      setOtherCityText("");
      setAreas([]);
      setSelectedArea(null);
      return;
    }
    fetch(
      `${API}/locations/governorates/${selectedGov.slug}/cities?lang=${langParam}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.cities) ? data.cities : [];
        setCities(list);
        setSelectedCity((prev) => {
          if (!prev) return prev;
          return list.find((c) => c.slug === prev.slug) || null;
        });
        setOtherCityText("");
        // reset areas
        setAreas([]);
        setSelectedArea(null);
      })
      .catch(() => {
        setCities([]);
        setSelectedCity(null);
      });
    return () => {
      active = false;
    };
  }, [selectedGov, langParam]);

  // Fetch areas when city changes
  useEffect(() => {
    // Fetches the list of areas for the selected city.
    let active = true;
    // If no city or city is "other", clear areas
    if (!selectedGov || !selectedCity || selectedCity.slug === "other") {
      setAreas([]);
      setSelectedArea(null);
      return () => {
        active = false;
      };
    }
    fetch(
      `${API}/locations/governorates/${selectedGov.slug}/cities/${selectedCity.slug}/areas?lang=${langParam}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.areas) ? data.areas : [];
        setAreas(list);
        setSelectedArea((prev) =>
          prev
            ? list.find((a) => String(a.slug) === String(prev.slug)) || null
            : prev
        );
      })
      .catch(() => {
        setAreas([]);
        setSelectedArea(null);
      });
    return () => {
      active = false;
    };
  }, [selectedGov?.slug, selectedCity?.slug, langParam]);

  const fieldDefs = useMemo(() => {
    const map = {};
    Object.entries(FIELD_CONFIG).forEach(([key, def]) => {
      map[key] = {
        ...def,
        label: t(def.labelKey),
        placeholder: def.placeholderKey
          ? t(def.placeholderKey)
          : def.placeholder,
      };
    });
    return map;
  }, [t, i18n.language]);

  // 4) compute which fields to render
  const visibleFields = useMemo(() => {
    const base = FIELDS_BY_CATEGORY[category] ?? [];
    return [...base, "negotiable"]; // always include
  }, [category]);

  const onChange = (key, value, def = fieldDefs[key]) => {
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

  // ---------------------------- Image upload handling ----------------------------
  // Clears the file input and resets file state
  const clearFileInput = () => {
    setFile([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Uploads a single image file to Firebase Storage and resolves with the URL
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

  // Handles the image upload button click: validates, uploads images, handles errors and progress.
  const handleImageSubmit = async () => {
    // replicate old constraints: max 6 total images
    const current = images.length;
    const selected = file?.length || 0;
    if (selected === 0) {
      setImageUploadError(t("createListing.messages.uploadSelectOne"));
      return;
    }
    if (selected > MAX_IMAGES) {
      setImageUploadError(
        t("createListing.messages.uploadMaxPerBatch", { max: MAX_IMAGES })
      );
      clearFileInput();
      return;
    }
    if (current + selected > MAX_IMAGES) {
      const remaining = MAX_IMAGES - current;
      setImageUploadError(
        t("createListing.messages.uploadRemaining", {
          remaining,
          current,
        })
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
      setImageUploadError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      clearFileInput();
    }
  };

  // Removes an uploaded image by index
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  function normalizePhone(raw) {
    return raw.replace(/[\s\-().]/g, "");
  }

  // ---------------------------- Form validation & submit ----------------------------
  // Handles form submission: validates fields, prepares payload, sends API request, handles response and errors.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    // Minimal client validation for non-location fields
    for (const key of visibleFields) {
      if (key === "address") continue; // address validated via governorate/city below
      const def = fieldDefs[key];
      if (def?.required && (form[key] === undefined || form[key] === "")) {
        setSubmitError(
          t("createListing.messages.fieldRequired", { field: def.label })
        );
        return;
      }
    }

    // Validate location (governorate & city)
    if (!selectedGov) {
      setSubmitError(t("createListing.messages.govRequired"));
      return;
    }
    if (!selectedCity) {
      setSubmitError(t("createListing.messages.cityRequired"));
      return;
    }

    // Set images fallback if none uploaded
    const finalImages =
      images && images.length > 0 ? images : [DEFAULT_IMAGE_URL];

    const toLocationEntry = (item) =>
      item
        ? {
            slug: item.slug,
          }
        : undefined;

    const locationPayload = {
      governorate: toLocationEntry(selectedGov),
      city: toLocationEntry(selectedCity),
    };

    const areaEntry = toLocationEntry(selectedArea);
    if (areaEntry) locationPayload.area = areaEntry;
    if (selectedCity?.slug === "other" && otherCityText.trim()) {
      locationPayload.city_other_text = otherCityText.trim();
    }

    const payload = {
      purpose,
      category,
      ...form,
      images: finalImages,
      location: locationPayload,
      contact: {
        phone: normalizePhone(form.contactPhone),
        whatsapp: form.whatsapp !== false,
      },
    };

    try {
      setSubmitting(true);
      const res = await apiFetch(`${API}/listings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || t("createListing.messages.errorCreate")
        );
      }
      setSubmitSuccess(t("createListing.messages.success"));
      // Optional: reset minimal fields but keep selectors
      setForm({});
      setSelectedGov(null);
      setSelectedCity(null);
      setAreas([]);
      setSelectedArea(null);
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
      setSubmitError(err.message || t("createListing.messages.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------- JSX layout ----------------------------
  return (
    <form
      data-testid="create-form"
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 space-y-4 shadow-lg rounded-md mt-16 overflow-x-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <h1 className="text-2xl font-bold text-center mb-8">
        {t("createListing.title")}
      </h1>
      {/* Top selectors */}
      <div className="grid grid-cols-2 gap-3 ">
        <label className="flex items-center gap-2 border p-3 rounded-lg">
          <span className="text-sm text-slate-600">
            {t("createListing.form.purposeLabel")}
          </span>
          <select
            data-testid="create-purpose"
            className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            {PURPOSE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 border p-3 rounded-lg">
          <span className="text-sm text-slate-600">
            {t("createListing.form.categoryLabel")}
          </span>
          <select
            data-testid="create-category"
            className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {t(`listing.propertyTypes.${c}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Dynamic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleFields.map((key) => {
          const def = fieldDefs[key];
          const v = def.type === "checkbox" ? !!form[key] : form[key] ?? "";
          // Custom renderer for address/location
          if (key === "address") {
            return (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2 w-full"
              >
                {/* Governorate */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm">
                    {t("createListing.form.governorateLabel")}
                  </span>
                  <select
                    data-testid="create-governorate"
                    className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                    value={selectedGov?.slug || ""}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const g = govs.find((x) => x.slug === slug) || null;
                      setSelectedGov(g);
                      setSelectedCity(null);
                      setOtherCityText("");
                    }}
                  >
                    <option value="" disabled>
                      {t("createListing.form.selectGovernorate")}
                    </option>
                    {govs.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {getDisplayName(g)}
                      </option>
                    ))}
                  </select>
                </label>

                {/* City */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm">
                    {t("createListing.form.cityLabel")}
                  </span>
                  <select
                    data-testid="create-city"
                    className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                    value={selectedCity?.slug || ""}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const c =
                        cities.find((x) => String(x.slug) === slug) || null;
                      setSelectedCity(c);
                      setSelectedArea(null);
                      if (slug !== "other") {
                        setOtherCityText("");
                      }
                    }}
                    disabled={!selectedGov}
                  >
                    <option value="" disabled>
                      {selectedGov
                        ? t("createListing.form.selectCity")
                        : t("createListing.form.selectGovernorateFirst")}
                    </option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {getDisplayName(c)}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Area */}
                {selectedCity && Array.isArray(areas) && areas.length > 0 && (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">
                      {t("createListing.form.areaLabel", {
                        defaultValue: "Area",
                      })}
                    </span>
                    <select
                      className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                      value={selectedArea?.slug || ""}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const a =
                          areas.find((x) => String(x.slug) === String(slug)) ||
                          null;
                        setSelectedArea(a);
                      }}
                      disabled={
                        !selectedGov || !selectedCity || areas.length === 0
                      }
                    >
                      <option value="">
                        {t("createListing.form.selectArea", {
                          defaultValue: "All areas",
                        })}
                      </option>
                      {areas.map((a) => (
                        <option key={a.slug} value={String(a.slug)}>
                          {getDisplayName(a)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Other City Free-text when city === other */}
                {selectedCity?.slug === "other" && (
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm">
                      {t("createListing.form.otherAreaLabel")}
                    </span>
                    <input
                      className="border rounded-md px-3 py-2"
                      type="text"
                      placeholder={t("createListing.form.otherAreaPlaceholder")}
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
                  data-testid={`create-${key}`}
                  className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                  value={v || ""}
                  onChange={(e) => onChange(key, e.target.value, def)}
                >
                  <option value="" disabled>
                    {t("createListing.form.selectOption", { field: def.label })}
                  </option>
                  {def.options?.map((o) => (
                    <option key={o} value={o}>
                      {getOptionLabel(key, o)}
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
                  data-testid={`create-${key}`}
                  className="border rounded-md px-3 py-2 min-h-28"
                  placeholder={def.placeholder}
                  value={v}
                  onChange={(e) => onChange(key, e.target.value, def)}
                />
              </label>
            );
          }
          // Add data-testid for title input and for all number/text inputs
          let inputTestId = undefined;
          if (key === "title") inputTestId = "create-title";
          else if (def.type === "number" || def.type === "text")
            inputTestId = `create-${key}`;
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-sm">{def.label}</span>
              <input
                data-testid={inputTestId}
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

      {/* Contact Phone & WhatsApp */}
      <span className="text-sm">{t("createListing.form.phoneLabel")}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <input
            data-testid="create-contact-phone"
            type="tel"
            id="contactPhone"
            placeholder="+2010xxxxxxxx"
            className="border rounded-md px-3 py-2"
            value={form.contactPhone || ""}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            required
          />
        </label>
        <label className="inline-flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
          <input
            data-testid="create-contact-whatsapp"
            type="checkbox"
            checked={form.whatsapp !== false}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.checked })}
          />
          <span>{t("createListing.form.allowWhatsapp")}</span>
        </label>
      </div>

      {/* Images uploader (Firebase) */}
      <div className="flex flex-col gap-3 sm:col-span-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            data-testid="create-images-input"
            ref={fileRef}
            className="border p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition w-full"
            type="file"
            name="images"
            multiple
            accept="image/*"
            onChange={(e) => setFile(e.target.files)}
          />
          <button
            data-testid="create-images-upload-button"
            type="button"
            disabled={uploading}
            onClick={handleImageSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition cursor-pointer disabled:opacity-80 w-full sm:w-auto"
          >
            {uploading
              ? t("createListing.actions.uploading")
              : t("createListing.actions.upload")}
          </button>
        </div>

        {uploading && uploadProgress > 0 && (
          <div
            data-testid="create-images-upload-progress"
            className="w-full bg-gray-200 rounded-full h-2.5 my-2"
          >
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-sm text-center mt-1">
              {t("createListing.messages.uploadProgress", {
                progress: uploadProgress,
              })}
            </p>
          </div>
        )}

        {imageUploadError && (
          <p data-testid="create-images-error" className="text-red-700 text-sm">
            {imageUploadError}
          </p>
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
                {t("common.delete", "Delete")}
              </button>
            </div>
          ))}
        {images.length === 0 && (
          <p className="text-xs text-slate-500">
            {t("createListing.messages.noImages")}
          </p>
        )}
      </div>

      {/* Submit success/error feedback */}
      {submitError && (
        <div
          data-testid="create-submit-error"
          className="text-sm rounded-md px-3 py-2 bg-red-50 text-red-700"
        >
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div
          data-testid="create-submit-success"
          className="text-sm rounded-md px-3 py-2 bg-green-50 text-green-700"
        >
          {submitSuccess}
        </div>
      )}

      <button
        data-testid="create-submit"
        disabled={submitting}
        className={`w-full rounded-lg px-4 py-3 text-white cursor-pointer hover:bg-blue-500 ${
          submitting ? "bg-indigo-400" : "bg-indigo-600 hover:opacity-95"
        }`}
      >
        {submitting
          ? t("createListing.actions.creating")
          : t("createListing.actions.submit")}
      </button>
    </form>
  );
}

function toTitle(s) {
  if (s == null) return "";
  s = String(s); // <-- ensure it's a string
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
