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
import { t } from "i18next";

function SignIn() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = React.useState({});
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [infoMessage, setInfoMessage] = React.useState("");
  const [resetMsg, setResetMsg] = React.useState("");

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
  }, [params]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
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
      if (!res.ok) {
        const text = await res.text();
        dispatch(signInFailure(text || `HTTP ${res.status}`));
        return;
      }
      const data = await res.json();
      if (data.success === false) {
        dispatch(signInFailure(data.message));
        return;
      }
      dispatch(signInSuccess(data));
      navigate("/");
    } catch (error) {
      dispatch(signInFailure(error.message));
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

  return (
    <div className="min-h-screen">
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
          <div className="-mt-2">
            <button
              type="button"
              onClick={handleForgot}
              className="text-sm text-blue-800 hover:underline"
            >
              {t("auth.forgotPassword", "Forgot password?")}
            </button>
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
