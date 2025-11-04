import React from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth.jsx";
import API from "../config/api.js";
import { t } from "i18next";

function SignUp() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({});
  const navigate = useNavigate();
  const handleChange = async (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }
      setLoading(false);
      setError(null);
      navigate("/signin");
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto mt-16 md:mt-24 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7">
          {t("auth.signUpTitle")}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 ">
          <input
            onChange={handleChange}
            type="text"
            id="username"
            placeholder={t("auth.username")}
            className="border p-3 rounded-lg "
          />
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
          <button
            disabled={loading}
            type="submit"
            className="bg-blue-800 text-white p-3 rounded-lg font-semibold"
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
