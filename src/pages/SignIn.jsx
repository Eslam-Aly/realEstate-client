import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import OAuth from "../components/OAuth.jsx";
import {
  signInFailure,
  signInStart,
  signInSuccess,
} from "../redux/user/userSlice.js";
import API from "../config/api.js";
import { useTranslation } from "react-i18next";
import { mapApiErrorMessage } from "../utils/mapApiErrorMessage.js";

function SignIn() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = React.useState({});
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [infoMessage, setInfoMessage] = React.useState("");
  const [resetMsg, setResetMsg] = React.useState("");
  const [verificationMsg, setVerificationMsg] = React.useState("");
  const [canResendVerification, setCanResendVerification] =
    React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");

  React.useEffect(() => {
    const verify = params.get("verify");
    if (verify === "sent") {
      setInfoMessage(
        t(
          "auth.verifyEmailSent",
          "We just sent you a verification email. Please check your inbox."
        )
      );
    }
  }, [params, t]);

  React.useEffect(() => {
    if (!resendTimer) return undefined;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    if (verificationMsg) setVerificationMsg("");
    if (id === "email") {
      setCanResendVerification(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      const res = await fetch(`${API}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const apiMessage =
          data?.message || `HTTP ${res.status}: ${res.statusText}`;
        setCanResendVerification(
          apiMessage === "Please verify your email before logging in"
        );
        const localized = mapApiErrorMessage(apiMessage, t);
        dispatch(signInFailure(localized || apiMessage));
        return;
      }
      if (!data) {
        dispatch(signInFailure(t("auth.errorGeneric")));
        return;
      }
      if (data.success === false) {
        setCanResendVerification(
          data.message === "Please verify your email before logging in"
        );
        const localized = mapApiErrorMessage(data.message, t);
        dispatch(signInFailure(localized || data.message));
        return;
      }
      setCanResendVerification(false);
      dispatch(signInSuccess(data));
      navigate("/");
    } catch (error) {
      setCanResendVerification(false);
      const localized = mapApiErrorMessage(error.message, t);
      dispatch(
        signInFailure(localized || error.message || t("auth.errorGeneric"))
      );
    }
  };

  const handleForgot = async () => {
    setResetMsg("");
    if (!formData.email) {
      setResetMsg(
        t("auth.enterEmailFirst", "Please enter your email above first.")
      );
      return;
    }
    try {
      const appLang = localStorage.getItem("appLang") || "en";
      const res = await fetch(`${API}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, lang: appLang }),
      });
      // Always show a generic success message regardless of existence
      if (!res.ok) {
        const _ = await res.text();
      }
      setResetMsg(
        t(
          "auth.resetLinkSent",
          "If the account exists, a password reset link has been sent to your email."
        )
      );
    } catch (e) {
      setResetMsg(
        t(
          "auth.resetLinkSent",
          "If the account exists, a password reset link has been sent to your email."
        )
      );
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setVerificationMsg(t("auth.enterEmailFirst"));
      return;
    }
    if (resendTimer > 0) {
      setVerificationMsg(
        t("auth.resendVerificationCountdown", { seconds: resendTimer })
      );
      return;
    }
    try {
      setVerificationMsg(t("auth.sendingVerification"));
      const appLang = localStorage.getItem("appLang") || "en";
      const res = await fetch(`${API}/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, lang: appLang }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.warn("send-verification failed:", txt);
      }
      setResendTimer(60);
      setVerificationMsg(t("auth.resendVerificationSent"));
    } catch (e) {
      console.warn("send-verification error:", e?.message);
      setVerificationMsg(t("auth.errorGeneric"));
    }
  };

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-lg mx-auto mt-16 p-6 md:mt-24 rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7">
          {t("auth.signInTitle")}
        </h1>
        {infoMessage && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-800 border border-green-200">
            {infoMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 ">
          <input
            onChange={handleChange}
            type="email"
            id="email"
            placeholder={t("auth.email")}
            className="border p-3 rounded-lg "
          />
          <input
            onChange={handleChange}
            type="password"
            id="password"
            placeholder={t("auth.password")}
            className="border p-3 rounded-lg "
          />
          <div className="-mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleForgot}
              className="text-sm text-blue-800 hover:underline cursor-pointer"
            >
              {t("auth.forgotPassword", "Forgot password?")}
            </button>
            {canResendVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                className={`text-sm font-medium transition cursor-pointer ${
                  resendTimer > 0
                    ? "text-slate-500 cursor-not-allowed"
                    : "text-blue-800 hover:underline"
                }`}
                disabled={resendTimer > 0}
              >
                {resendTimer > 0
                  ? t("auth.resendVerificationCountdown", {
                      seconds: resendTimer,
                    })
                  : t("auth.resendVerification")}
              </button>
            )}
          </div>
          <button
            disabled={loading}
            type="submit"
            className="bg-blue-800 text-white p-3 rounded-lg font-semibold"
          >
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
          <OAuth />
        </form>
        {resetMsg && <p className="mt-4 text-sm text-gray-700">{resetMsg}</p>}
        {verificationMsg && (
          <p className="mt-2 text-sm text-blue-800">{verificationMsg}</p>
        )}
        <div className="flex gap-2 mt-5">
          <p>{t("auth.noAccount")}</p>
          <Link to="/signup" className="text-blue-800 font-semibold">
            {" "}
            {t("auth.signUp")}
          </Link>
        </div>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}
export default SignIn;
