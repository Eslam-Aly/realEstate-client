// src/features/auth/ResetPassword.jsx
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../config/api.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const langParam = (params.get("lang") || "en").toLowerCase();
  const normalizedLang = langParam === "ar" ? "ar" : "en";
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== normalizedLang) {
      i18n.changeLanguage(normalizedLang);
    }
  }, [normalizedLang, i18n]);

  const isAr = normalizedLang === "ar";

  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [status, setStatus] = useState("");
  const [formErrorKey, setFormErrorKey] = useState("");
  const [serverError, setServerError] = useState("");

  const passwordRequirements = useMemo(
    () => [
      { key: "passwordRequirementLength", test: (value) => value.length >= 8 },
      { key: "passwordRequirementUpper", test: (value) => /[A-Z]/.test(value) },
      { key: "passwordRequirementLower", test: (value) => /[a-z]/.test(value) },
      { key: "passwordRequirementNumber", test: (value) => /\d/.test(value) },
      {
        key: "passwordRequirementSymbol",
        test: (value) => /[^A-Za-z0-9]/.test(value),
      },
    ],
    []
  );

  const meetsAllRequirements = passwordRequirements.every((requirement) =>
    requirement.test(pwd)
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setFormErrorKey("");
    setServerError("");

    if (!meetsAllRequirements) {
      setFormErrorKey("passwordNotStrongEnough");
      return;
    }

    if (pwd !== confirmPwd) {
      setFormErrorKey("passwordsDoNotMatch");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({ token, newPassword: pwd }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Unable to update password.");
      }
      setStatus("done");
      setPwd("");
      setConfirmPwd("");
    } catch (err) {
      setStatus("");
      setServerError(err.message || "error");
    }
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen mt-10 md:mt-20">
      <div className="flex items-center justify-center px-4 py-10 ">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              {t("auth.resetPasswordTitle")}
            </h1>
            <p className="text-sm text-slate-500">
              {t("auth.passwordRequirementsTitle")}
            </p>
            <ul className="mt-2 text-start space-y-1 text-sm">
              {passwordRequirements.map((requirement) => {
                const met = requirement.test(pwd);
                return (
                  <li
                    key={requirement.key}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1 ${
                      met
                        ? "text-blue-700 bg-blue-100"
                        : "text-slate-600 bg-slate-100"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        met ? "bg-blue-700" : "bg-slate-500"
                      }`}
                      aria-hidden
                    />
                    {t(`auth.${requirement.key}`)}
                  </li>
                );
              })}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">
                {t("auth.newPassword")}
              </span>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder={t("auth.newPassword")}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">
                {t("auth.confirmNewPassword")}
              </span>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder={t("auth.confirmNewPassword")}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            {(formErrorKey || serverError) && (
              <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                {formErrorKey ? t(`auth.${formErrorKey}`) : serverError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-700 text-white py-3 font-semibold shadow-md transition hover:bg-blue-800 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              disabled={status === "loading"}
            >
              {status === "loading"
                ? t("auth.passwordUpdating")
                : t("auth.updatePassword")}
            </button>
          </form>

          {status === "done" && (
            <p
              className="text-sm text-green-700 bg-green-100 rounded-lg px-3 py-2 text-center"
              aria-live="polite"
            >
              {t("auth.passwordUpdated")}{" "}
              <Link to="/signin" className="font-semibold underline">
                {t("auth.signIn")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
