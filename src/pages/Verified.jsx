// src/features/auth/Verified.jsx
import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Verified() {
  const [params] = useSearchParams();
  const langParam = (params.get("lang") || "en").toLowerCase();
  const normalizedLang = langParam === "ar" ? "ar" : "en";
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== normalizedLang) {
      i18n.changeLanguage(normalizedLang);
    }
  }, [normalizedLang, i18n]);

  const isAr = normalizedLang === "ar";

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen m-10 md:m-20">
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-green-600"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M9.55 17.025L5.4 12.9l1.4-1.425l2.75 2.75l7.1-7.1l1.4 1.4Z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {t("auth.emailVerifiedTitle")}
            </h1>
            <p className="text-sm text-slate-600">
              {t("auth.emailVerifiedBody")}
            </p>
          </div>

          <Link
            to="/signin"
            className="inline-flex items-center justify-center rounded-xl bg-green-600 text-white px-6 py-3 text-sm font-semibold shadow-md  transition hover:bg-green-700"
          >
            {t("auth.emailVerifiedCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
