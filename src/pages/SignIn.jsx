import React from "react";
import { Link, useNavigate } from "react-router-dom";
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

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto mt-16 p-6 md:mt-24 rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7">
          {t("auth.signInTitle")}
        </h1>
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
          <button
            disabled={loading}
            type="submit"
            className="bg-blue-800 text-white p-3 rounded-lg font-semibold"
          >
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
          <OAuth />
        </form>
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
