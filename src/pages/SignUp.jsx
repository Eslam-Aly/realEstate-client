import React from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth.jsx";
import API from "../config/api.js";
import { useTranslation } from "react-i18next";
import { mapApiErrorMessage } from "../utils/mapApiErrorMessage.js";

function SignUp() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const passwordRequirements = React.useMemo(
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
    requirement.test(formData.password)
  );
  const navigate = useNavigate();
  const handleChange = async (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!meetsAllRequirements) {
        setError(t("auth.passwordNotStrongEnough"));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t("auth.errorPasswordMismatch"));
        return;
      }
      setLoading(true);
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };
      const appLang = localStorage.getItem("appLang") || "en";
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) {
        setLoading(false);
        const apiMessage =
          data?.message || `HTTP ${res.status}: ${res.statusText}`;
        const localized = mapApiErrorMessage(apiMessage, t);
        setError(localized || apiMessage);
        return;
      }
      // Send verification email immediately after successful signup
      try {
        const verifyRes = await fetch(`${API}/auth/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: formData.email, lang: appLang }),
        });
        // Best-effort: don't block navigation on errors
        if (!verifyRes.ok) {
          const txt = await verifyRes.text();
          console.warn("send-verification failed:", txt);
        }
      } catch (e) {
        console.warn("send-verification error:", e?.message);
      }
      setLoading(false);
      setError(null);
      // Optionally pass a flag to signin so it can show a notice
      navigate("/signin?verify=sent");
    } catch (error) {
      setLoading(false);
      const localized = mapApiErrorMessage(error.message, t);
      setError(localized || error.message || t("auth.errorGeneric"));
    }
  };

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-lg mx-auto mt-16 md:mt-24 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7">
          {t("auth.signUpTitle")}
        </h1>

        <form
          data-testid="signup-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 "
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t("auth.username")}
            <input
              onChange={handleChange}
              type="text"
              id="username"
              value={formData.username}
              placeholder={t("auth.username")}
              className="border p-3 rounded-lg text-base font-normal text-slate-900"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t("auth.email")}
            <input
              onChange={handleChange}
              type="email"
              id="email"
              value={formData.email}
              placeholder={t("auth.email")}
              className="border p-3 rounded-lg text-base font-normal text-slate-900"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t("auth.password")}
            <input
              onChange={handleChange}
              type="password"
              id="password"
              value={formData.password}
              placeholder={t("auth.password")}
              className="border p-3 rounded-lg text-base font-normal text-slate-900"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t("auth.confirmPassword")}
            <input
              onChange={handleChange}
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              placeholder={t("auth.confirmPassword")}
              className="border p-3 rounded-lg text-base font-normal text-slate-900"
              required
            />
          </label>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm text-slate-600 mb-6">
            <p className="font-medium text-slate-800">
              {t("auth.passwordRequirementsTitle")}
            </p>
            <ul className="space-y-1">
              {passwordRequirements.map((requirement) => {
                const met = requirement.test(formData.password);
                return (
                  <li
                    key={requirement.key}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1 ${
                      met
                        ? "text-blue-700 bg-blue-100"
                        : "text-slate-600 bg-white"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        met ? "bg-blue-700" : "bg-slate-400"
                      }`}
                    />
                    {t(`auth.${requirement.key}`)}
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            disabled={loading}
            type="submit"
            data-testid="signup-submit"
            className="bg-blue-800 text-white p-3 rounded-lg font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("auth.loading") : t("auth.signUp")}
          </button>
          <OAuth />
        </form>
        <div className="flex gap-2 mt-5">
          <p>{t("auth.haveAccount")}</p>
          <Link to="/signin" className="text-blue-800 font-semibold">
            {" "}
            {t("auth.signIn")}
          </Link>
        </div>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}
export default SignUp;
