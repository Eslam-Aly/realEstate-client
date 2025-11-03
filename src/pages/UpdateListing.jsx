import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { app } from "../firebase.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

import API from "../config/api.js";

const DEFAULT_IMAGE_URL =
  import.meta?.env?.VITE_DEFAULT_LISTING_IMAGE || "/placeholder.jpg";
const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("access_token") || "";

/** 1) Option metadata */
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

/** 2) Field registry (translation keys) */
const FIELD_CONFIG = {
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

  bedrooms: {
    labelKey: "createListing.fields.bedrooms",
    type: "select",
    options: Array.from({ length: 21 }, (_, i) => i),
  },
  bathrooms: {
    labelKey: "createListing.fields.bathrooms",
    type: "select",
    options: Array.from({ length: 11 }, (_, i) => i),
  },
  floor: {
    labelKey: "createListing.fields.floor",
    type: "select",
    options: Array.from({ length: 51 }, (_, i) => i),
  },
  furnished: { labelKey: "createListing.fields.furnished", type: "checkbox" },
  parking: { labelKey: "createListing.fields.parking", type: "checkbox" },
  negotiable: { labelKey: "createListing.fields.negotiable", type: "checkbox" },

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
  const { t, i18n } = useTranslation();
  const isAr = i18n?.language?.startsWith("ar");
  const langParam = isAr ? "ar" : "en";

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Top selectors
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0].value);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);

  // Dynamic fields
  const [form, setForm] = useState({});

  // Location (governorate/city)
  const [govs, setGovs] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedGov, setSelectedGov] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [otherCityText, setOtherCityText] = useState("");
  // Images (Firebase)
  const [file, setFile] = useState([]);
  const [images, setImages] = useState([]);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const MAX_IMAGES = 6;

  const getDisplayName = (item) =>
    isAr && item?.nameAr ? item.nameAr : item?.name || "";

  const getOptionLabel = (fieldKey, option) => {
    if (typeof option === "number") return option;
    return t(`createListing.options.${fieldKey}.${option}`, {
      defaultValue: toTitle(option),
    });
  };

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

  const visibleFields = useMemo(() => {
    const base = FIELDS_BY_CATEGORY[category] ?? [];
    return Array.from(new Set([...base, "negotiable"]));
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

  // Load governorates on mount & language change
  useEffect(() => {
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

  // Load listing data
  useEffect(() => {
    const id = params.listingId;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/listings/get/${id}`);
        const data = await res.json();
        if (!res.ok || data?.success === false)
          throw new Error(
            data?.message || t("updateListing.messages.loadError")
          );

        // Top selectors
        const safePurpose =
          PURPOSE_OPTIONS.find((opt) => opt.value === data.purpose)?.value ||
          PURPOSE_OPTIONS[0].value;
        setPurpose(safePurpose);
        const safeCategory = CATEGORY_OPTIONS.includes(data.category)
          ? data.category
          : CATEGORY_OPTIONS[0];
        setCategory(safeCategory);

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
        const area = loc.area || null;

        if (gov?.slug) {
          const resCities = await fetch(
            `${API}/locations/governorates/${gov.slug}/cities?lang=${langParam}`
          );
          const cityPayload = await resCities.json();
          const list = Array.isArray(cityPayload?.cities)
            ? cityPayload.cities
            : [];
          setCities(list);
          setSelectedGov({
            slug: gov.slug,
            name: gov.name,
            nameAr: gov.nameAr,
          });
          if (city?.slug) {
            const match = list.find(
              (c) => String(c.slug) === String(city.slug)
            );
            setSelectedCity(
              match || {
                slug: city.slug,
                name: city.name,
                nameAr: city.nameAr,
              }
            );
            // Load areas for city

            if (gov?.slug && city?.slug && area?.slug) {
              try {
                const resAreas = await fetch(
                  `${API}/locations/governorates/${gov.slug}/cities/${city.slug}/areas?lang=${langParam}`
                );
                const areaPayload = await resAreas.json();
                const areasList = Array.isArray(areaPayload?.areas)
                  ? areaPayload.areas
                  : [];
                setAreas(areasList);
                const aMatch = areasList.find(
                  (a) => String(a.slug) === String(area.slug)
                );
                if (aMatch) setSelectedArea(aMatch);
              } catch {
                setAreas([]);
                setSelectedArea(null);
              }
            }
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

          contactPhone: data.contact?.phone?.replace("+20", "0") || "",
          whatsapp: data.contact?.whatsapp !== false,
        };
        setForm(f);
      } catch (e) {
        setSubmitError(e.message || t("updateListing.messages.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [params.listingId, t, langParam]);

  // When governorate changes via UI
  useEffect(() => {
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
        setAreas([]);
        setSelectedArea(null);
        setSelectedCity((prev) => {
          if (!prev) return prev;
          return list.find((c) => c.slug === prev.slug) || null;
        });
      })
      .catch(() => {
        setCities([]);
        setSelectedCity(null);
      });
    return () => {
      active = false;
    };
  }, [selectedGov?.slug, langParam]);

  // Load areas when governorate or city changes
  useEffect(() => {
    let active = true;
    if (!selectedGov || !selectedCity) {
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
  function normalizePhone(raw) {
    return raw.replace(/[\s\-().]/g, "");
  }

  const handleImageSubmit = async () => {
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
      const uploaded = await Promise.all(
        Array.from({ length: selected }, (_, i) => storeImage(file[i]))
      );
      setImages((prev) => prev.concat(uploaded));
      setImageUploadError("");
    } catch (err) {
      setImageUploadError(t("createListing.messages.uploadFailed"));
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
      const def = fieldDefs[key];
      if (def?.required && (form[key] === undefined || form[key] === "")) {
        setSubmitError(
          t("createListing.messages.fieldRequired", { field: def.label })
        );
        return;
      }
    }

    if (!selectedGov) {
      setSubmitError(t("createListing.messages.govRequired"));
      return;
    }
    if (!selectedCity) {
      setSubmitError(t("createListing.messages.cityRequired"));
      return;
    }

    const finalImages =
      images && images.length > 0 ? images : [DEFAULT_IMAGE_URL];

    const locationPayload = {
      governorate: { slug: selectedGov.slug },
      city: { slug: selectedCity.slug },
    };
    if (selectedArea?.slug) {
      locationPayload.area = { slug: selectedArea.slug };
    }
    if (selectedCity.slug === "other" && otherCityText.trim()) {
      locationPayload.city_other_text = otherCityText.trim();
    }

    const payload = {
      purpose,
      category,
      ...form,

      images: finalImages,
      location: locationPayload,
      contact: {
        phone: normalizePhone(form.contactPhone || ""),
        whatsapp: form.whatsapp !== false,
      },
    };

    try {
      setLoading(true);
      const res = await fetch(`${API}/listings/update/${params.listingId}`, {
        method: "PATCH", // your routes use PATCH for update
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false)
        throw new Error(data?.message || t("updateListing.messages.error"));

      setSubmitError("");
      navigate(`/listing/${params.listingId}`);
    } catch (err) {
      setSubmitError(err.message || t("updateListing.messages.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 space-y-4 shadow-lg rounded-md mt-16 overflow-x-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <h1 className="text-2xl font-bold text-center mb-8">
        {t("updateListing.title")}
      </h1>

      {/* Top selectors */}
      <div className="grid grid-cols-2 gap-3 ">
        <label className="flex items-center gap-2 border p-3 rounded-lg">
          <span className="text-sm text-slate-600">
            {t("createListing.form.purposeLabel")}
          </span>
          <select
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

          if (key === "address") {
            return (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2"
              >
                {/* Governorate */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm">
                    {t("createListing.form.governorateLabel")}
                  </span>
                  <select
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
                    className="border rounded-md px-3 py-2 appearance-none cursor-pointer"
                    value={selectedCity?.slug || ""}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const c =
                        cities.find((x) => String(x.slug) === slug) || null;
                      setSelectedCity(c);
                      setSelectedArea(null);
                      if (slug !== "other") setOtherCityText("");
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

                {selectedCity && Array.isArray(areas) && areas.length > 0 && (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">{t("search.area")}</span>
                    <select
                      name="area"
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
                      <option value="">{t("search.allAreas")}</option>
                      {areas.map((a) => (
                        <option key={a.slug} value={String(a.slug)}>
                          {getDisplayName(a)}
                        </option>
                      ))}
                    </select>
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

      {/* Contact Phone & WhatsApp */}
      <span className="text-sm">{t("createListing.form.phoneLabel")}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <input
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
            ref={fileRef}
            className="border p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition w-full"
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
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition cursor-pointer disabled:opacity-80 w-full sm:w-auto"
          >
            {uploading
              ? t("createListing.actions.uploading")
              : t("createListing.actions.upload")}
          </button>
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
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
                {t("common.delete")}
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
        {loading
          ? t("updateListing.actions.updating")
          : t("updateListing.actions.submit")}
      </button>
    </form>
  );
}

function toTitle(s) {
  if (s == null) return "";
  s = String(s);
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
